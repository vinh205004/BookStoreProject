using BookStore.API.DTOs;

namespace BookStore.API.Repositories
{
    public interface IProductRepository
    {
        Task<IEnumerable<ProductSearchDto>> SearchProductsAsync(string? searchQuery = null, string? categoryId = null, string? authorId = null, decimal? minPrice = null, decimal? maxPrice = null);
        Task<ProductDetailDto?> GetProductDetailAsync(string bookId);
        Task<IEnumerable<ProductSearchDto>> GetFeaturedProductsAsync(int count = 10);
        Task<IEnumerable<ProductSearchDto>> GetProductsByCategoryAsync(string categoryId);
    }
}
