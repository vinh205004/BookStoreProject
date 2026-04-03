using BookStore.API.DTOs;
using BookStore.API.Models;
using BookStore.API.Repositories;
using BookStore.API.Utilities;

namespace BookStore.API.Services
{
    public class PublisherService : IPublisherService
    {
        private readonly IPublisherRepository _repo;

        public PublisherService(IPublisherRepository repo) => _repo = repo;

        public async Task<IEnumerable<PublisherDto>> GetAllCategoriesAsync()
        {
            var categories = await _repo.GetAllAsync();
            return categories.Select(c => new PublisherDto
            {
                PublisherId = c.PublisherId,
                Name = c.Name,
                Description = c.Description,
                IsActive = c.IsActive
            });
        }

        public async Task<PublisherDto?> GetPublisherByIdAsync(string id)
        {
            var c = await _repo.GetByIdAsync(id);
            if (c == null) return null;

            return new PublisherDto
            {
                PublisherId = c.PublisherId,
                Name = c.Name,
                Description = c.Description,
                IsActive = c.IsActive
            };
        }

        public async Task<PublisherDto> CreatePublisherAsync(PublisherCreateDto dto)
        {
            var existing = await _repo.GetByNameAsync(dto.Name);
            if (existing != null)
                throw new Exception("Tên nhà xuất bản này đã tồn tại!");

            var newPublisher = new Publisher
            {                PublisherId = IdGenerator.GeneratePublisherId(),                Name = dto.Name,
                Description = dto.Description,
                IsActive = true // Mặc định là hoạt động
            };

            await _repo.AddAsync(newPublisher);

            return new PublisherDto
            {
                PublisherId = newPublisher.PublisherId,
                Name = newPublisher.Name,
                Description = newPublisher.Description,
                IsActive = newPublisher.IsActive
            };
        }

        public async Task<bool> UpdatePublisherAsync(string id, PublisherUpdateDto dto)
        {
            var Publisher = await _repo.GetByIdAsync(id);
            if (Publisher == null) return false;

            // Kiểm tra xem tên mới có bị trùng
            var existing = await _repo.GetByNameAsync(dto.Name);
            if (existing != null && existing.PublisherId != id)
                throw new Exception("Tên danh mục này đã được sử dụng!");

            Publisher.Name = dto.Name;
            Publisher.Description = dto.Description;
            Publisher.IsActive = dto.IsActive;

            await _repo.UpdateAsync(Publisher);
            return true;
        }

        public async Task<bool> DeletePublisherAsync(string id)
        {
            var Publisher = await _repo.GetByIdAsync(id);
            if (Publisher == null) return false;

            Publisher.IsActive = false;
            await _repo.UpdateAsync(Publisher);
            return true;
        }

        public async Task<bool> RestorePublisherAsync(string id)
        {
            var Publisher = await _repo.GetByIdAsync(id);
            if (Publisher == null) return false;

            Publisher.IsActive = true; // Khôi phục
            await _repo.UpdateAsync(Publisher);
            return true;
        }
    }
}