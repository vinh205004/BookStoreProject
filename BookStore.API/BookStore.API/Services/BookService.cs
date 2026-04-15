using BookStore.API.DTOs;
using BookStore.API.Models;
using BookStore.API.Repositories;
using BookStore.API.Utilities;

namespace BookStore.API.Services
{
    public class BookService : IBookService
    {
        private readonly IBookRepository _bookRepo;
        private readonly ICategoryRepository _categoryRepo; // Cần gọi CategoryRepo để kiểm tra danh mục có tồn tại không
        private readonly IVoucherRepository _voucherRepo; // Để lấy thông tin giảm giá

        public BookService(IBookRepository bookRepo, ICategoryRepository categoryRepo, IVoucherRepository voucherRepo)
        {
            _bookRepo = bookRepo;
            _categoryRepo = categoryRepo;
            _voucherRepo = voucherRepo;
        }

        public async Task<IEnumerable<BookDto>> GetAllBooksAsync()
        {
            var books = await _bookRepo.GetAllAsync();
            var vouchers = await GetActiveVouchersAsync();
            var bookDtos = books.Select(b => new BookDto
            {
                BookId = b.BookId,
                Title = b.Title,
                AuthorId = b.AuthorId,
                AuthorName = b.Author?.Name ?? "Không xác định",
                PublisherId = b.PublisherId,
                PublisherName = b.Publisher != null ? b.Publisher.Name : "",
                Description = b.Description,
                Price = b.Price,
                Stock = b.Stock,
                ImageUrls = b.BookImages.OrderBy(img => img.ImageId).Select(img => img.ImageUrl).ToList(),
                IsHidden = b.IsHidden,
                CategoryId = b.CategoryId,
                CategoryName = b.Category?.Name ?? "Không xác định",
                TargetAudience = b.TargetAudience ?? "Trưởng thành (18+)",
                Length = b.Length,
                Width = b.Width,
                LengthUnit = b.LengthUnit ?? "cm",
                PageCount = b.PageCount
            })
            .Select(dto =>
            {
                ApplyBestVoucher(dto, vouchers);
                return dto;
            })
            .ToList();

            return bookDtos;
        }

        public async Task<BookDto?> GetBookByIdAsync(string id)
        {
            var b = await _bookRepo.GetByIdAsync(id);
            if (b == null) return null;
            var vouchers = await GetActiveVouchersAsync();

            var bookDto = new BookDto
            {
                BookId = b.BookId,
                Title = b.Title,
                AuthorId = b.AuthorId,
                AuthorName = b.Author?.Name ?? "Không xác định",
                PublisherId = b.PublisherId,
                PublisherName = b.Publisher != null ? b.Publisher.Name : "",
                Description = b.Description,
                Price = b.Price,
                Stock = b.Stock,
                ImageUrls = b.BookImages.OrderBy(img => img.ImageId).Select(img => img.ImageUrl).ToList(),
                IsHidden = b.IsHidden,
                CategoryId = b.CategoryId,
                CategoryName = b.Category?.Name ?? "Không xác định",
                TargetAudience = b.TargetAudience ?? "Trưởng thành (18+)",
                Length = b.Length,
                Width = b.Width,
                LengthUnit = b.LengthUnit ?? "cm",
                PageCount = b.PageCount
            };

            ApplyBestVoucher(bookDto, vouchers);
            return bookDto;
        }

        public async Task<BookDto> CreateBookAsync(BookCreateDto dto)
        {
            // Kiểm tra CategoryId có hợp lệ không
            var category = await _categoryRepo.GetByIdAsync(dto.CategoryId);
            if (category == null || !category.IsActive)
                throw new Exception("Danh mục không tồn tại hoặc đã bị khóa!");

            var newBook = new Book
            {                BookId = IdGenerator.GenerateBookId(),                Title = dto.Title,
                AuthorId = dto.AuthorId,
                PublisherId = dto.PublisherId,
                Description = dto.Description,
                Price = dto.Price,
                Stock = dto.Stock,
                BookImages = dto.ImageUrls.Select(url => new BookImage { ImageId = IdGenerator.GenerateImageId(), ImageUrl = url }).ToList(),
                CategoryId = dto.CategoryId,
                IsHidden = false,
                CreatedAt = DateTime.UtcNow,
                TargetAudience = dto.TargetAudience ?? "Trưởng thành (18+)",
                Length = dto.Length,
                Width = dto.Width,
                LengthUnit = dto.LengthUnit ?? "cm",
                PageCount = dto.PageCount,
                DiscountedPrice = null,
                DiscountBadge = null
            };

            await _bookRepo.AddAsync(newBook);

            return await GetBookByIdAsync(newBook.BookId) ?? throw new Exception("Không thể tạo sách!");
        }

