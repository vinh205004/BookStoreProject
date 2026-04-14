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
                    Description = b.Description // Truyền luôn cả mô tả để Bot giải thích cốt truyện
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

            // 4. Kết hợp toàn bộ Sách + Đánh giá + Doanh số để "Train" nhanh cho Bot
            var catalogData = allBooks.Select(b => new {
                b.Title,
                b.Author,
                b.Category,
                b.Price,
                b.Description,
                Sold = soldStats.ContainsKey(b.Id) ? soldStats[b.Id] : 0,
                Rating = ratingStats.ContainsKey(b.Id) ? ratingStats[b.Id].Rating : 0,
                ReviewCount = ratingStats.ContainsKey(b.Id) ? ratingStats[b.Id].ReviewCount : 0
            }).ToList();

            // Để tránh json quá dài và mất định dạng, bỏ qua null values và format nhỏ gọn
            var contextJson = JsonSerializer.Serialize(catalogData, new JsonSerializerOptions { DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull });

            // 5. Tạo Prompt Dạy Bot (System Instruction)
            var prompt = $@"
Bạn là nhân viên tư vấn sách 5 sao, nhiệt tình, chuyên nghiệp của nhà sách BookStore.
Nhà sách BookStore hiện đang kinh doanh TOÀN BỘ danh sách các cuốn sách dưới đây (JSON Array). 
Mỗi cuốn sách bao gồm Tên (Title), Tác giả (Author), Danh mục (Category), Giá (Price), Mô tả (Description), Số lượng bán (Sold), 
Đánh giá trung bình (Rating), và Số lượt đánh giá (ReviewCount):

{contextJson}

Khách hàng của bạn đang hỏi: ""{userMessage}""

Quy tắc bắt buộc phải tuân thủ để trả lời:
1. LUÔN LUÔN tìm kiến thức và dữ liệu sách trong khối văn bản JSON được cung cấp bên trên để trả lời khách hàng. Bạn tuyệt đối KHÔNG ĐƯỢC đề xuất phần sách nào CÓ THẬT BÊN NGOÀI nhưng lại KHÔNG CÓ TRONG DANH SÁCH này. Bạn chỉ bán sách của riêng cửa hàng này.
2. Nếu khách hỏi sách TỐT NHẤT NGAY BÂY GIỜ, BÁN CHẠY HOẶC ĐÁNH GIÁ CAO: bạn PHẢI quét trong danh sách để tìm cuốn có 'Sold' lớn nhất, hoặc 'Rating' cao nhất có nhiều 'ReviewCount' để trả lời khách hàng. Nếu như cửa hàng mới khởi tạo (Rating hay Sold = 0) thì bạn lấy một sách ngẫu nhiên trong danh mục có liên quan dựa vào Title hoặc Description để gợi ý với cách nói thân thiện ""Cuốn sách rất thích hợp để bạn trở thành người đầu tiên đánh giá..."".
3. Nếu khách tìm theo THỂ LOẠI HOẶC CỐT TRUYỆN: Hãy tự đọc trường 'Description' và 'Category' trong JSON để chọn 2-3 cuốn có nội dung khớp nhất tư vấn cho họ.
4. Trả lời nhiệt tình, ngôn từ tự nhiên, độ dài VỪA PHẢI, rạch ròi bằng tiếng Việt, ĐƯỢC PHÉP thêm biểu tượng cảm xúc (Moji) vui vẻ. Sách phải ghi đúng tên tác giả. Giá sách lấy ở trường 'Price' hãy định dạng hàng nghìn kẹp với chữ 'VNĐ' phía sau (Ví dụ 120000 VNĐ). 
";

            // 6. Gửi Request lên Gemini 2.5 Flash API
            var apiKey = _config["Gemini:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                return new ChatResponseDto { Response = "Xin lỗi, hệ thống AI chưa được nhập khoá cấu hình." };
            }

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={apiKey}";

            var payload = new
            {
                contents = new[]
                {
                    new
                    {
                        role = "user",
                        parts = new[] { new { text = prompt } }
                    }
                },
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
