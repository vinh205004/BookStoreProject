using BookStore.API.Data;
using BookStore.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace BookStore.API.Repositories
{
    public class ProductRepository : IProductRepository
    {
        private readonly AppDbContext _context;

        public ProductRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ProductSearchDto>> SearchProductsAsync(
            string? searchQuery = null, 
            string? categoryId = null, 
            string? authorId = null, 
            decimal? minPrice = null, 
            decimal? maxPrice = null)
        {
            var query = _context.Books
                .Where(b => !b.IsHidden)
                .Include(b => b.Author)
                .Include(b => b.Category)
                .Include(b => b.Publisher)
                .Include(b => b.BookImages)
                .AsQueryable();

            // Lọc theo từ khóa tìm kiếm (tìm trong tiêu đề, tên tác giả, mô tả)
            if (!string.IsNullOrWhiteSpace(searchQuery))
            {
                var lowerQuery = searchQuery.ToLower();
                query = query.Where(b => 
                    b.Title.ToLower().Contains(lowerQuery) ||
                    b.Author!.Name.ToLower().Contains(lowerQuery) ||
                    b.Description.ToLower().Contains(lowerQuery));
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
            return books
                .Select(b => new ProductSearchDto
                {
                    BookId = b.BookId,
                    Title = b.Title,
                    Price = b.Price,
                    Stock = b.Stock,
                    AuthorName = b.Author?.Name ?? "Chưa xác định",
                    CategoryName = b.Category?.Name ?? "Chưa xác định",
                    CategoryId = b.CategoryId,
                    PublisherName = b.Publisher?.Name ?? "",
                    TargetAudience = b.TargetAudience ?? "Trưởng thành (18+)",
                    PageCount = b.PageCount,
                    MainImageUrl = b.BookImages.OrderBy(i => i.ImageId).FirstOrDefault()?.ImageUrl,
                    DiscountedPrice = b.DiscountedPrice,
                    DiscountBadge = b.DiscountBadge,
                    HasDiscount = b.DiscountedPrice.HasValue && b.DiscountedPrice > 0
                });
        }

        public async Task<ProductDetailDto?> GetProductDetailAsync(string bookId)
        {
            var book = await _context.Books
                .Where(b => b.BookId == bookId && !b.IsHidden)
                .Include(b => b.Author)
                .Include(b => b.Category)
                .Include(b => b.Publisher)
                .Include(b => b.BookImages)
                .FirstOrDefaultAsync();

            if (book == null) return null;

            return new ProductDetailDto
            {
                BookId = book.BookId,
                Title = book.Title,
                Description = book.Description,
                Price = book.Price,
                Stock = book.Stock,
                AuthorName = book.Author?.Name ?? "Chưa xác định",
                AuthorId = book.AuthorId,
                CategoryName = book.Category?.Name ?? "Chưa xác định",
                CategoryId = book.CategoryId,
                PublisherName = book.Publisher?.Name ?? "",
                PublisherId = book.PublisherId,
                TargetAudience = book.TargetAudience ?? "Trưởng thành (18+)",
                Length = book.Length,
                Width = book.Width,
                LengthUnit = book.LengthUnit ?? "cm",
                PageCount = book.PageCount,
                ImageUrls = book.BookImages.OrderBy(img => img.ImageId).Select(img => img.ImageUrl).ToList(),
                DiscountedPrice = book.DiscountedPrice,
                DiscountBadge = book.DiscountBadge
            };
        }

        public async Task<IEnumerable<ProductSearchDto>> GetFeaturedProductsAsync(int count = 10)
        {
            var books = await _context.Books
                .Where(b => !b.IsHidden)
                .Include(b => b.Author)
                .Include(b => b.Category)
                .Include(b => b.Publisher)
                .Include(b => b.BookImages)
                .OrderByDescending(b => b.CreatedAt)
                .Take(count)
                .ToListAsync();

            return books
                .Select(b => new ProductSearchDto
                {
                    BookId = b.BookId,
                    Title = b.Title,
                    Price = b.Price,
                    Stock = b.Stock,
                    AuthorName = b.Author?.Name ?? "Chưa xác định",
                    CategoryName = b.Category?.Name ?? "Chưa xác định",
                    CategoryId = b.CategoryId,
                    PublisherName = b.Publisher?.Name ?? "",
                    TargetAudience = b.TargetAudience ?? "Trưởng thành (18+)",
                    PageCount = b.PageCount,
                    MainImageUrl = b.BookImages.OrderBy(i => i.ImageId).FirstOrDefault()?.ImageUrl,
                    DiscountedPrice = b.DiscountedPrice,
                    DiscountBadge = b.DiscountBadge,
                    HasDiscount = b.DiscountedPrice.HasValue && b.DiscountedPrice > 0
                });
        }

        public async Task<IEnumerable<ProductSearchDto>> GetProductsByCategoryAsync(string categoryId)
        {
            var books = await _context.Books
                .Where(b => b.CategoryId == categoryId && !b.IsHidden)
                .Include(b => b.Author)
                .Include(b => b.Category)
                .Include(b => b.Publisher)
                .Include(b => b.BookImages)
                .ToListAsync();

            return books
                .Select(b => new ProductSearchDto
                {
                    BookId = b.BookId,
                    Title = b.Title,
                    Price = b.Price,
                    Stock = b.Stock,
                    AuthorName = b.Author?.Name ?? "Chưa xác định",
                    CategoryName = b.Category?.Name ?? "Chưa xác định",
                    CategoryId = b.CategoryId,
                    PublisherName = b.Publisher?.Name ?? "",
                    TargetAudience = b.TargetAudience ?? "Trưởng thành (18+)",
                    PageCount = b.PageCount,
                    MainImageUrl = b.BookImages.OrderBy(i => i.ImageId).FirstOrDefault()?.ImageUrl,
                    DiscountedPrice = b.DiscountedPrice,
                    DiscountBadge = b.DiscountBadge,
                    HasDiscount = b.DiscountedPrice.HasValue && b.DiscountedPrice > 0
                });
        }
    }
}
