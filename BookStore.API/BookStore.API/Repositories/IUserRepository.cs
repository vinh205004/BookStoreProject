using BookStore.API.Models;

namespace BookStore.API.Repositories
{
    public interface IUserRepository
    {
        Task<IEnumerable<User>> GetAllAsync();
        Task<User?> GetByIdAsync(string id);
        Task UpdateAsync(User user);
    }
}