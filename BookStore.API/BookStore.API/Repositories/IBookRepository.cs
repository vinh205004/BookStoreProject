using BookStore.API.Models;

namespace BookStore.API.Repositories
{
    public interface IBookRepository
    {
        Task<IEnumerable<Book>> GetAllAsync();
        Task<Book?> GetByIdAsync(string id);
        Task AddAsync(Book book);
        Task UpdateAsync(Book book);
    }
}