using BookStore.API.DTOs;
﻿using BookStore.API.Data;
using BookStore.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace BookStore.API.Repositories
{
    public class BookRepository : IBookRepository
    {
        private readonly AppDbContext _context;
        public BookRepository(AppDbContext context) => _context = context;

        public async Task<IEnumerable<Book>> GetAllAsync()
        {
            return await _context.Books.Include(b => b.Category).Include(b => b.Author).Include(b => b.BookImages)
                .Include(b => b.Reviews).Include(b => b.Publisher).ToListAsync();
        }

        public async Task<Dictionary<string, int>> GetSoldQuantitiesAsync()
        {
            return await _context.OrderItems
                .Where(oi => oi.Order != null && oi.Order.Status != "Cancelled")
                .GroupBy(oi => oi.BookId)
                .Select(g => new { BookId = g.Key, TotalQuantity = g.Sum(oi => oi.Quantity) })
                .ToDictionaryAsync(x => x.BookId, x => x.TotalQuantity);
        }

        public async Task<Book?> GetByIdAsync(string id)
        {
            return await _context.Books.Include(b => b.Category).Include(b => b.Author).Include(b => b.BookImages)
                .Include(b => b.Reviews).Include(b => b.Publisher)
                                       .FirstOrDefaultAsync(b => b.BookId == id);
        }

        public async Task AddAsync(Book book)
        {
            await _context.Books.AddAsync(book);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Book book)
        {
            // Lấy dữ liệu hiện tại trong DB ra để so sánh
            var existingBook = await _context.Books
                .Include(b => b.BookImages)
                .Include(b => b.Reviews)
                .FirstOrDefaultAsync(b => b.BookId == book.BookId);

            if (existingBook == null) return;

            // Cập nhật các trường thông tin cơ bản
            _context.Entry(existingBook).CurrentValues.SetValues(book);
            existingBook.UpdatedAt = DateTime.UtcNow;

            // Xử lý cập nhật hình ảnh
            // Chỉ xử lý nếu danh sách ảnh gửi lên khác null
            if (book.BookImages != null)
            {
                // Lấy danh sách URL ảnh mới gửi từ Frontend
                var newImageUrls = book.BookImages.OrderBy(img => img.ImageId).Select(img => img.ImageUrl).ToList();

                // Lấy danh sách URL ảnh hiện đang có trong DB
                var currentImageUrls = existingBook.BookImages.OrderBy(img => img.ImageId).Select(img => img.ImageUrl).ToList();

                // Nếu danh sách URL ảnh có sự thay đổi (thêm hoặc bớt ảnh)
                if (!newImageUrls.SequenceEqual(currentImageUrls))
                {
                    // xóa hết ảnh cũ trong DB
                    _context.BookImages.RemoveRange(existingBook.BookImages);

                    // gán danh sách ảnh mới vào
                    existingBook.BookImages = book.BookImages;
                }
            }

            // 4. Lưu thay đổi
            await _context.SaveChangesAsync();
        }
    
// Tìm kiếm và lọc
        public async Task<IEnumerable<ProductSearchDto>> SearchBooksAsync(
            string? searchQuery = null,
            string? categoryId = null,
            string? authorId = null,
            string? publisherId = null,
            string? targetAudience = null,
            decimal? minPrice = null,
            decimal? maxPrice = null,
            bool? hasDiscount = null)
        {
            var query = _context.Books
                .Where(b => !b.IsHidden)
                .Include(b => b.Author)
                .Include(b => b.Category)
                .Include(b => b.Publisher)
                .Include(b => b.BookImages)
                .Include(b => b.Reviews)
                .AsQueryable();

            // Bộ lọc tìm kiếm chung trên tiêu đề, tên tác giả, tên nhà xuất bản
            if (!string.IsNullOrWhiteSpace(searchQuery))
            {
                var lowerQuery = searchQuery.ToLower();
                query = query.Where(b =>
                    b.Title.ToLower().Contains(lowerQuery) ||
                    b.Author!.Name.ToLower().Contains(lowerQuery) ||
                    b.Publisher!.Name.ToLower().Contains(lowerQuery));
            }

            // Lọc theo danh mục
            if (!string.IsNullOrWhiteSpace(categoryId))
            {
                query = query.Where(b => b.CategoryId == categoryId);
            }

            // Lọc theo tác giả
            if (!string.IsNullOrWhiteSpace(authorId))
            {
                query = query.Where(b => b.AuthorId == authorId);
            }

            // Lọc theo nhà xuất bản
            if (!string.IsNullOrWhiteSpace(publisherId))
            {
                query = query.Where(b => b.PublisherId == publisherId);
            }

            // Lọc theo đối tượng mục tiêu
            if (!string.IsNullOrWhiteSpace(targetAudience))
            {
                query = query.Where(b => b.TargetAudience == targetAudience);
            }

            // Lọc theo khoảng giá
            if (minPrice.HasValue)
            {
                query = query.Where(b => b.Price >= minPrice.Value);
            }

            if (maxPrice.HasValue)
            {
                query = query.Where(b => b.Price <= maxPrice.Value);
            }

            var books = await query.ToListAsync();
            
            // Lấy số lượng bán của tất cả sách trong kết quả tìm kiếm
            var soldQuantities = await _context.OrderItems
                .Where(oi => oi.Order != null && oi.Order.Status != "Cancelled")
                .GroupBy(oi => oi.BookId)
                .Select(g => new { BookId = g.Key, TotalQuantity = g.Sum(oi => oi.Quantity) })
                .ToDictionaryAsync(x => x.BookId, x => x.TotalQuantity);
            
            var now = DateTime.UtcNow;
            var vouchers = await _context.Vouchers
                .Where(v => v.IsActive && v.StartDate <= now && v.ExpirationDate >= now)
                .ToListAsync();

            // Lọc sách có giảm giá nếu có yêu cầu
            if (hasDiscount.HasValue && hasDiscount.Value)
            {
                books = books
                    .Where(b => vouchers.Any(v =>
                        (v.ApplicableProductId != null && ("," + v.ApplicableProductId + ",").Contains("," + b.BookId + ",")) || (v.ApplicableCategoryId == b.CategoryId && b.Price >= v.MinOrderValue)
                    ))
                    .ToList();
            }

            return books.Select(b => {
                var bestVoucher = vouchers
                    .Where(v => (v.ApplicableProductId != null && ("," + v.ApplicableProductId + ",").Contains("," + b.BookId + ",")) || (v.ApplicableCategoryId == b.CategoryId && b.Price >= v.MinOrderValue))
                    .OrderByDescending(v => v.DiscountType == "Percentage" ? b.Price * v.DiscountAmount / 100 : v.DiscountAmount)
                    .FirstOrDefault();
                
                var searchDto = new ProductSearchDto
                {
                    BookId = b.BookId,
                    Title = b.Title,
                    Price = b.Price,
                    Stock = b.Stock,
                    AuthorName = b.Author?.Name ?? "Chua xac dinh",
                    CategoryId = b.CategoryId,
                    CategoryName = b.Category?.Name ?? "Chua xac dinh",
                    PublisherName = b.Publisher?.Name ?? "",
                    TargetAudience = b.TargetAudience ?? "Truong thanh (18+)",
                    PageCount = b.PageCount,
                    MainImageUrl = b.BookImages.OrderBy(i => i.ImageId).FirstOrDefault()?.ImageUrl,
                    Rating = b.Reviews != null && b.Reviews.Any() ? Math.Round(b.Reviews.Average(r => r.Rating), 1) : 0,
                    ReviewCount = b.Reviews?.Count ?? 0,
                    SoldQuantity = soldQuantities.ContainsKey(b.BookId) ? soldQuantities[b.BookId] : 0
                };

                if (bestVoucher != null)
                {
                    searchDto.HasDiscount = true;
                    searchDto.DiscountedPrice = bestVoucher.DiscountType == "Percentage" 
                        ? b.Price * (1 - bestVoucher.DiscountAmount / 100m) 
                        : Math.Max(0, b.Price - bestVoucher.DiscountAmount);
                    searchDto.DiscountBadge = bestVoucher.DiscountType == "Percentage" 
                        ? $"-{bestVoucher.DiscountAmount}%" 
                        : $"-{bestVoucher.DiscountAmount:N0}d";
                    searchDto.DiscountVoucherCode = bestVoucher.Code;
                }

                return searchDto;
            });
        }

        public async Task<ProductDetailDto?> GetBookDetailAsync(string bookId)
        {
            var book = await _context.Books
                .Where(b => b.BookId == bookId && !b.IsHidden)
                .Include(b => b.Author)
                .Include(b => b.Category)
                .Include(b => b.Publisher)
                .Include(b => b.BookImages)
                .Include(b => b.Reviews)
                .FirstOrDefaultAsync();

            if (book == null) return null;

            // Lấy số lượng bán của sách này (tổng số lượng trong các đơn hàng đã hoàn thành)
            var soldQuantity = await _context.OrderItems
                .Where(oi => oi.BookId == bookId && oi.Order != null && oi.Order.Status != "Cancelled")
                .SumAsync(oi => oi.Quantity);

            var result = new ProductDetailDto
            {
                BookId = book.BookId,
                Title = book.Title,
                Description = book.Description,
                Price = book.Price,
                Stock = book.Stock,
                AuthorName = book.Author?.Name ?? "Chua xác định",
                AuthorId = book.AuthorId,
                CategoryName = book.Category?.Name ?? "Chua xác định",
                CategoryId = book.CategoryId,
                PublisherName = book.Publisher?.Name ?? "",
                PublisherId = book.PublisherId,
                TargetAudience = book.TargetAudience ?? "Trưởng thành (18+)",
                Length = book.Length,
                Width = book.Width,
                LengthUnit = book.LengthUnit ?? "cm",
                PageCount = book.PageCount,
                ImageUrls = book.BookImages.OrderBy(img => img.ImageId).Select(img => img.ImageUrl).ToList(),
                Rating = book.Reviews != null && book.Reviews.Any() ? Math.Round(book.Reviews.Average(r => r.Rating), 1) : 0,
                ReviewCount = book.Reviews?.Count ?? 0,
                SoldQuantity = soldQuantity
            };
            
            var bestVoucher = await _context.Vouchers
                .Where(v => v.IsActive && v.StartDate <= DateTime.UtcNow && v.ExpirationDate >= DateTime.UtcNow && 
                    ((v.ApplicableProductId != null && ("," + v.ApplicableProductId + ",").Contains("," + book.BookId + ",")) || (v.ApplicableCategoryId == book.CategoryId && book.Price >= v.MinOrderValue)))
                .FirstOrDefaultAsync();

            if (bestVoucher != null)
            {
                result.DiscountedPrice = bestVoucher.DiscountType == "Percentage" 
                    ? book.Price * (1 - bestVoucher.DiscountAmount / 100m) 
                    : Math.Max(0, book.Price - bestVoucher.DiscountAmount);
                result.DiscountBadge = bestVoucher.DiscountType == "Percentage" 
                    ? $"-{bestVoucher.DiscountAmount}%" 
                    : $"-{bestVoucher.DiscountAmount:N0}₫";
                result.DiscountVoucherCode = bestVoucher.Code;
            }

            return result;
        }

        public async Task<IEnumerable<string>> GetDistinctTargetAudiencesAsync()
        {
            var audiences = await _context.Books
                .Where(b => !b.IsHidden)
                .Select(b => b.TargetAudience)
                .Distinct()
                .OrderBy(a => a)
                .ToListAsync();

            return audiences;
        }

        public async Task<IEnumerable<ProductSearchDto>> GetFeaturedBooksAsync(int count = 10)
        {
            var now = DateTime.UtcNow;
            var vouchers = await _context.Vouchers
                .Where(v => v.IsActive && v.StartDate <= now && v.ExpirationDate >= now)
                .ToListAsync();

            var books = await _context.Books
                .Where(b => !b.IsHidden)
                .Include(b => b.Author)
                .Include(b => b.Category)
                .Include(b => b.Publisher)
                .Include(b => b.BookImages)
                .Include(b => b.Reviews)
                .OrderByDescending(b => b.CreatedAt)
                .Take(count)
                .ToListAsync();

            // Lấy số lượng bán của tất cả sách trong danh sách nổi bật
            var soldQuantities = await _context.OrderItems
                .Where(oi => oi.Order != null && oi.Order.Status != "Cancelled")
                .GroupBy(oi => oi.BookId)
                .Select(g => new { BookId = g.Key, TotalQuantity = g.Sum(oi => oi.Quantity) })
                .ToDictionaryAsync(x => x.BookId, x => x.TotalQuantity);

            return books.Select(b => {
                var bestVoucher = vouchers.FirstOrDefault(v => (v.ApplicableProductId != null && ("," + v.ApplicableProductId + ",").Contains("," + b.BookId + ",")) || (v.ApplicableCategoryId == b.CategoryId && b.Price >= v.MinOrderValue));
                
                var searchDto = new ProductSearchDto
                {
                    BookId = b.BookId,
                    Title = b.Title,
                    Price = b.Price,
                    Stock = b.Stock,
                    AuthorName = b.Author?.Name ?? "Chua xac dinh",
                    CategoryId = b.CategoryId,
                    CategoryName = b.Category?.Name ?? "Chua xac dinh",
                    PublisherName = b.Publisher?.Name ?? "",
                    TargetAudience = b.TargetAudience ?? "Truong thanh (18+)",
                    PageCount = b.PageCount,
                    MainImageUrl = b.BookImages.OrderBy(i => i.ImageId).FirstOrDefault()?.ImageUrl,
                    Rating = b.Reviews != null && b.Reviews.Any() ? Math.Round(b.Reviews.Average(r => r.Rating), 1) : 0,
                    ReviewCount = b.Reviews?.Count ?? 0,
                    SoldQuantity = soldQuantities.ContainsKey(b.BookId) ? soldQuantities[b.BookId] : 0
                };

                if (bestVoucher != null)
                {
                    searchDto.HasDiscount = true;
                    searchDto.DiscountedPrice = bestVoucher.DiscountType == "Percentage" 
                        ? b.Price * (1 - bestVoucher.DiscountAmount / 100m) 
                        : Math.Max(0, b.Price - bestVoucher.DiscountAmount);
                    searchDto.DiscountBadge = bestVoucher.DiscountType == "Percentage" 
                        ? $"-{bestVoucher.DiscountAmount}%" 
                        : $"-{bestVoucher.DiscountAmount:N0}d";
                    searchDto.DiscountVoucherCode = bestVoucher.Code;
                }

                return searchDto;
            });
        }

        public async Task<IEnumerable<ProductSearchDto>> GetBooksByCategoryAsync(string categoryId)
        {
            var books = await _context.Books
                .Where(b => b.CategoryId == categoryId && !b.IsHidden)
                .Include(b => b.Author)
                .Include(b => b.Category)
                .Include(b => b.Publisher)
                .Include(b => b.BookImages)
                .Include(b => b.Reviews)
                .ToListAsync();

            return await MapToSearchDto(books);
        }

        public async Task<IEnumerable<ProductSearchDto>> GetDiscountedBooksAsync(int count)
        {
            var now = DateTime.UtcNow;
            
            // Tìm các vouchers đang hợp lệ
            var activeVouchers = await _context.Vouchers
                .Where(v => v.IsActive && v.StartDate <= now && v.ExpirationDate >= now)
                .ToListAsync();

            var discountedBooks = await _context.Books
                .Where(b => !b.IsHidden)
                .Include(b => b.Author)
                .Include(b => b.Category)
                .Include(b => b.Publisher)
                .Include(b => b.BookImages)
                .Include(b => b.Reviews)
                .ToListAsync();

            var filteredBooks = discountedBooks
                .Where(b => activeVouchers.Any(v => 
                    (v.ApplicableProductId != null && ("," + v.ApplicableProductId + ",").Contains("," + b.BookId + ",")) || (v.ApplicableCategoryId == b.CategoryId && b.Price >= v.MinOrderValue)
                ))
                .OrderBy(b => b.Price)
                .Take(count)
                .ToList();

            // Lấy số lượng bán của tất cả sách trong danh sách này để hiển thị trên trang chủ và trang danh mục
            var bookIds = filteredBooks.Select(b => b.BookId).ToList();
            var soldQuantities = await _context.OrderItems
                .Where(oi => bookIds.Contains(oi.BookId) && oi.Order != null && oi.Order.Status != "Cancelled")
                .GroupBy(oi => oi.BookId)
                .Select(g => new { BookId = g.Key, TotalQuantity = g.Sum(oi => oi.Quantity) })
                .ToDictionaryAsync(x => x.BookId, x => x.TotalQuantity);

            var result = filteredBooks
                .Select(b => 
                {
                    // Lấy voucher có mức giảm lớn nhất áp dụng cho sách này
                    var bestVoucher = activeVouchers
                        .Where(v => (v.ApplicableProductId != null && ("," + v.ApplicableProductId + ",").Contains("," + b.BookId + ",")) || (v.ApplicableCategoryId == b.CategoryId && b.Price >= v.MinOrderValue))
                        .OrderByDescending(v => v.DiscountType == "Percentage" ? b.Price * v.DiscountAmount / 100 : v.DiscountAmount)
                        .FirstOrDefault();

                    var searchDto = new ProductSearchDto
                    {
                        BookId = b.BookId,
                        Title = b.Title,
                        Price = b.Price,
                        Stock = b.Stock,
                        AuthorName = b.Author?.Name ?? "Chưa xác định",
                        CategoryId = b.CategoryId,
                        CategoryName = b.Category?.Name ?? "Chưa xác định",
                        PublisherName = b.Publisher?.Name ?? "",
                        TargetAudience = b.TargetAudience ?? "Trưởng thành",
                        PageCount = b.PageCount,
                        MainImageUrl = b.BookImages.OrderBy(i => i.ImageId).FirstOrDefault()?.ImageUrl,
                        Rating = b.Reviews != null && b.Reviews.Any() ? Math.Round(b.Reviews.Average(r => r.Rating), 1) : 0,
                        ReviewCount = b.Reviews?.Count ?? 0,
                        SoldQuantity = soldQuantities.ContainsKey(b.BookId) ? soldQuantities[b.BookId] : 0
                    };

                    if (bestVoucher != null)
                    {
                        searchDto.HasDiscount = true;
                        searchDto.DiscountedPrice = bestVoucher.DiscountType == "Percentage" 
                            ? b.Price * (1 - bestVoucher.DiscountAmount / 100m) 
                            : Math.Max(0, b.Price - bestVoucher.DiscountAmount);
                        searchDto.DiscountBadge = bestVoucher.DiscountType == "Percentage" 
                            ? $"-{bestVoucher.DiscountAmount}%" 
                            : $"-{bestVoucher.DiscountAmount:N0}₫";
                        searchDto.DiscountVoucherCode = bestVoucher.Code;
                    }

                    return searchDto;
                });

            return result;
        }

        public async Task<IEnumerable<ProductSearchDto>> GetTopSellingBooksAsync(int? month = null, int? year = null, int count = 10)
        {
            var topSellingQuery = _context.OrderItems
                .Include(oi => oi.Order)
                .Where(oi => oi.Order != null && oi.Order.Status != "Cancelled");

            if (month.HasValue && year.HasValue)
            {
                topSellingQuery = topSellingQuery
                    .Where(oi => oi.Order!.OrderDate.Month == month.Value && oi.Order.OrderDate.Year == year.Value);
            }

            var topSellingBookIds = await topSellingQuery
                .GroupBy(oi => oi.BookId)
                .Select(g => new { BookId = g.Key, TotalQuantity = g.Sum(oi => oi.Quantity) })
                .OrderByDescending(x => x.TotalQuantity)
                .Take(count)
                .ToListAsync();

            var bookIdOrder = topSellingBookIds
                .Select((item, index) => new { item.BookId, index })
                .ToDictionary(item => item.BookId, item => item.index);

            var books = await _context.Books
                .Where(b => !b.IsHidden && bookIdOrder.Keys.Contains(b.BookId))
                .Include(b => b.Author)
                .Include(b => b.Category)
                .Include(b => b.Publisher)
                .Include(b => b.BookImages)
                .Include(b => b.Reviews)
                .ToListAsync();

            books = books
                .OrderBy(b => bookIdOrder[b.BookId])
                .ToList();

            return await MapToSearchDto(books);
        }

        public async Task<IEnumerable<ProductSearchDto>> GetTopRatedBooksAsync(int count)
        {
            var books = await _context.Books
                .Where(b => !b.IsHidden)
                .Include(b => b.Author)
                .Include(b => b.Category)
                .Include(b => b.Publisher)
                .Include(b => b.BookImages)
                .Include(b => b.Reviews)
                .OrderByDescending(b => b.Reviews.Any() ? b.Reviews.Average(r => r.Rating) : 0)
                .Take(count)
                .ToListAsync();

            return await MapToSearchDto(books);
        }

        private async Task<IEnumerable<ProductSearchDto>> MapToSearchDto(IEnumerable<Book> books)
        {
            var bookIds = books.Select(b => b.BookId).ToList();
            
            // Lấy số lượng bán của tất cả sách trong kết quả để hiển thị trên trang chủ và trang danh mục
            var soldQuantities = await _context.OrderItems
                .Where(oi => bookIds.Contains(oi.BookId) && oi.Order != null && oi.Order.Status != "Cancelled")
                .GroupBy(oi => oi.BookId)
                .Select(g => new { BookId = g.Key, TotalQuantity = g.Sum(oi => oi.Quantity) })
                .ToDictionaryAsync(x => x.BookId, x => x.TotalQuantity);
            
            var now = DateTime.UtcNow;
            var vouchers = await _context.Vouchers
                .Where(v => v.IsActive && v.StartDate <= now && v.ExpirationDate >= now)
                .ToListAsync();

            return books.Select(b => {
                var bestVoucher = vouchers.FirstOrDefault(v => (v.ApplicableProductId != null && ("," + v.ApplicableProductId + ",").Contains("," + b.BookId + ",")) || (v.ApplicableCategoryId == b.CategoryId && b.Price >= v.MinOrderValue));
                
                var searchDto = new ProductSearchDto
                {
                    BookId = b.BookId,
                    Title = b.Title,
                    Price = b.Price,
                    Stock = b.Stock,
                    AuthorName = b.Author?.Name ?? "Chua xac dinh",
                    CategoryId = b.CategoryId,
                    CategoryName = b.Category?.Name ?? "Chua xac dinh",
                    PublisherName = b.Publisher?.Name ?? "",
                    TargetAudience = b.TargetAudience ?? "Truong thanh (18+)",
                    PageCount = b.PageCount,
                    MainImageUrl = b.BookImages.OrderBy(i => i.ImageId).FirstOrDefault()?.ImageUrl,
                    Rating = b.Reviews != null && b.Reviews.Any() ? Math.Round(b.Reviews.Average(r => r.Rating), 1) : 0,
                    ReviewCount = b.Reviews?.Count ?? 0,
                    SoldQuantity = soldQuantities.ContainsKey(b.BookId) ? soldQuantities[b.BookId] : 0
                };

                if (bestVoucher != null)
                {
                    searchDto.HasDiscount = true;
                    searchDto.DiscountedPrice = bestVoucher.DiscountType == "Percentage" 
                        ? b.Price * (1 - bestVoucher.DiscountAmount / 100m) 
                        : Math.Max(0, b.Price - bestVoucher.DiscountAmount);
                    searchDto.DiscountBadge = bestVoucher.DiscountType == "Percentage" 
                        ? $"-{bestVoucher.DiscountAmount}%" 
                        : $"-{bestVoucher.DiscountAmount:N0}₫";
                    searchDto.DiscountVoucherCode = bestVoucher.Code;
                }

                return searchDto;
            });
        }
    }
}

