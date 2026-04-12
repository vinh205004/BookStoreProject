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

            // Filter by search query
            if (!string.IsNullOrWhiteSpace(searchQuery))
            {
                var lowerQuery = searchQuery.ToLower();
                query = query.Where(b => 
                    b.Title.ToLower().Contains(lowerQuery) ||
                    b.Author!.Name.ToLower().Contains(lowerQuery) ||
                    b.Description.ToLower().Contains(lowerQuery));
            }

            // Filter by category
            if (!string.IsNullOrWhiteSpace(categoryId))
            {
                query = query.Where(b => b.CategoryId == categoryId);
            }

            // Filter by author
            if (!string.IsNullOrWhiteSpace(authorId))
            {
                query = query.Where(b => b.AuthorId == authorId);
            }

            // Filter by price range
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
                    PublisherName = b.Publisher?.Name ?? "",
                    TargetAudience = b.TargetAudience ?? "Trưởng thành (18+)",
                    PageCount = b.PageCount,
                    MainImageUrl = b.BookImages.OrderBy(i => i.ImageId).FirstOrDefault()?.ImageUrl
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
                ImageUrls = book.BookImages.OrderBy(img => img.ImageId).Select(img => img.ImageUrl).ToList()
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
                    PublisherName = b.Publisher?.Name ?? "",
                    TargetAudience = b.TargetAudience ?? "Trưởng thành (18+)",
                    PageCount = b.PageCount,
                    MainImageUrl = b.BookImages.OrderBy(i => i.ImageId).FirstOrDefault()?.ImageUrl
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
                    PublisherName = b.Publisher?.Name ?? "",
                    TargetAudience = b.TargetAudience ?? "Trưởng thành (18+)",
                    PageCount = b.PageCount,
                    MainImageUrl = b.BookImages.OrderBy(i => i.ImageId).FirstOrDefault()?.ImageUrl
                });
        }
    }
}
