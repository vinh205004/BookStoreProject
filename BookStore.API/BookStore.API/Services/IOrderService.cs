using BookStore.API.DTOs;

namespace BookStore.API.Services
{
    public interface IOrderService
    {
        Task<IEnumerable<OrderDto>> GetAllOrdersAsync();
        Task<OrderDto?> GetOrderByIdAsync(int id);
        Task<bool> UpdateOrderStatusAsync(int id, OrderUpdateStatusDto dto);
    }
}