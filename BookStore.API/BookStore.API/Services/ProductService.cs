using BookStore.API.DTOs;
using BookStore.API.Repositories;

namespace BookStore.API.Services
{
    public class ProductService : IProductService
    {
        private readonly IProductRepository _productRepository;

        public ProductService(IProductRepository productRepository)
        {
            _productRepository = productRepository;
        }

        public async Task<IEnumerable<ProductSearchDto>> SearchProductsAsync(
            string? searchQuery = null, 
            string? categoryId = null, 
            string? authorId = null, 
            decimal? minPrice = null, 
            decimal? maxPrice = null)
        {
            return await _productRepository.SearchProductsAsync(searchQuery, categoryId, authorId, minPrice, maxPrice);
        }

        public async Task<ProductDetailDto?> GetProductDetailAsync(string bookId)
        {
            return await _productRepository.GetProductDetailAsync(bookId);
        }

        public async Task<IEnumerable<ProductSearchDto>> GetFeaturedProductsAsync(int count = 10)
        {
            return await _productRepository.GetFeaturedProductsAsync(count);
        }

        public async Task<IEnumerable<ProductSearchDto>> GetProductsByCategoryAsync(string categoryId)
        {
            return await _productRepository.GetProductsByCategoryAsync(categoryId);
        }
    }
}