        public async Task<bool> UpdateBookAsync(string id, BookUpdateDto dto)
        {
            var book = await _bookRepo.GetByIdAsync(id);
            if (book == null) return false;

            if (book.CategoryId != dto.CategoryId)
            {
                var category = await _categoryRepo.GetByIdAsync(dto.CategoryId);
                if (category == null || !category.IsActive)
                    throw new Exception("Danh mục mới không tồn tại hoặc đã bị khóa!");
            }

            book.Title = dto.Title;
            book.AuthorId = dto.AuthorId;
            book.PublisherId = dto.PublisherId;
            book.Description = dto.Description;
            book.Price = dto.Price;
            book.Stock = dto.Stock;
            book.BookImages = dto.ImageUrls.Select(url => new BookImage { ImageId = IdGenerator.GenerateImageId(), ImageUrl = url, BookId = book.BookId }).ToList();
            book.CategoryId = dto.CategoryId;
            book.IsHidden = dto.IsHidden;
            book.TargetAudience = dto.TargetAudience ?? "Trưởng thành (18+)";
            book.Length = dto.Length;
            book.Width = dto.Width;
            book.LengthUnit = dto.LengthUnit ?? "cm";
            book.PageCount = dto.PageCount;
            book.DiscountedPrice = null;
            book.DiscountBadge = null;
            book.UpdatedAt = DateTime.UtcNow;

            await _bookRepo.UpdateAsync(book);
            return true;
        }

        public async Task<bool> DeleteBookAsync(string id)
        {
            var book = await _bookRepo.GetByIdAsync(id);
            if (book == null) return false;

            book.IsHidden = true; // Xóa mềm
            book.UpdatedAt = DateTime.UtcNow;

            await _bookRepo.UpdateAsync(book);
            return true;
        }
        public async Task<bool> RestoreBookAsync(string id)
        {
            var book = await _bookRepo.GetByIdAsync(id);
            if (book == null) return false;

            book.IsHidden = false; // Khôi phục (bỏ ẩn)
            book.UpdatedAt = DateTime.UtcNow;

            await _bookRepo.UpdateAsync(book);
            return true;
        }

        // Customer search & filter
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
            return await _bookRepo.SearchBooksAsync(searchQuery, categoryId, authorId, publisherId, targetAudience, minPrice, maxPrice, hasDiscount);
        }

        public async Task<ProductDetailDto?> GetBookDetailAsync(string bookId)
        {
            return await _bookRepo.GetBookDetailAsync(bookId);
        }

        public async Task<IEnumerable<string>> GetDistinctTargetAudiencesAsync()
        {
            return await _bookRepo.GetDistinctTargetAudiencesAsync();
        }

        public async Task<IEnumerable<ProductSearchDto>> GetFeaturedBooksAsync(int count = 10)
        {
            return await _bookRepo.GetFeaturedBooksAsync(count);
        }

        public async Task<IEnumerable<ProductSearchDto>> GetDiscountedBooksAsync(int count = 10)
        {
            return await _bookRepo.GetDiscountedBooksAsync(count);
        }

        public async Task<IEnumerable<ProductSearchDto>> GetTopSellingBooksAsync(int month, int year, int count = 10)
        {
            return await _bookRepo.GetTopSellingBooksAsync(month, year, count);
        }

        public async Task<IEnumerable<ProductSearchDto>> GetTopRatedBooksAsync(int count = 10)
        {
            return await _bookRepo.GetTopRatedBooksAsync(count);
        }

        public async Task<IEnumerable<ProductSearchDto>> GetBooksByCategoryAsync(string categoryId)
        {
            return await _bookRepo.GetBooksByCategoryAsync(categoryId);
        }

        private async Task<List<Voucher>> GetActiveVouchersAsync()
        {
            var now = DateTime.UtcNow;
            var vouchers = await _voucherRepo.GetAllAsync();
            return vouchers
                .Where(v => v.IsActive &&
                            v.StartDate <= now &&
                            v.ExpirationDate >= now &&
                            v.UsedCount < v.Quantity)
                .ToList();
        }

        private static void ApplyBestVoucher(BookDto book, IEnumerable<Voucher> vouchers)
        {
            var bestVoucher = vouchers
                .Where(v => IsVoucherApplicable(book, v))
                .OrderByDescending(v => CalculateDiscountValue(book.Price, v))
                .FirstOrDefault();

            if (bestVoucher == null)
            {
                book.DiscountedPrice = null;
                book.DiscountBadge = null;
                book.DiscountVoucherCode = null;
                return;
            }

            var discountValue = CalculateDiscountValue(book.Price, bestVoucher);
            if (discountValue <= 0)
            {
                return;
            }

            book.DiscountedPrice = Math.Max(0, book.Price - discountValue);
            book.DiscountBadge = bestVoucher.DiscountType == "Percentage"
                ? $"-{bestVoucher.DiscountAmount:N0}%"
                : $"-{bestVoucher.DiscountAmount:N0}đ";
            book.DiscountVoucherCode = bestVoucher.Code;
        }

        private static bool IsVoucherApplicable(BookDto book, Voucher voucher)
        {
            if (book.Price < voucher.MinOrderValue)
            {
                return false;
            }

            var appliesToProduct = !string.IsNullOrWhiteSpace(voucher.ApplicableProductId) &&
                                   ("," + voucher.ApplicableProductId.Trim(',') + ",").Contains("," + book.BookId + ",");
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
    }
}
