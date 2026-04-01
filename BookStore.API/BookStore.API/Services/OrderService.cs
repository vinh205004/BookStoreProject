using BookStore.API.DTOs;
using BookStore.API.Repositories;

namespace BookStore.API.Services
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _repo;

        public OrderService(IOrderRepository repo) => _repo = repo;

        public async Task<IEnumerable<OrderDto>> GetAllOrdersAsync()
        {
            var orders = await _repo.GetAllAsync();
            return orders.Select(o => new OrderDto
            {
                OrderId = o.OrderId,
                CustomerName = o.User?.FullName ?? "Khách vãng lai",
                CustomerEmail = o.User?.Email ?? "",
                OrderDate = o.OrderDate,
                TotalAmount = o.TotalAmount,
                Status = o.Status,
                ShippingAddress = o.ShippingAddress,
                PhoneNumber = o.PhoneNumber,
                Note = o.Note
            });
        }

        public async Task<OrderDto?> GetOrderByIdAsync(int id)
        {
            var o = await _repo.GetByIdAsync(id);
            if (o == null) return null;

            return new OrderDto
            {
                OrderId = o.OrderId,
                CustomerName = o.User?.FullName ?? "Khách vãng lai",
                CustomerEmail = o.User?.Email ?? "",
                OrderDate = o.OrderDate,
                TotalAmount = o.TotalAmount,
                Status = o.Status,
                ShippingAddress = o.ShippingAddress,
                PhoneNumber = o.PhoneNumber,
                Note = o.Note,
                Items = o.OrderItems.Select(oi => new OrderItemDto
                {
                    OrderItemId = oi.OrderItemId,
                    BookId = oi.BookId,
                    BookTitle = oi.Book?.Title ?? "Sách không tồn tại",
                    ImageUrl = oi.Book?.BookImages.FirstOrDefault()?.ImageUrl ?? "",
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice
                }).ToList()
            };
        }

        public async Task<bool> UpdateOrderStatusAsync(int id, OrderUpdateStatusDto dto)
        {
            var order = await _repo.GetByIdAsync(id);
            if (order == null) return false;

            // Kiểm tra trạng thái hợp lệ
            var validStatuses = new List<string> { "Chờ xử lý", "Đang giao", "Đã giao", "Đã hủy" };
            if (!validStatuses.Contains(dto.Status))
                throw new Exception("Trạng thái đơn hàng không hợp lệ!");

            order.Status = dto.Status;
            await _repo.UpdateAsync(order);
            return true;
        }
    }
}