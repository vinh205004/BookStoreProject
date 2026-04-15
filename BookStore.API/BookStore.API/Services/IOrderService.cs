using BookStore.API.DTOs;

namespace BookStore.API.Services
{
    public interface IOrderService
    {
        // Admin endpoints
        Task<IEnumerable<OrderDto>> GetAllOrdersAsync();
        Task<OrderDto?> GetOrderByIdAsync(string id);
        Task<bool> UpdateOrderStatusAsync(string id, OrderUpdateStatusDto dto);

        // User endpoints
        Task<UserOrderDetailDto> CreateOrderAsync(string userId, CreateOrderDto dto);
        Task<bool> CancelUserOrderAsync(string userId, string orderId);
        Task<IEnumerable<UserOrderDetailDto>> GetUserOrdersAsync(string userId);
        Task<UserOrderDetailDto?> GetUserOrderDetailAsync(string userId, string orderId);
    }
}
