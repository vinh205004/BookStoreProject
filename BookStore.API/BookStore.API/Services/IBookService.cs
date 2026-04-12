using BookStore.API.DTOs;

namespace BookStore.API.Services
{
    public interface IBookService
    {
        // Admin CRUD
        Task<IEnumerable<BookDto>> GetAllBooksAsync();
        Task<BookDto?> GetBookByIdAsync(string id);
        Task<BookDto> CreateBookAsync(BookCreateDto dto);
        Task<bool> UpdateBookAsync(string id, BookUpdateDto dto);
        Task<bool> DeleteBookAsync(string id); // Xóa mềm
        Task<bool> RestoreBookAsync(string id);

        // Customer search & filter
        Task<IEnumerable<ProductSearchDto>> SearchBooksAsync(string? searchQuery = null, string? categoryId = null, string? authorId = null, string? publisherId = null, string? targetAudience = null, decimal? minPrice = null, decimal? maxPrice = null, bool? hasDiscount = null);
        Task<ProductDetailDto?> GetBookDetailAsync(string bookId);
        Task<IEnumerable<string>> GetDistinctTargetAudiencesAsync();
        Task<IEnumerable<ProductSearchDto>> GetFeaturedBooksAsync(int count = 10);
        Task<IEnumerable<ProductSearchDto>> GetDiscountedBooksAsync(int count = 10);
        Task<IEnumerable<ProductSearchDto>> GetTopSellingBooksAsync(int month, int year, int count = 10);
        Task<IEnumerable<ProductSearchDto>> GetTopRatedBooksAsync(int count = 10);
        Task<IEnumerable<ProductSearchDto>> GetBooksByCategoryAsync(string categoryId);
    }
}