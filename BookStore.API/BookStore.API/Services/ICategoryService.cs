using BookStore.API.DTOs;

namespace BookStore.API.Services
{
    public interface ICategoryService
    {
        Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync();
        Task<CategoryDto?> GetCategoryByIdAsync(string id);
        Task<CategoryDto> CreateCategoryAsync(CategoryCreateDto dto);
        Task<bool> UpdateCategoryAsync(string id, CategoryUpdateDto dto);
        Task<bool> DeleteCategoryAsync(string id); // Xóa mềm
        Task<bool> RestoreCategoryAsync(string id);
    }
}