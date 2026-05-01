using BookStore.API.DTOs;
using BookStore.API.Models;

namespace BookStore.API.Repositories
{
    public interface IBookRepository
    {
        // Admin CRUD
        Task<IEnumerable<Book>> GetAllAsync();
        Task<Book?> GetByIdAsync(string id);
        Task<Dictionary<string, int>> GetSoldQuantitiesAsync();
        Task AddAsync(Book book);
        Task UpdateAsync(Book book);

        // Customer search & filter
        Task<IEnumerable<ProductSearchDto>> SearchBooksAsync(string? searchQuery = null, string? categoryId = null, string? authorId = null, string? publisherId = null, string? targetAudience = null, decimal? minPrice = null, decimal? maxPrice = null, bool? hasDiscount = null);
        Task<ProductDetailDto?> GetBookDetailAsync(string bookId);
        Task<IEnumerable<string>> GetDistinctTargetAudiencesAsync();
        Task<IEnumerable<ProductSearchDto>> GetFeaturedBooksAsync(int count = 10);
        Task<IEnumerable<ProductSearchDto>> GetDiscountedBooksAsync(int count = 10);
        Task<IEnumerable<ProductSearchDto>> GetTopSellingBooksAsync(int? month = null, int? year = null, int count = 10);
        Task<IEnumerable<ProductSearchDto>> GetTopRatedBooksAsync(int count = 10);
        Task<IEnumerable<ProductSearchDto>> GetBooksByCategoryAsync(string categoryId);
    }
}
