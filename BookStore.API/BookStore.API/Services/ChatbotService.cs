using BookStore.API.Data;
using BookStore.API.DTOs;
using BookStore.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace BookStore.API.Services
{
    public class ChatbotService : IChatbotService
    {
        private const int MaxMatchedBooks = 6;
        private const int MaxTopBooks = 2;
        private const int MaxHistoryMessages = 4;
        private const int MaxHistoryChars = 350;
        private const int MaxUserMessageChars = 500;

        private static readonly string[] StopWords =
        {
            "toi", "minh", "ban", "cho", "hoi", "can", "tim", "sach", "quyen",
            "cuon", "mua", "co", "khong", "nao", "gi", "ve", "la", "va", "hoac",
            "hay", "nhat", "tu", "van", "giup", "voi", "gia", "bao", "nhieu",
            "hang", "ton", "kho", "giam", "uu", "dai", "khuyen", "mai", "sale",
            "voucher", "dang", "con", "het", "duoi", "tren", "tu", "den", "toi",
            "khoang", "nho", "hon", "lon", "qua", "khong", "tac", "ai", "ma", "duoc",
            "thoi", "nhe", "nha", "lay", "chon"
        };

        private static readonly string[] DescriptionIntentWords =
        {
            "noi dung", "cot truyen", "gioi thieu", "ke ve", "tom tat"
        };

        private static readonly string[] TopSellerIntentWords =
        {
            "ban chay", "mua nhieu", "hot", "pho bien", "top"
        };

        private static readonly string[] TopRatedIntentWords =
        {
            "danh gia cao", "rating cao", "duoc thich", "tot nhat"
        };

        private static readonly string[] ExpensiveIntentWords =
        {
            "dat nhat", "gia cao nhat", "mac nhat", "cao tien nhat"
        };

        private static readonly string[] CheapIntentWords =
        {
            "re nhat", "gia re nhat", "thap nhat", "it tien nhat"
        };

        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<ChatbotService> _logger;
        private readonly IWebHostEnvironment _environment;

        public ChatbotService(
            AppDbContext context,
            IConfiguration config,
            IHttpClientFactory httpClientFactory,
            ILogger<ChatbotService> logger,
            IWebHostEnvironment environment)
        {
            _context = context;
            _config = config;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
            _environment = environment;
        }

        public async Task<ChatResponseDto> GetChatResponseAsync(ChatRequestDto request)
        {
            var userMessage = Truncate(request.Message.Trim(), MaxUserMessageChars);
            if (string.IsNullOrWhiteSpace(userMessage))
            {
                return new ChatResponseDto { Response = "Bạn vui lòng nhập câu hỏi trước khi gửi nhé." };
            }

            var normalizedMessage = NormalizeVietnamese(userMessage);
            var queryWords = ExtractQueryWords(normalizedMessage);
            var shouldIncludeDescription = DescriptionIntentWords.Any(normalizedMessage.Contains);
            var wantsTopSellers = TopSellerIntentWords.Any(normalizedMessage.Contains);
            var wantsTopRated = TopRatedIntentWords.Any(normalizedMessage.Contains);
            var wantsExpensiveBooks = ExpensiveIntentWords.Any(normalizedMessage.Contains);
            var wantsCheapBooks = CheapIntentWords.Any(normalizedMessage.Contains);
            var wantsAuthor = IsAuthorIntent(normalizedMessage);
            var wantsPrice = IsPriceIntent(normalizedMessage);
            var wantsStock = IsStockIntent(normalizedMessage);
            var wantsDiscount = IsDiscountIntent(normalizedMessage);
            var priceFilter = TryParsePriceFilter(normalizedMessage);
            var budget = TryParseBudget(normalizedMessage);
            var requestedQuantity = TryParseRequestedQuantity(normalizedMessage);

            if (IsQuantityOnlyFollowUp(normalizedMessage, queryWords, requestedQuantity) &&
                request.History != null &&
                request.History.Any())
            {
                var context = ExtractConversationContext(request.History);
                priceFilter ??= context.PriceFilter;
                budget ??= context.Budget ?? context.PriceFilter?.MaxPrice;
            }

            var wantsBudgetRecommendation = budget.HasValue ||
                                            normalizedMessage.Contains("nen mua") ||
                                            normalizedMessage.Contains("mua sach nao") ||
                                            normalizedMessage.Contains("chon sach nao");
            var wantsGeneralRecommendation = queryWords.Count == 0 ||
                                             normalizedMessage.Contains("goi y") ||
                                             normalizedMessage.Contains("tu van") ||
                                             wantsBudgetRecommendation;
            var wantsAiAdvice = !budget.HasValue &&
                                !wantsTopSellers &&
                                !wantsTopRated &&
                                !wantsExpensiveBooks &&
                                !wantsCheapBooks &&
                                !wantsAuthor &&
                                !wantsPrice &&
                                !wantsStock &&
                                !wantsDiscount &&
                                IsAdvisoryIntent(normalizedMessage, queryWords);

            var books = await _context.Books
                .AsNoTracking()
                .Where(b => !b.IsHidden)
                .Select(b => new BookContextItem
                {
                    Id = b.BookId,
                    Title = b.Title,
                    Price = b.Price,
                    CategoryId = b.CategoryId,
                    Discount = SanitizeDiscountBadge(b.DiscountBadge),
                    Category = b.Category != null ? b.Category.Name : "Khác",
                    Author = b.Author != null ? b.Author.Name : "Khác",
                    Stock = b.Stock,
                    Description = string.IsNullOrWhiteSpace(b.Description)
                        ? null
                        : (b.Description.Length > 90 ? b.Description.Substring(0, 90) + "..." : b.Description),
                    DiscountedPrice = b.DiscountedPrice
                })
                .ToListAsync();

            var soldStats = await _context.OrderItems
                .AsNoTracking()
                .Where(oi => oi.Order != null && oi.Order.Status == "Delivered")
                .GroupBy(oi => oi.BookId)
                .Select(g => new { BookId = g.Key, Sold = g.Sum(oi => oi.Quantity) })
                .ToDictionaryAsync(x => x.BookId, x => x.Sold);

            var ratingStats = await _context.Reviews
                .AsNoTracking()
                .GroupBy(r => r.BookId)
                .Select(g => new
                {
                    BookId = g.Key,
                    Rating = Math.Round(g.Average(r => r.Rating), 1)
                })
                .ToDictionaryAsync(x => x.BookId, x => x.Rating);

            var now = DateTime.UtcNow;
            var activeVouchers = await _context.Vouchers
                .AsNoTracking()
                .Where(v => v.IsActive && v.StartDate <= now && v.ExpirationDate >= now && v.UsedCount < v.Quantity)
                .ToListAsync();

            foreach (var book in books)
            {
                book.Sold = soldStats.GetValueOrDefault(book.Id);
                book.Rating = ratingStats.GetValueOrDefault(book.Id);
                book.SearchText = NormalizeVietnamese($"{book.Title} {book.Author} {book.Category} {book.Description}");
                ApplyBestVoucher(book, activeVouchers);
            }

            var searchableBooks = ApplyCategoryHint(books, normalizedMessage).ToList();

            var matchedBooks = searchableBooks
                .Select(book => new
                {
                    Book = book,
                    Score = CalculateMatchScore(book, queryWords)
                })
                .Where(x => queryWords.Count == 0 || x.Score > 0)
                .OrderByDescending(x => x.Score)
                .ThenByDescending(x => x.Book.Rating)
                .ThenByDescending(x => x.Book.Sold)
                .Take(MaxMatchedBooks)
                .Select(x => x.Book)
                .ToList();

            var topSellers = searchableBooks
                .OrderByDescending(b => b.Sold)
                .ThenByDescending(b => b.Rating)
                .Take(MaxTopBooks);

            var topRated = searchableBooks
                .Where(b => b.Rating > 0)
                .OrderByDescending(b => b.Rating)
                .ThenByDescending(b => b.Sold)
                .Take(MaxTopBooks);

            if (wantsExpensiveBooks)
            {
                var expensiveBooks = ApplyPriceFilter(searchableBooks, priceFilter, useDiscountedPrice: false)
                    .OrderByDescending(b => b.Price)
                    .Take(3);

                return new ChatResponseDto
                {
                    Response = BuildBookListResponse("Sách đắt nhất trong kho", expensiveBooks)
                };
            }

            if (wantsCheapBooks)
            {
                var cheapBooks = ApplyPriceFilter(searchableBooks, priceFilter, useDiscountedPrice: false)
                    .OrderBy(b => b.Price)
                    .Take(3);

                return new ChatResponseDto
                {
                    Response = BuildBookListResponse("Sách rẻ nhất trong kho", cheapBooks)
                };
            }

            if (wantsDiscount)
            {
                var discountCandidates = GetBudgetCandidateBooks(searchableBooks.Where(b => !string.IsNullOrWhiteSpace(b.Discount)).ToList(), queryWords);
                var discountedBooks = ApplyPriceFilter(discountCandidates, priceFilter, useDiscountedPrice: true)
                    .OrderByDescending(b => b.Rating)
                    .ThenByDescending(b => b.Sold)
                    .ThenBy(b => b.EffectivePrice)
                    .Take(5)
                    .ToList();

                return new ChatResponseDto
                {
                    Response = discountedBooks.Count == 0
                        ? "Hiện chưa tìm thấy sách đang có ưu đãi phù hợp trong kho."
                        : BuildBookListResponse("Sách đang có ưu đãi", discountedBooks)
                };
            }

            var bestMatchedBooks = SelectBestMatches(matchedBooks, queryWords).ToList();

            if (wantsAuthor && bestMatchedBooks.Count > 0)
            {
                return new ChatResponseDto
                {
                    Response = BuildAuthorResponse(bestMatchedBooks)
                };
            }

            if (wantsPrice && bestMatchedBooks.Count > 0)
            {
                return new ChatResponseDto
                {
                    Response = BuildBookListResponse("Giá sách phù hợp", bestMatchedBooks)
                };
            }

            if (wantsStock && bestMatchedBooks.Count > 0)
            {
                return new ChatResponseDto
                {
                    Response = BuildStockResponse(bestMatchedBooks)
                };
            }

            if (budget.HasValue)
            {
                var budgetCandidates = GetBudgetCandidateBooks(searchableBooks, queryWords);
                if (!requestedQuantity.HasValue)
                {
                    var recommendedBooks = SelectBudgetRecommendations(budgetCandidates, budget.Value, 3);
                    return new ChatResponseDto
                    {
                        Response = recommendedBooks.Count == 0
                            ? $"Chưa tìm thấy sách phù hợp trong kho với ngân sách {FormatPrice(budget.Value)}."
                            : BuildBudgetSuggestionResponse(budget.Value, recommendedBooks)
                    };
                }

                var quantity = requestedQuantity.Value;
                var affordableBooks = SelectBooksWithinBudget(budgetCandidates, budget.Value, quantity);

                return new ChatResponseDto
                {
                    Response = affordableBooks.Count == 0
                        ? $"Chưa tìm thấy combo phù hợp trong kho với ngân sách {FormatPrice(budget.Value)}."
                        : BuildBudgetResponse(budget.Value, quantity, affordableBooks)
                };
            }

            if (wantsTopSellers && !wantsTopRated && !shouldIncludeDescription)
            {
                return new ChatResponseDto
                {
                    Response = BuildBookListResponse("Sách bán chạy", topSellers)
                };
            }

            if (wantsTopRated && !wantsTopSellers && !shouldIncludeDescription)
            {
                return new ChatResponseDto
                {
                    Response = BuildBookListResponse("Sách được đánh giá cao", topRated)
                };
            }

            IEnumerable<BookContextItem> selectedBooksQuery = matchedBooks;

            if (wantsAiAdvice || wantsGeneralRecommendation || wantsTopSellers)
            {
                selectedBooksQuery = selectedBooksQuery.Concat(topSellers);
            }

            if (wantsAiAdvice || wantsGeneralRecommendation || wantsTopRated)
            {
                selectedBooksQuery = selectedBooksQuery.Concat(topRated);
            }

            var selectedBooks = selectedBooksQuery
                .DistinctBy(b => b.Id)
                .Take(wantsAiAdvice || wantsGeneralRecommendation || wantsTopSellers || wantsTopRated ? 8 : 6)
                .ToList();

            if (selectedBooks.Count == 0)
            {
                return new ChatResponseDto
                {
                    Response = "Mình chưa tìm thấy sách phù hợp trong kho. Bạn thử nhập tên sách, tác giả hoặc thể loại cụ thể hơn nhé."
                };
            }

            var catalogData = selectedBooks.Select(b => new CompactBookContext
            {
                T = b.Title,
                A = b.Author,
                C = b.Category,
                P = b.Price,
                DP = b.DiscountedPrice,
                D = b.Discount,
                V = b.DiscountVoucherCode,
                S = b.Sold,
                R = b.Rating,
                Desc = shouldIncludeDescription ? b.Description : null
            });

            var contextJson = JsonSerializer.Serialize(catalogData, new JsonSerializerOptions
            {
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            });

            var systemInstruction = $"""
                Bạn là AI tư vấn của nhà sách Tiến Thọ. Chỉ dùng JSON này, không bịa sách ngoài kho: {contextJson}
                Schema: t=tên, a=tác giả, c=thể loại, p=giá, dp=giá ưu đãi, d=ưu đãi, v=voucher, s=đã bán, r=đánh giá, desc=mô tả.
                Trả lời tiếng Việt tự nhiên như nhân viên tư vấn, tối đa 3 câu. Chọn 1-3 sách hợp nhất, nêu lý do ngắn dựa trên thể loại/đánh giá/ưu đãi/mô tả; tránh liệt kê máy móc.
                Không gọi s là tồn kho. Không nói còn hàng nếu không có dữ liệu tồn kho. Nếu không đủ dữ liệu, nói chưa tìm thấy trong kho.
                """;

            var apiKey = _config["ChatAnywhere:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return new ChatResponseDto { Response = "Xin lỗi, hệ thống AI chưa được cấu hình khóa API." };
            }

            var messages = new List<object>
            {
                new { role = "system", content = systemInstruction }
            };

            if (request.History != null && request.History.Any())
            {
                foreach (var msg in request.History.TakeLast(MaxHistoryMessages))
                {
                    if (string.IsNullOrWhiteSpace(msg.Text))
                    {
                        continue;
                    }

                    messages.Add(new
                    {
                        role = msg.Role == "model" ? "assistant" : "user",
                        content = Truncate(msg.Text.Trim(), MaxHistoryChars)
                    });
                }
            }

            messages.Add(new { role = "user", content = userMessage });

            var payload = new
            {
                model = _config["ChatAnywhere:Model"] ?? "gpt-4o-mini",
                messages = messages.ToArray(),
                temperature = 0.45,
                max_tokens = 240
            };

            var client = _httpClientFactory.CreateClient("ChatAnywhere");
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

            using var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            using var response = await client.PostAsync("https://api.chatanywhere.tech/v1/chat/completions", jsonContent);

            if (!response.IsSuccessStatusCode)
            {
                var errorResponse = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("ChatAnywhere request failed with status {StatusCode}: {Response}", response.StatusCode, errorResponse);

                if ((int)response.StatusCode == 429)
                {
                    if (_environment.IsDevelopment())
                    {
                        return new ChatResponseDto { Response = $"Provider AI trả 429: {Truncate(errorResponse, 300)}" };
                    }

                    return new ChatResponseDto { Response = "Hệ thống AI đang quá tải hoặc hết lượt gọi. Bạn vui lòng thử lại sau nhé." };
                }

                if (_environment.IsDevelopment())
                {
                    return new ChatResponseDto { Response = $"Provider AI trả {(int)response.StatusCode}: {Truncate(errorResponse, 300)}" };
                }

                return new ChatResponseDto { Response = "Xin lỗi, hiện tại hệ thống AI đang gặp lỗi. Bạn vui lòng thử lại sau một lát nhé." };
            }

            var resultString = await response.Content.ReadAsStringAsync();
            try
            {
                using var jsonDocument = JsonDocument.Parse(resultString);
                var botResponse = jsonDocument.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                return new ChatResponseDto
                {
                    Response = string.IsNullOrWhiteSpace(botResponse)
                        ? "Xin lỗi, mình chưa hiểu ý bạn. Bạn có thể nói rõ hơn được không?"
                        : CleanBotResponse(botResponse)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse ChatAnywhere response: {Response}", resultString);
                return new ChatResponseDto { Response = "Đã có lỗi khi xử lý câu trả lời của AI." };
            }
        }

        private static List<string> ExtractQueryWords(string normalizedMessage)
        {
            return normalizedMessage
                .Split(new[] { ' ', ',', '.', '?', '!', ';', ':', '-', '_' }, StringSplitOptions.RemoveEmptyEntries)
                .Where(w => w.Length > 1 && !StopWords.Contains(w) && !LooksLikeMoneyToken(w))
                .Distinct()
                .Take(8)
                .ToList();
        }

        private static bool LooksLikeMoneyToken(string value)
        {
            return Regex.IsMatch(value, @"^\d+[k]?$") ||
                   Regex.IsMatch(value, @"^\d+(vnd|dong|d)$");
        }

        private static int CalculateMatchScore(BookContextItem book, IReadOnlyCollection<string> queryWords)
        {
            if (queryWords.Count == 0)
            {
                return 1;
            }

            var score = 0;
            foreach (var word in queryWords)
            {
                if (ContainsSearchToken(book.SearchText, word))
                {
                    score++;
                }
            }

            return score;
        }

        private static bool ContainsSearchToken(string text, string word)
        {
            return Regex.IsMatch(text, $@"(?<![a-z0-9]){Regex.Escape(word)}(?![a-z0-9])");
        }

        private static string NormalizeVietnamese(string value)
        {
            var normalized = value.ToLowerInvariant().Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder(normalized.Length);

            foreach (var character in normalized)
            {
                var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(character);
                if (unicodeCategory != UnicodeCategory.NonSpacingMark)
                {
                    builder.Append(character == '\u0111' ? 'd' : character);
                }
            }

            return builder.ToString().Normalize(NormalizationForm.FormC);
        }

        private static string Truncate(string value, int maxLength)
        {
            return value.Length <= maxLength ? value : value[..maxLength];
        }

        private static string BuildBookListResponse(string title, IEnumerable<BookContextItem> books)
        {
            var lines = books
                .Select((b, index) =>
                {
                    var parts = new List<string>
                    {
                        $"{index + 1}. {b.Title}",
                        $"giá {FormatPrice(b.Price)}"
                    };

                    if (b.DiscountedPrice.HasValue)
                    {
                        parts.Add($"còn {FormatPrice(b.DiscountedPrice.Value)} sau ưu đãi {b.Discount}");
                    }

                    if (b.Sold > 0)
                    {
                        parts.Add($"đã bán {b.Sold} quyển");
                    }

                    if (b.Rating > 0)
                    {
                        parts.Add($"đánh giá {b.Rating}/5");
                    }

                    if (!string.IsNullOrWhiteSpace(b.Discount))
                    {
                        if (!b.DiscountedPrice.HasValue)
                        {
                            parts.Add($"ưu đãi {b.Discount}");
                        }

                        if (!string.IsNullOrWhiteSpace(b.DiscountVoucherCode))
                        {
                            parts.Add($"mã {b.DiscountVoucherCode}");
                        }
                    }

                    return string.Join(", ", parts);
                });

            return $"{title}: {string.Join("; ", lines)}.";
        }

        private static string BuildConsultingResponse(string opening, IEnumerable<BookContextItem> books)
        {
            var selectedBooks = books.Take(3).ToList();
            if (selectedBooks.Count == 0)
            {
                return "Mình chưa tìm thấy sách phù hợp trong kho hiện tại.";
            }

            var suggestions = selectedBooks.Select((book, index) =>
                $"{index + 1}. {book.Title} - {BuildConsultingReason(book)}");

            var favorite = selectedBooks
                .OrderByDescending(CalculateRecommendationScore)
                .First();

            return $"{opening}: {string.Join("; ", suggestions)}. Nếu chưa có gu rõ, mình nghiêng về \"{favorite.Title}\" vì lựa chọn này khá an toàn để bắt đầu.";
        }

        private static string BuildConsultingReason(BookContextItem book)
        {
            var priceText = book.DiscountedPrice.HasValue
                ? $"đang có ưu đãi, còn {FormatPrice(book.DiscountedPrice.Value)}"
                : $"giá {FormatPrice(book.Price)}";

            var reasons = new List<string>();
            if (book.Rating >= 4.5)
            {
                reasons.Add("điểm đánh giá tốt");
            }
            else if (book.Rating >= 4)
            {
                reasons.Add("phản hồi khá ổn");
            }

            if (book.Sold >= 4)
            {
                reasons.Add("đang được nhiều khách chọn");
            }

            if (!string.IsNullOrWhiteSpace(book.Category))
            {
                reasons.Add($"thuộc nhóm {book.Category}");
            }

            var reasonText = reasons.Count > 0
                ? string.Join(", ", reasons.Take(2))
                : "dễ đọc và phù hợp để tham khảo";

            return $"{priceText}, {reasonText}";
        }

        private static void ApplyBestVoucher(BookContextItem book, IReadOnlyCollection<Voucher> activeVouchers)
        {
            var bestVoucher = activeVouchers
                .Where(v => IsVoucherApplicable(book, v))
                .OrderByDescending(v => CalculateDiscountValue(book.Price, v))
                .FirstOrDefault();

            if (bestVoucher == null)
            {
                return;
            }

            var discountValue = CalculateDiscountValue(book.Price, bestVoucher);
            if (discountValue <= 0)
            {
                return;
            }

            book.DiscountedPrice = Math.Max(0, book.Price - discountValue);
            book.Discount = bestVoucher.DiscountType == "Percentage"
                ? $"-{bestVoucher.DiscountAmount:N0}%"
                : $"-{FormatPrice(bestVoucher.DiscountAmount)}";
            book.DiscountVoucherCode = bestVoucher.Code;
        }

        private static bool IsVoucherApplicable(BookContextItem book, Voucher voucher)
        {
            if (book.Price < voucher.MinOrderValue)
            {
                return false;
            }

            var appliesToProduct = !string.IsNullOrWhiteSpace(voucher.ApplicableProductId) &&
                                   ("," + voucher.ApplicableProductId + ",").Contains("," + book.Id + ",");
            var appliesToCategory = !string.IsNullOrWhiteSpace(voucher.ApplicableCategoryId) &&
                                    voucher.ApplicableCategoryId == book.CategoryId;
            return appliesToProduct || appliesToCategory;
        }

        private static decimal CalculateDiscountValue(decimal price, Voucher voucher)
        {
            return voucher.DiscountType == "Percentage"
                ? price * voucher.DiscountAmount / 100m
                : Math.Min(price, voucher.DiscountAmount);
        }

        private static string BuildBudgetResponse(decimal budget, int requestedQuantity, IReadOnlyCollection<BookContextItem> books)
        {
            var total = books.Sum(b => b.EffectivePrice);
            var title = books.Count >= requestedQuantity
                ? $"Với {FormatPrice(budget)} để mua {requestedQuantity} cuốn, bạn có thể chọn"
                : $"Với {FormatPrice(budget)}, chưa đủ combo {requestedQuantity} cuốn tốt; có thể chọn {books.Count} cuốn";

            return $"{BuildBookListResponse(title, books)} Tổng cộng {FormatPrice(total)}, còn dư {FormatPrice(budget - total)}.";
        }

        private static string BuildStockResponse(IEnumerable<BookContextItem> books)
        {
            var lines = books.Select((b, index) =>
            {
                var stockText = b.Stock > 0 ? $"còn {b.Stock} quyển" : "đang hết hàng";
                return $"{index + 1}. {b.Title}, {stockText}, giá {FormatPrice(b.Price)}";
            });

            return $"Tình trạng trong kho: {string.Join("; ", lines)}.";
        }

        private static string BuildAuthorResponse(IEnumerable<BookContextItem> books)
        {
            var lines = books.Select((b, index) => $"{index + 1}. {b.Title}: {b.Author}");
            return $"Tác giả: {string.Join("; ", lines)}.";
        }

        private static List<BookContextItem> SelectBooksWithinBudget(IEnumerable<BookContextItem> books, decimal budget, int requestedQuantity)
        {
            var quantity = Math.Clamp(requestedQuantity, 1, 5);
            var candidates = books
                .Where(b => b.EffectivePrice <= budget)
                .OrderByDescending(b => b.Rating)
                .ThenByDescending(b => b.Sold)
                .ThenBy(b => b.EffectivePrice)
                .Take(60)
                .ToList();

            var exactCombo = FindBestCombo(candidates, budget, quantity);
            if (exactCombo.Count == quantity)
            {
                return exactCombo;
            }

            for (var fallbackQuantity = quantity - 1; fallbackQuantity >= 1; fallbackQuantity--)
            {
                var fallbackCombo = FindBestCombo(candidates, budget, fallbackQuantity);
                if (fallbackCombo.Count == fallbackQuantity)
                {
                    return fallbackCombo;
                }
            }

            return new List<BookContextItem>();
        }

        private static List<BookContextItem> GetBudgetCandidateBooks(IReadOnlyCollection<BookContextItem> books, IReadOnlyCollection<string> queryWords)
        {
            if (queryWords.Count == 0)
            {
                return books.ToList();
            }

            var matchedBooks = books
                .Select(book => new
                {
                    Book = book,
                    Score = CalculateMatchScore(book, queryWords)
                })
                .Where(x => x.Score > 0)
                .OrderByDescending(x => x.Score)
                .ThenByDescending(x => x.Book.Rating)
                .ThenByDescending(x => x.Book.Sold)
                .Select(x => x.Book)
                .ToList();

            return matchedBooks.Count > 0 ? matchedBooks : books.ToList();
        }

        private static IEnumerable<BookContextItem> ApplyCategoryHint(IReadOnlyCollection<BookContextItem> books, string normalizedMessage)
        {
            string[]? categoryHints = null;

            if (normalizedMessage.Contains("thieu nhi") ||
                normalizedMessage.Contains("nhi dong") ||
                normalizedMessage.Contains("tre em"))
            {
                categoryHints = new[] { "thieu nhi" };
            }
            else if (normalizedMessage.Contains("van hoc viet nam") ||
                     normalizedMessage.Contains("sach viet nam"))
            {
                categoryHints = new[] { "van hoc viet nam" };
            }
            else if (normalizedMessage.Contains("van hoc nuoc ngoai") ||
                     normalizedMessage.Contains("sach nuoc ngoai"))
            {
                categoryHints = new[] { "van hoc nuoc ngoai" };
            }
            else if (normalizedMessage.Contains("kinh doanh") ||
                     normalizedMessage.Contains("dau tu") ||
                     normalizedMessage.Contains("marketing"))
            {
                categoryHints = new[] { "kinh doanh" };
            }
            else if (normalizedMessage.Contains("ky nang") ||
                     normalizedMessage.Contains("phat trien ban than") ||
                     normalizedMessage.Contains("tu duy"))
            {
                categoryHints = new[] { "ky nang song" };
            }
            else if (normalizedMessage.Contains("khoa hoc") ||
                     normalizedMessage.Contains("cong nghe") ||
                     normalizedMessage.Contains("lap trinh") ||
                     normalizedMessage.Contains("it"))
            {
                categoryHints = new[] { "khoa hoc", "cong nghe" };
            }
            else if (normalizedMessage.Contains("lich su") ||
                     normalizedMessage.Contains("van hoa"))
            {
                categoryHints = new[] { "lich su", "van hoa" };
            }

            if (categoryHints == null)
            {
                return books;
            }

            var filtered = books
                .Where(book =>
                {
                    var category = NormalizeVietnamese(book.Category);
                    return categoryHints.Any(category.Contains);
                })
                .ToList();

            return filtered.Count > 0 ? filtered : books;
        }

        private static IEnumerable<BookContextItem> ApplyPriceFilter(IEnumerable<BookContextItem> books, PriceFilter? filter, bool useDiscountedPrice)
        {
            if (filter == null)
            {
                return books;
            }

            return books.Where(book =>
            {
                var price = useDiscountedPrice
                    ? book.EffectivePrice
                    : book.Price;

                return (!filter.MinPrice.HasValue || price >= filter.MinPrice.Value) &&
                       (!filter.MaxPrice.HasValue || price <= filter.MaxPrice.Value);
            });
        }

        private static IEnumerable<BookContextItem> SelectBestMatches(IReadOnlyCollection<BookContextItem> matchedBooks, IReadOnlyCollection<string> queryWords)
        {
            if (matchedBooks.Count == 0)
            {
                return Enumerable.Empty<BookContextItem>();
            }

            if (queryWords.Count <= 1)
            {
                return matchedBooks.Take(3);
            }

            var scoredBooks = matchedBooks
                .Select(book => new
                {
                    Book = book,
                    Score = CalculateMatchScore(book, queryWords)
                })
                .Where(x => x.Score > 0)
                .ToList();

            var bestScore = scoredBooks.Max(x => x.Score);
            return scoredBooks
                .Where(x => x.Score == bestScore)
                .Select(x => x.Book)
                .Take(3);
        }

        private static List<BookContextItem> FindBestCombo(IReadOnlyList<BookContextItem> candidates, decimal budget, int quantity)
        {
            var bestCombo = new List<BookContextItem>();
            double bestScore = double.MinValue;

            void Search(int startIndex, List<BookContextItem> current, decimal currentTotal, double currentScore)
            {
                if (current.Count == quantity)
                {
                    var budgetFitScore = (double)((budget - currentTotal) / 1000m);
                    var score = currentScore - budgetFitScore * 0.02;
                    if (score > bestScore)
                    {
                        bestScore = score;
                        bestCombo = current.ToList();
                    }

                    return;
                }

                for (var i = startIndex; i < candidates.Count; i++)
                {
                    var book = candidates[i];
                    var nextTotal = currentTotal + book.EffectivePrice;
                    if (nextTotal > budget)
                    {
                        continue;
                    }

                    current.Add(book);
                    Search(i + 1, current, nextTotal, currentScore + CalculateRecommendationScore(book));
                    current.RemoveAt(current.Count - 1);
                }
            }

            Search(0, new List<BookContextItem>(), 0, 0);
            return bestCombo;
        }

        private static List<BookContextItem> SelectBudgetRecommendations(IEnumerable<BookContextItem> books, decimal budget, int limit)
        {
            return books
                .Where(b => b.EffectivePrice <= budget)
                .OrderByDescending(CalculateRecommendationScore)
                .ThenBy(b => b.EffectivePrice)
                .Take(limit)
                .ToList();
        }

        private static string BuildBudgetSuggestionResponse(decimal budget, IReadOnlyCollection<BookContextItem> books)
        {
            return BuildConsultingResponse($"Với ngân sách {FormatPrice(budget)}, mình sẽ ưu tiên mấy cuốn dễ chọn này", books);

        }

        private static double CalculateRecommendationScore(BookContextItem book)
        {
            return book.Rating * 1000 + book.Sold * 100 + (double)(book.Price / 100000m);
        }

        private static string FormatPrice(decimal price)
        {
            return string.Format(CultureInfo.GetCultureInfo("vi-VN"), "{0:N0} VNĐ", price);
        }

        private static decimal? TryParseBudget(string normalizedMessage)
        {
            var compactMessage = normalizedMessage.Replace(".", "").Replace(",", "");

            var kMatch = Regex.Match(compactMessage, @"(?<!\d)(\d{2,5})\s*k(?![a-z])");
            if (kMatch.Success && decimal.TryParse(kMatch.Groups[1].Value, out var kValue))
            {
                return kValue * 1000;
            }

            var thousandMatch = Regex.Match(compactMessage, @"(?<!\d)(\d{2,5})\s*(nghin|ngan)(?![a-z])");
            if (thousandMatch.Success && decimal.TryParse(thousandMatch.Groups[1].Value, out var thousandValue))
            {
                return thousandValue * 1000;
            }

            var vndMatch = Regex.Match(compactMessage, @"(?<!\d)(\d{5,9})\s*(vnd|dong|d)?(?![a-z])");
            if (vndMatch.Success && decimal.TryParse(vndMatch.Groups[1].Value, out var value))
            {
                return value;
            }

            return null;
        }

        private static PriceFilter? TryParsePriceFilter(string normalizedMessage)
        {
            var rangeMatch = Regex.Match(normalizedMessage, @"(?:tu|khoang)\s+(.+?)\s+(?:den|toi|-)\s+(.+?)(?:\s|$)");
            if (rangeMatch.Success)
            {
                var min = TryParseMoneyAmount(rangeMatch.Groups[1].Value);
                var max = TryParseMoneyAmount(rangeMatch.Groups[2].Value);
                if (min.HasValue || max.HasValue)
                {
                    return new PriceFilter(min, max);
                }
            }

            var underMatch = Regex.Match(normalizedMessage, @"(?:duoi|nho hon|khong qua|toi da|<=)\s+([0-9][0-9\.,]*\s*(?:k|nghin|ngan|vnd|dong|d)?)");
            if (underMatch.Success)
            {
                var max = TryParseMoneyAmount(underMatch.Groups[1].Value);
                if (max.HasValue)
                {
                    return new PriceFilter(null, max);
                }
            }

            var overMatch = Regex.Match(normalizedMessage, @"(?:tren|lon hon|tu)\s+([0-9][0-9\.,]*\s*(?:k|nghin|ngan|vnd|dong|d)?)");
            if (overMatch.Success)
            {
                var min = TryParseMoneyAmount(overMatch.Groups[1].Value);
                if (min.HasValue)
                {
                    return new PriceFilter(min, null);
                }
            }

            return null;
        }

        private static decimal? TryParseMoneyAmount(string value)
        {
            var compactValue = value.Trim().ToLowerInvariant().Replace(".", "").Replace(",", "");

            var kMatch = Regex.Match(compactValue, @"(?<!\d)(\d{1,7})\s*k(?![a-z])");
            if (kMatch.Success && decimal.TryParse(kMatch.Groups[1].Value, out var kValue))
            {
                return kValue * 1000;
            }

            var thousandMatch = Regex.Match(compactValue, @"(?<!\d)(\d{1,7})\s*(nghin|ngan)(?![a-z])");
            if (thousandMatch.Success && decimal.TryParse(thousandMatch.Groups[1].Value, out var thousandValue))
            {
                return thousandValue * 1000;
            }

            var numberMatch = Regex.Match(compactValue, @"(?<!\d)(\d{1,9})\s*(vnd|dong|d)?(?![a-z])");
            if (!numberMatch.Success || !decimal.TryParse(numberMatch.Groups[1].Value, out var numberValue))
            {
                return null;
            }

            return numberValue < 1000 ? numberValue * 1000 : numberValue;
        }

        private static bool IsPriceIntent(string normalizedMessage)
        {
            return !normalizedMessage.Contains("tac gia") &&
                   (normalizedMessage.Contains("gia") ||
                   normalizedMessage.Contains("bao nhieu tien") ||
                   normalizedMessage.Contains("bao nhieu vnd"));
        }

        private static bool IsAuthorIntent(string normalizedMessage)
        {
            return normalizedMessage.Contains("tac gia") ||
                   normalizedMessage.Contains("ai viet") ||
                   normalizedMessage.Contains("cua ai");
        }

        private static bool IsStockIntent(string normalizedMessage)
        {
            return normalizedMessage.Contains("con hang") ||
                   normalizedMessage.Contains("con sach") ||
                   normalizedMessage.Contains("ton kho") ||
                   normalizedMessage.Contains("het hang") ||
                   normalizedMessage.Contains("co ban") ||
                   normalizedMessage.Contains("co sach");
        }

        private static bool IsDiscountIntent(string normalizedMessage)
        {
            return normalizedMessage.Contains("giam gia") ||
                   normalizedMessage.Contains("uu dai") ||
                   normalizedMessage.Contains("khuyen mai") ||
                   normalizedMessage.Contains("sale") ||
                   normalizedMessage.Contains("voucher");
        }

        private static bool IsAdvisoryIntent(string normalizedMessage, IReadOnlyCollection<string> queryWords)
        {
            return queryWords.Count == 0 ||
                   normalizedMessage.Contains("goi y") ||
                   normalizedMessage.Contains("tu van") ||
                   normalizedMessage.Contains("nen doc") ||
                   normalizedMessage.Contains("nen mua") ||
                   normalizedMessage.Contains("mua sach nao") ||
                   normalizedMessage.Contains("chon sach nao") ||
                   normalizedMessage.Contains("sach nao hay") ||
                   normalizedMessage.Contains("sach hay") ||
                   normalizedMessage.Contains("mua tang") ||
                   normalizedMessage.Contains("tang ban") ||
                   normalizedMessage.Contains("phu hop") ||
                   normalizedMessage.Contains("nguoi moi") ||
                   normalizedMessage.Contains("de doc");
        }

        private static int? TryParseRequestedQuantity(string normalizedMessage)
        {
            var match = Regex.Match(normalizedMessage, @"(?<!\d)(\d{1,2})\s*(cuon|quyen|sach)(?![a-z])");
            if (!match.Success || !int.TryParse(match.Groups[1].Value, out var quantity))
            {
                return null;
            }

            return quantity > 0 ? quantity : null;
        }

        private static bool IsQuantityOnlyFollowUp(
            string normalizedMessage,
            IReadOnlyCollection<string> queryWords,
            int? requestedQuantity)
        {
            if (!requestedQuantity.HasValue || queryWords.Count > 0)
            {
                return false;
            }

            return !TryParseBudget(normalizedMessage).HasValue &&
                   TryParsePriceFilter(normalizedMessage) == null &&
                   !IsDiscountIntent(normalizedMessage) &&
                   !IsStockIntent(normalizedMessage) &&
                   !IsAuthorIntent(normalizedMessage) &&
                   !IsPriceIntent(normalizedMessage);
        }

        private static ConversationContext ExtractConversationContext(IEnumerable<ChatMessageDto> history)
        {
            foreach (var message in history
                         .Where(m => !string.IsNullOrWhiteSpace(m.Text))
                         .Reverse()
                         .Take(MaxHistoryMessages))
            {
                var normalizedText = NormalizeVietnamese(message.Text);
                var budget = TryParseBudget(normalizedText);
                var priceFilter = TryParsePriceFilter(normalizedText);

                if (budget.HasValue || priceFilter != null)
                {
                    return new ConversationContext(budget, priceFilter);
                }
            }

            return new ConversationContext(null, null);
        }

        private static string CleanBotResponse(string response)
        {
            var lines = response
                .Split('\n', StringSplitOptions.RemoveEmptyEntries)
                .Where(line =>
                {
                    var normalizedLine = NormalizeVietnamese(line.Trim());
                    return !normalizedLine.StartsWith("neu ban") &&
                           !normalizedLine.StartsWith("ban co the cho toi biet") &&
                           !normalizedLine.StartsWith("hay cho toi biet");
                });

            return string.Join('\n', lines).Trim();
        }

        private static string? SanitizeDiscountBadge(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            var trimmed = value.Trim();
            return trimmed.Contains('%') ||
                   trimmed.Contains("\u20ab") ||
                   trimmed.Contains("\u0111") ||
                   trimmed.Contains('d') ||
                   trimmed.StartsWith('-')
                ? trimmed
                : null;
        }

        private sealed class BookContextItem
        {
            public string Id { get; set; } = string.Empty;
            public string Title { get; set; } = string.Empty;
            public decimal Price { get; set; }
            public decimal? DiscountedPrice { get; set; }
            public decimal EffectivePrice => DiscountedPrice ?? Price;
            public string? Discount { get; set; }
            public string? DiscountVoucherCode { get; set; }
            public string CategoryId { get; set; } = string.Empty;
            public string Category { get; set; } = string.Empty;
            public string Author { get; set; } = string.Empty;
            public string? Description { get; set; }
            public int Stock { get; set; }
            public int Sold { get; set; }
            public double Rating { get; set; }
            public string SearchText { get; set; } = string.Empty;
        }

        private sealed class CompactBookContext
        {
            [JsonPropertyName("t")]
            public string T { get; set; } = string.Empty;

            [JsonPropertyName("a")]
            public string A { get; set; } = string.Empty;

            [JsonPropertyName("c")]
            public string C { get; set; } = string.Empty;

            [JsonPropertyName("p")]
            public decimal P { get; set; }

            [JsonPropertyName("dp")]
            public decimal? DP { get; set; }

            [JsonPropertyName("d")]
            public string? D { get; set; }

            [JsonPropertyName("v")]
            public string? V { get; set; }

            [JsonPropertyName("s")]
            public int S { get; set; }

            [JsonPropertyName("r")]
            public double R { get; set; }

            [JsonPropertyName("desc")]
            public string? Desc { get; set; }
        }

        private sealed record PriceFilter(decimal? MinPrice, decimal? MaxPrice);

        private sealed record ConversationContext(decimal? Budget, PriceFilter? PriceFilter);
    }
}
