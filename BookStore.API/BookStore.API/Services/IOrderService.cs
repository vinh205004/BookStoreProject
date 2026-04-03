using BookStore.API.DTOs;

namespace BookStore.API.Services
{
    public interface IOrderService
    {
        Task<IEnumerable<OrderDto>> GetAllOrdersAsync();
        Task<OrderDto?> GetOrderByIdAsync(string id);
        Task<bool> UpdateOrderStatusAsync(string id, OrderUpdateStatusDto dto);
    }
}