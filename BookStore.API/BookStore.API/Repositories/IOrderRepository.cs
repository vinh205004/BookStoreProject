using BookStore.API.Models;

namespace BookStore.API.Repositories
{
    public interface IOrderRepository
    {
        Task<IEnumerable<Order>> GetAllAsync();
        Task<Order?> GetByIdAsync(int id);
        Task UpdateAsync(Order order);
    }
}