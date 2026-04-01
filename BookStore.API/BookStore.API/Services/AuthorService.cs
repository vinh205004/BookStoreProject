using BookStore.API.DTOs;
using BookStore.API.Models;
using BookStore.API.Repositories;

namespace BookStore.API.Services
{
    public class AuthorService : IAuthorService
    {
        private readonly IAuthorRepository _repo;

        public AuthorService(IAuthorRepository repo) => _repo = repo;

        public async Task<IEnumerable<AuthorDto>> GetAllAuthorsAsync()
        {
            var authors = await _repo.GetAllAsync();
            return authors.Select(a => new AuthorDto
            {
                AuthorId = a.AuthorId,
                Name = a.Name,
                Biography = a.Biography,
                ImageUrl = a.ImageUrl,
                IsActive = a.IsActive,
                BookCount = a.Books.Count(b => !b.IsHidden)
            });
        }

        public async Task<AuthorDto?> GetAuthorByIdAsync(int id)
        {
            var a = await _repo.GetByIdAsync(id);
            if (a == null) return null;

            return new AuthorDto
            {
                AuthorId = a.AuthorId,
                Name = a.Name,
                Biography = a.Biography,
                ImageUrl = a.ImageUrl,
                IsActive = a.IsActive
            };
        }

        public async Task<AuthorDto> CreateAuthorAsync(AuthorCreateDto dto)
        {
            var newAuthor = new Author
            {
                Name = dto.Name,
                Biography = dto.Biography,
                ImageUrl = dto.ImageUrl
            };

            await _repo.AddAsync(newAuthor);

            return new AuthorDto
            {
                AuthorId = newAuthor.AuthorId,
                Name = newAuthor.Name,
                Biography = newAuthor.Biography,
                ImageUrl = newAuthor.ImageUrl
            };
        }

        public async Task<bool> UpdateAuthorAsync(int id, AuthorUpdateDto dto)
        {
            var author = await _repo.GetByIdAsync(id);
            if (author == null) return false;

            author.Name = dto.Name;
            author.Biography = dto.Biography;
            author.ImageUrl = dto.ImageUrl;
            author.IsActive = dto.IsActive;

            await _repo.UpdateAsync(author);
            return true;
        }

        public async Task<bool> DeleteAuthorAsync(int id)
        {
            var author = await _repo.GetByIdAsync(id);
            if (author == null) return false;

            author.IsActive = false;

            await _repo.UpdateAsync(author);
            return true;
        }
        public async Task<bool> RestoreAuthorAsync(int id)
        {
            var category = await _repo.GetByIdAsync(id);
            if (category == null) return false;

            category.IsActive = true; // Khôi phục lại
            await _repo.UpdateAsync(category);
            return true;
        }
    }
}