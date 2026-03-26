using BookStore.API.DTOs;
using BookStore.API.Models;
using BookStore.API.Repositories;

namespace BookStore.API.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _repo;

        public CategoryService(ICategoryRepository repo) => _repo = repo;

        public async Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync()
        {
            var categories = await _repo.GetAllAsync();
            return categories.Select(c => new CategoryDto
            {
                CategoryId = c.CategoryId,
                Name = c.Name,
                Description = c.Description,
                IsActive = c.IsActive
            });
        }

        public async Task<CategoryDto?> GetCategoryByIdAsync(int id)
        {
            var c = await _repo.GetByIdAsync(id);
            if (c == null) return null;

            return new CategoryDto
            {
                CategoryId = c.CategoryId,
                Name = c.Name,
                Description = c.Description,
                IsActive = c.IsActive
            };
        }

        public async Task<CategoryDto> CreateCategoryAsync(CategoryCreateDto dto)
        {
            var existing = await _repo.GetByNameAsync(dto.Name);
            if (existing != null)
                throw new Exception("Tên danh mục này đã tồn tại!");

            var newCategory = new Category
            {
                Name = dto.Name,
                Description = dto.Description,
                IsActive = true // Mặc định tạo ra là hoạt động
            };

            await _repo.AddAsync(newCategory);

            return new CategoryDto
            {
                CategoryId = newCategory.CategoryId,
                Name = newCategory.Name,
                Description = newCategory.Description,
                IsActive = newCategory.IsActive
            };
        }

        public async Task<bool> UpdateCategoryAsync(int id, CategoryUpdateDto dto)
        {
            var category = await _repo.GetByIdAsync(id);
            if (category == null) return false;

            // Kiểm tra xem tên mới có bị trùng với danh mục khác không
            var existing = await _repo.GetByNameAsync(dto.Name);
            if (existing != null && existing.CategoryId != id)
                throw new Exception("Tên danh mục này đã được sử dụng!");

            category.Name = dto.Name;
            category.Description = dto.Description;
            category.IsActive = dto.IsActive;

            await _repo.UpdateAsync(category);
            return true;
        }

        public async Task<bool> DeleteCategoryAsync(int id)
        {
            var category = await _repo.GetByIdAsync(id);
            if (category == null) return false;

            // Thay vì xóa vật lý, ta ẩn nó đi (Soft Delete)
            category.IsActive = false;
            await _repo.UpdateAsync(category);
            return true;
        }
    }
}