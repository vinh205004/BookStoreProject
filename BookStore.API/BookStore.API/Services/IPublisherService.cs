using BookStore.API.DTOs;

namespace BookStore.API.Services
{
    public interface IPublisherService
    {
        Task<IEnumerable<PublisherDto>> GetAllCategoriesAsync();
        Task<PublisherDto?> GetPublisherByIdAsync(int id);
        Task<PublisherDto> CreatePublisherAsync(PublisherCreateDto dto);
        Task<bool> UpdatePublisherAsync(int id, PublisherUpdateDto dto);
        Task<bool> DeletePublisherAsync(int id); // Xóa mềm
        Task<bool> RestorePublisherAsync(int id);
    }
}