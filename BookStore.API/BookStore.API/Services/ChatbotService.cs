using BookStore.API.Data;
using BookStore.API.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text;

namespace BookStore.API.Services
{
    public class ChatbotService : IChatbotService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly IHttpClientFactory _httpClientFactory;

        public ChatbotService(AppDbContext context, IConfiguration config, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _config = config;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<ChatResponseDto> GetChatResponseAsync(ChatRequestDto request)
        {
            var userMessage = request.Message.Trim();

            // 1. Phân tích Dữ liệu TOÀN BỘ SÁCH trong DB 
            // Model Gemini 2.5 Flash hỗ trợ tới 1 Triệu Token nên việc nạp nguyên cuốn catalog sách (khoảng vài chục nghìn token) vào mỗi prompt 
            // là phương pháp RAG triệt để nhất mà không cần Vector Search cho ứng dụng có cỡ vừa/nhỏ.
            
            var allBooks = await _context.Books
                .Include(b => b.Category)
                .Include(b => b.Author)
                .Where(b => !b.IsHidden)
                .Select(b => new
                {
                Id = b.BookId,
                Title = b.Title,
                Price = b.Price,
                Category = b.Category != null ? b.Category.Name : "Khác",
                Author = b.Author != null ? b.Author.Name : "Khác",
                Description = string.IsNullOrEmpty(b.Description) ? "" : (b.Description.Length > 100 ? b.Description.Substring(0, 100) + "..." : b.Description)
            })
            .ToListAsync();

            // 2. Tính TỔNG SỐ LƯỢNG ĐÃ BÁN của từng sách
            var soldStats = await _context.OrderItems
                .Include(oi => oi.Order)
                .Where(oi => oi.Order.Status == "Delivered")
                .GroupBy(oi => oi.BookId)
                .Select(g => new { BookId = g.Key, Sold = g.Sum(oi => oi.Quantity) })
                .ToDictionaryAsync(x => x.BookId, x => x.Sold);

            // 3. Tính ĐIỂM ĐÁNH GIÁ TRUNG BÌNH của từng sách
            var ratingStats = await _context.Reviews
                .GroupBy(r => r.BookId)
                .Select(g => new { 
                    BookId = g.Key, 
                    Rating = Math.Round(g.Average(r => r.Rating), 1), 
                    ReviewCount = g.Count() 
                })
                .ToDictionaryAsync(x => x.BookId, x => x);

            // 4. Lọc sách thông minh để giảm Token Size gửi lên API (Tránh bị Rate Limit 429)
            var queryWords = userMessage.ToLower().Split(new[] { ' ', ',', '.', '?' }, StringSplitOptions.RemoveEmptyEntries).Where(w => w.Length > 2).ToList();
            
            var matchedBooks = allBooks.Where(b => queryWords.Any(w => 
                b.Title.ToLower().Contains(w) || 
                b.Category.ToLower().Contains(w) || 
                b.Author.ToLower().Contains(w))).Take(3).ToList();

            var topSellers = allBooks.OrderByDescending(b => soldStats.ContainsKey(b.Id) ? soldStats[b.Id] : 0).Take(1).ToList();
            var topRated = allBooks.OrderByDescending(b => ratingStats.ContainsKey(b.Id) ? ratingStats[b.Id].Rating : 0).Take(1).ToList();

            // Gộp lại và loại bỏ trùng lặp (chỉ cho AI xem tối đa ~5 quyển để tối ưu lượng Token tối đa)
            var selectedBooks = matchedBooks.Union(topSellers).Union(topRated).DistinctBy(b => b.Id).ToList();

            var catalogData = selectedBooks.Select(b => new {
                b.Title,
                b.Author,
                b.Category,
                b.Price,
                // Lược bỏ bớt Description
                Sold = soldStats.ContainsKey(b.Id) ? soldStats[b.Id] : 0,
                Rating = ratingStats.ContainsKey(b.Id) ? ratingStats[b.Id].Rating : 0
            }).ToList();

            // Để tránh json quá dài và mất định dạng, bỏ qua null values và format nhỏ gọn
            var contextJson = JsonSerializer.Serialize(catalogData, new JsonSerializerOptions { DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull });

            // 5. Tạo System Instruction cung cấp Database cho Bot
            var systemInstruction = $@"Vai trò: AI CSKH của nhà sách Tiến Thọ.
Khối JSON DB Sách: {contextJson}
Quy tắc:
1. AI CHỈ ĐƯỢC dùng thông tin từ JSON DB trên. Tuyệt đối KHÔNG tự sáng tác thêm sách.
2. Trả lời CỰC KỲ NGẮN GỌN (1-2 câu). Tuy nhiên, PHẢI nêu ĐẦY ĐỦ các thông tin mà khách đang hỏi (như Tên, Tác giả, Giá, Số lượng bán). Giá format tiền kèm ' VNĐ'.
3. KHÔNG chào hỏi lan man hay cảm ơn dông dài. Bỏ ngay các câu nhận xét, tư vấn, hoặc khuyên bảo thêm nếu khách không yêu cầu. Đi thẳng vào vấn đề.
";

            // 6. Gửi Request lên Gemini 2.5 Flash API
            var apiKey = _config["Gemini:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                return new ChatResponseDto { Response = "Xin lỗi, hệ thống AI chưa được nhập khoá cấu hình." };
            }

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={apiKey}";

            var chatHistory = new List<object>();

            // Chèn lịch sử chat trước đó (nếu có), giới hạn tối đa 3 ngữ cảnh gần nhất để tiết kiệm token tối đa
            // TẠM ẨN: Ẩn phần nhớ lịch sử trò chuyện đi để tiết kiệm Token tối đa nhất lúc này
            /*
            if (request.History != null && request.History.Any())
            {
                var recentHistory = request.History.TakeLast(3);
                foreach (var msg in recentHistory)
                {
                    chatHistory.Add(new
                    {
                        role = msg.Role,
                        parts = new[] { new { text = msg.Text } }
                    });
                }
            }
            */

            // Chèn câu hỏi mới nhất của user
            chatHistory.Add(new
            {
                role = "user",
                parts = new[] { new { text = userMessage } }
            });

            var payload = new
            {
                system_instruction = new
                {
                    parts = new { text = systemInstruction }
                },
                contents = chatHistory.ToArray(),
                generationConfig = new
                {
                    temperature = 0.5,
                    maxOutputTokens = 800
                }
            };

            var client = _httpClientFactory.CreateClient("Gemini");
            var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await client.PostAsync(url, jsonContent);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorResponse = await response.Content.ReadAsStringAsync();
                if ((int)response.StatusCode == 429) 
                {
                    return new ChatResponseDto { Response = "Tài khoản Google API Key của bạn đã hết lượt truy cập miễn phí (quá giới hạn Request mỗi phút / mỗi ngày của Google). Bạn vui lòng chờ thêm 1-2 phút, hoặc phải tạo một API Key mới để tiếp tục sử dụng nhé!" };
                }
                return new ChatResponseDto { Response = "Xin lỗi, hiện tại hệ thống AI đang quá tải do có nhiều lượt truy cập. Bạn vui lòng thử lại sau một lát nhé!" };
            }

            var resultString = await response.Content.ReadAsStringAsync();
            using var jsonDocument = JsonDocument.Parse(resultString);
            
            try
            {
                var botResponse = jsonDocument.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                return new ChatResponseDto { Response = botResponse ?? "Xin lỗi, mình không hiểu ý bạn. Bạn có thể nói rõ hơn được không?" };
            }
            catch
            {
                return new ChatResponseDto { Response = "Đã có lỗi khi xử lý câu trả lời kỹ thuật của Bot." };
            }
        }
    }
}
