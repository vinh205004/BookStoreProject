using BookStore.API.Data;
using BookStore.API.DTOs;
using BookStore.API.Models;
using BookStore.API.Repositories;
using BookStore.API.Utilities;
using Microsoft.EntityFrameworkCore;

namespace BookStore.API.Services
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _repo;
        private readonly IBookRepository _bookRepo;
        private readonly ICartRepository _cartRepo;
        private readonly AppDbContext _context;

        public OrderService(IOrderRepository repo, IBookRepository bookRepo, ICartRepository cartRepo, AppDbContext context)
        {
            _repo = repo;
            _bookRepo = bookRepo;
            _cartRepo = cartRepo;
            _context = context;
        }

        public async Task<IEnumerable<OrderDto>> GetAllOrdersAsync()
        {
            var orders = await _repo.GetAllAsync();
            return orders.Select(o => new OrderDto
            {
                OrderId = o.OrderId,
                CustomerName = o.User?.FullName ?? "Khách vãng lai",
                CustomerEmail = o.User?.Email ?? "",
                CustomerPhone = o.PhoneNumber,
                OrderDate = o.OrderDate,
                TotalAmount = o.TotalAmount,
                Status = o.Status,
                ShippingAddress = o.ShippingAddress,
                Note = o.Note,
                OrderItems = o.OrderItems.Select(oi => new OrderItemDto
                {
                    OrderItemId = oi.OrderItemId,
                    BookId = oi.BookId,
                    BookTitle = oi.Book?.Title ?? "Sách không tồn tại",
                    ImageUrl = oi.Book?.BookImages.FirstOrDefault()?.ImageUrl ?? "",
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice
                }).ToList()
            });
        }

        public async Task<OrderDto?> GetOrderByIdAsync(string id)
        {
            var o = await _repo.GetByIdAsync(id);
            if (o == null) return null;

            return new OrderDto
            {
                OrderId = o.OrderId,
                CustomerName = o.User?.FullName ?? "Khách vãng lai",
                CustomerEmail = o.User?.Email ?? "",
                CustomerPhone = o.PhoneNumber,
                OrderDate = o.OrderDate,
                TotalAmount = o.TotalAmount,
                Status = o.Status,
                ShippingAddress = o.ShippingAddress,
                Note = o.Note,
                OrderItems = o.OrderItems.Select(oi => new OrderItemDto
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

        public async Task<bool> UpdateOrderStatusAsync(string id, OrderUpdateStatusDto dto)
        {
            var order = await _repo.GetByIdAsync(id);
            if (order == null) return false;

            // Kiểm tra trạng thái hợp lệ
            var validStatuses = new List<string> { "Pending", "Processing", "Shipped", "Delivered", "Cancelled" };
            if (!validStatuses.Contains(dto.Status))
                throw new Exception("Trạng thái đơn hàng không hợp lệ!");

            order.Status = dto.Status;
            await _repo.UpdateAsync(order);
            return true;
        }

        // User-facing methods
                public async Task<UserOrderDetailDto> CreateOrderAsync(string userId, CreateOrderDto dto)
        {
            if (dto.Items == null || dto.Items.Count == 0)
                throw new Exception("Giỏ hàng không có sản phẩm!");

            var order = new Order
            {
                OrderId = IdGenerator.GenerateOrderId(),
                UserId = userId,
                ShippingAddress = dto.ShippingAddress,
                PhoneNumber = dto.PhoneNumber,
                Note = dto.Note,
                Status = "Pending",
                OrderDate = DateTime.UtcNow,
                TotalAmount = 0,
                OrderItems = new List<OrderItem>()
            };

            decimal totalAmount = 0;
            decimal applicableAmount = 0;

            Voucher? appliedVoucher = null;
            if (!string.IsNullOrEmpty(dto.VoucherCode))
            {
                appliedVoucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Code == dto.VoucherCode && v.IsActive);
                if (appliedVoucher == null)
                    throw new Exception("Mã giảm giá không hợp lệ!");
                    
                var now = DateTime.UtcNow;
                if (now < appliedVoucher.StartDate)
                    throw new Exception("Mã giảm giá chưa đến thời gian có thể sử dụng!");
                if (now > appliedVoucher.ExpirationDate)
                    throw new Exception("Mã giảm giá đã hết hạn!");
                if (string.IsNullOrEmpty(appliedVoucher.ApplicableProductId) && string.IsNullOrEmpty(appliedVoucher.ApplicableCategoryId) && appliedVoucher.UsedCount >= appliedVoucher.Quantity)
                    throw new Exception("Mã giảm giá đã hết số lượng sử dụng!");
            }

            foreach (var item in dto.Items)
            {
                var book = await _bookRepo.GetByIdAsync(item.BookId);
                if (book == null)
                    throw new Exception($"Sách {item.BookId} không tồn tại!");

                if (book.Stock < item.Quantity)
                    throw new Exception($"Sách '{book.Title}' không đủ số lượng!");

                var bookDetail = await _bookRepo.GetBookDetailAsync(item.BookId);
                decimal currentPrice = bookDetail?.DiscountedPrice ?? book.Price;

                var orderItem = new OrderItem
                {
                    OrderItemId = IdGenerator.GenerateOrderItemId(),
                    OrderId = order.OrderId,
                    BookId = item.BookId,
                    Quantity = item.Quantity,
                    UnitPrice = currentPrice
                };

                order.OrderItems.Add(orderItem);
                
                decimal itemTotal = currentPrice * item.Quantity;
                totalAmount += itemTotal;
                
                bool isApplicableForVoucher = true;
                if (appliedVoucher != null)
                {
                    if (!string.IsNullOrEmpty(appliedVoucher.ApplicableProductId) && item.BookId != appliedVoucher.ApplicableProductId)
                    {
                        isApplicableForVoucher = false;
                    }
                    else if (!string.IsNullOrEmpty(appliedVoucher.ApplicableCategoryId) && bookDetail?.CategoryId != appliedVoucher.ApplicableCategoryId)
                    {
                        isApplicableForVoucher = false;
                    }
                    else if (bookDetail?.DiscountVoucherCode == appliedVoucher.Code)
                    {
                        // Sách đã được áp cứng mã voucher này rồi, không được tính thêm vào applicableAmount ở giỏ hàng
                        isApplicableForVoucher = false;
                    }
                }
                
                if (isApplicableForVoucher)
                {
                    applicableAmount += itemTotal;
                }
                
                book.Stock -= item.Quantity;
                await _bookRepo.UpdateAsync(book);
            }

            if (appliedVoucher != null)
            {
                if (totalAmount < appliedVoucher.MinOrderValue)
                    throw new Exception($"Đơn hàng chưa đạt mức tối thiểu ({appliedVoucher.MinOrderValue:N0} đ) để áp dụng mã giảm giá!");

                decimal discount = 0;
                if (appliedVoucher.DiscountType == "Percentage")
                {
                    discount = applicableAmount * (appliedVoucher.DiscountAmount / 100m);
                }
                else
                {
                    discount = Math.Min(appliedVoucher.DiscountAmount, applicableAmount);
                }

                totalAmount -= discount;
                if (totalAmount < 0) totalAmount = 0;

                // Tăng số lượng đã dùng nếu không phải loại áp cứng sản phẩm/danh mục
                bool hasHardcodedVoucher = order.OrderItems.Any(oi => {
                    var bookDetail = _bookRepo.GetBookDetailAsync(oi.BookId).Result;
                    return bookDetail?.DiscountVoucherCode == appliedVoucher.Code;
                });

                if (string.IsNullOrEmpty(appliedVoucher.ApplicableProductId) && string.IsNullOrEmpty(appliedVoucher.ApplicableCategoryId) && !hasHardcodedVoucher)
                {
                    appliedVoucher.UsedCount += 1;
                    _context.Vouchers.Update(appliedVoucher);
                }
            }

            order.TotalAmount = totalAmount;
            await _repo.AddAsync(order);

            if (appliedVoucher != null)
            {
                bool hasHardcodedVoucher = order.OrderItems.Any(oi => {
                    var bookDetail = _bookRepo.GetBookDetailAsync(oi.BookId).Result;
                    return bookDetail?.DiscountVoucherCode == appliedVoucher.Code;
                });

                if (string.IsNullOrEmpty(appliedVoucher.ApplicableProductId) && string.IsNullOrEmpty(appliedVoucher.ApplicableCategoryId) && !hasHardcodedVoucher)
                {
                    await _context.SaveChangesAsync();
                }
            }

            var cart = await _cartRepo.GetUserCartAsync(userId);
            if (cart != null && cart.CartItems.Any())
            {
                var bookIdsOrdered = dto.Items.Select(i => i.BookId).ToList();
                var itemsToRemove = cart.CartItems.Where(ci => bookIdsOrdered.Contains(ci.BookId)).ToList();
                
                foreach (var itemToRemove in itemsToRemove)
                {
                    await _cartRepo.DeleteCartItemAsync(itemToRemove.CartItemId);
                    cart.CartItems.Remove(itemToRemove);
                }

                cart.TotalQuantity = cart.CartItems.Sum(x => x.Quantity);
                cart.TotalPrice = cart.CartItems.Sum(x => x.TotalPrice);

                await _cartRepo.UpdateCartAsync(cart);
            }

            return await GetUserOrderDetailAsync(userId, order.OrderId) ?? throw new Exception("Không thể tạo đơn hàng!");
        }

public async Task<IEnumerable<UserOrderDetailDto>> GetUserOrdersAsync(string userId)
        {
            var orders = await _context.Orders
                .Where(o => o.UserId == userId)
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Book)
                .ThenInclude(b => b.BookImages)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            return orders.Select(o => new UserOrderDetailDto
            {
                OrderId = o.OrderId,
                OrderDate = o.OrderDate,
                TotalAmount = o.TotalAmount,
                Status = o.Status,
                ShippingAddress = o.ShippingAddress,
                PhoneNumber = o.PhoneNumber,
                Note = o.Note,
                Items = o.OrderItems.Select(oi => new UserOrderItemDto
                {
                    BookId = oi.BookId,
                    BookTitle = oi.Book?.Title ?? "Sách không tồn tại",
                    ImageUrl = oi.Book?.BookImages.FirstOrDefault()?.ImageUrl ?? "",
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice
                }).ToList()
            });
        }

        public async Task<UserOrderDetailDto?> GetUserOrderDetailAsync(string userId, string orderId)
        {
            var order = await _context.Orders
                .Where(o => o.OrderId == orderId && o.UserId == userId)
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Book)
                .ThenInclude(b => b.BookImages)
                .FirstOrDefaultAsync();

            if (order == null) return null;

            return new UserOrderDetailDto
            {
                OrderId = order.OrderId,
                OrderDate = order.OrderDate,
                TotalAmount = order.TotalAmount,
                Status = order.Status,
                ShippingAddress = order.ShippingAddress,
                PhoneNumber = order.PhoneNumber,
                Note = order.Note,
                Items = order.OrderItems.Select(oi => new UserOrderItemDto
                {
                    BookId = oi.BookId,
                    BookTitle = oi.Book?.Title ?? "Sách không tồn tại",
                    ImageUrl = oi.Book?.BookImages.FirstOrDefault()?.ImageUrl ?? "",
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice
                }).ToList()
            };
        }
    }
}