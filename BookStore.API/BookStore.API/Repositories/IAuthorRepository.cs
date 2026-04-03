using BookStore.API.Models;

namespace BookStore.API.Repositories
{
    public interface IAuthorRepository
    {
        Task<IEnumerable<Author>> GetAllAsync();
        Task<Author?> GetByIdAsync(string id);
        Task<bool> HasBooksAsync(string id); // Kiểm tra tác giả có sách không
        Task AddAsync(Author author);
        Task UpdateAsync(Author author);
    }
}