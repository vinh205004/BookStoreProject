using BookStore.API.DTOs;

namespace BookStore.API.Services
{
    public interface IPublisherService
    {
        Task<IEnumerable<PublisherDto>> GetAllCategoriesAsync();
        Task<PublisherDto?> GetPublisherByIdAsync(string id);
        Task<PublisherDto> CreatePublisherAsync(PublisherCreateDto dto);
        Task<bool> UpdatePublisherAsync(string id, PublisherUpdateDto dto);
        Task<bool> DeletePublisherAsync(string id); // Xóa mềm
        Task<bool> RestorePublisherAsync(string id);
    }
}