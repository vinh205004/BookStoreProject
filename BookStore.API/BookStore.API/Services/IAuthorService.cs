using BookStore.API.DTOs;

namespace BookStore.API.Services
{
    public interface IAuthorService
    {
        Task<IEnumerable<AuthorDto>> GetAllAuthorsAsync();
        Task<AuthorDto?> GetAuthorByIdAsync(int id);
        Task<AuthorDto> CreateAuthorAsync(AuthorCreateDto dto);
        Task<bool> UpdateAuthorAsync(int id, AuthorUpdateDto dto);
        Task<bool> DeleteAuthorAsync(int id);
        Task<bool> RestoreAuthorAsync(int id);
    }
}