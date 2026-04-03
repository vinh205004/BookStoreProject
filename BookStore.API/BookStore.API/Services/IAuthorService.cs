using BookStore.API.DTOs;

namespace BookStore.API.Services
{
    public interface IAuthorService
    {
        Task<IEnumerable<AuthorDto>> GetAllAuthorsAsync();
        Task<AuthorDto?> GetAuthorByIdAsync(string id);
        Task<AuthorDto> CreateAuthorAsync(AuthorCreateDto dto);
        Task<bool> UpdateAuthorAsync(string id, AuthorUpdateDto dto);
        Task<bool> DeleteAuthorAsync(string id);
        Task<bool> RestoreAuthorAsync(string id);
    }
}