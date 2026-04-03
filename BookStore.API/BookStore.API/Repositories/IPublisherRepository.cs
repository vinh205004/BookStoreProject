using BookStore.API.Models;

namespace BookStore.API.Repositories
{
    public interface IPublisherRepository
    {
        Task<IEnumerable<Publisher>> GetAllAsync();
        Task<Publisher?> GetByIdAsync(string id);
        Task<Publisher?> GetByNameAsync(string name);
        Task AddAsync(Publisher publisher);
        Task UpdateAsync(Publisher publisher);

    }
}