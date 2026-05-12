using BookStore.API.Data;
using BookStore.API.DTOs;
using BookStore.API.Hubs;
using BookStore.API.Models;
using BookStore.API.Repositories;
using BookStore.API.Utilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;

namespace BookStore.API.Services
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _repo;
        private readonly IBookRepository _bookRepo;
        private readonly ICartRepository _cartRepo;
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _notificationHub;

        public OrderService(IOrderRepository repo, IBookRepository bookRepo, ICartRepository cartRepo, AppDbContext context, IHubContext<NotificationHub> notificationHub)
        {
            _repo = repo;
            _bookRepo = bookRepo;
            _cartRepo = cartRepo;
            _context = context;
            _notificationHub = notificationHub;
        }

        public async Task<IEnumerable<OrderDto>> GetAllOrdersAsync()
        {
            var orders = await _repo.GetAllAsync();
            return orders.Where(o => o.Status != "PaymentPending").Select(o => new OrderDto
            {
                OrderId = o.OrderId,
                UserId = o.UserId,
                CustomerName = o.User?.FullName ?? "Khách vãng lai",
                CustomerEmail = o.User?.Email ?? "",
                CustomerPhone = o.PhoneNumber,
                OrderDate = o.OrderDate,
                TotalAmount = o.TotalAmount,
                Status = o.Status,
                PaymentMethod = ResolvePaymentMethod(o),
                AppliedVoucherCode = o.AppliedVoucherCode ?? ExtractVoucherCode(o.Note),
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
                UserId = o.UserId,
                CustomerName = o.User?.FullName ?? "Khách vãng lai",
                CustomerEmail = o.User?.Email ?? "",
                CustomerPhone = o.PhoneNumber,
                OrderDate = o.OrderDate,
                TotalAmount = o.TotalAmount,
                Status = o.Status,
                PaymentMethod = ResolvePaymentMethod(o),
                AppliedVoucherCode = o.AppliedVoucherCode ?? ExtractVoucherCode(o.Note),
                ShippingAddress = o.ShippingAddress,
                Note = o.Note,
                OrderItems = o.OrderItems.Select(MapOrderItemDto).ToList()
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

            var previousStatus = order.Status;

            if (dto.Status == "Cancelled" && previousStatus != "Cancelled")
            {
                await RestoreOrderStockAsync(order);
            }

            if (dto.Status == "Delivered" && previousStatus != "Delivered")
            {
                await CountAppliedVoucherUsageAsync(order);
            }

            order.Status = dto.Status;
            await _repo.UpdateAsync(order);
            await NotifyOrderStatusChangedAsync(order);
            return true;
        }

        // Khách hàng endpoints
        public async Task<UserOrderDetailDto> CreateOrderAsync(string userId, CreateOrderDto dto, string paymentMethod = "COD", bool finalizePurchase = true)
        {
            if (dto.Items == null || dto.Items.Count == 0)
                throw new Exception("Giỏ hàng không có sản phẩm!");

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var order = new Order
                {
                    OrderId = IdGenerator.GenerateOrderId(),
                    UserId = userId,
                    ShippingAddress = dto.ShippingAddress,
                    PhoneNumber = dto.PhoneNumber,
                    Note = dto.Note ?? string.Empty,
                    AppliedVoucherCode = string.IsNullOrWhiteSpace(dto.VoucherCode) ? null : dto.VoucherCode,
                    Status = finalizePurchase ? "Pending" : "PaymentPending",
                    PaymentMethod = paymentMethod == "VNPAY" ? "VNPAY" : "COD",
                    OrderDate = DateTime.UtcNow,
                    TotalAmount = 0,
                    OrderItems = new List<OrderItem>()
                };

                decimal totalAmount = 0;
                decimal applicableAmount = 0;

                Voucher? appliedVoucher = null;
                if (!string.IsNullOrEmpty(dto.VoucherCode))
                {
                    appliedVoucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Code == dto.VoucherCode && v.IsActive && !v.IsHidden);
                    if (appliedVoucher == null)
                        throw new Exception("Mã giảm giá không hợp lệ!");

                    var now = DateTime.UtcNow;
                    if (now < appliedVoucher.StartDate)
                        throw new Exception("Mã giảm giá chưa đến thời gian có thể sử dụng!");
                    if (now > appliedVoucher.ExpirationDate)
                        throw new Exception("Mã giảm giá đã hết hạn!");
                    if (appliedVoucher.UsedCount >= appliedVoucher.Quantity)
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
                        if (bookDetail?.DiscountVoucherCode == appliedVoucher.Code)
                        {
                            isApplicableForVoucher = false;
                        }
                        else if (appliedVoucher.IsHidden &&
                                 (!string.IsNullOrEmpty(appliedVoucher.ApplicableProductId) ||
                                  !string.IsNullOrEmpty(appliedVoucher.ApplicableCategoryId)))
                        {
                            bool isProductMatch = !string.IsNullOrEmpty(appliedVoucher.ApplicableProductId) && ("," + appliedVoucher.ApplicableProductId + ",").Contains("," + item.BookId + ",");
                            bool isCategoryMatch = !string.IsNullOrEmpty(appliedVoucher.ApplicableCategoryId) && bookDetail?.CategoryId == appliedVoucher.ApplicableCategoryId && currentPrice >= appliedVoucher.MinOrderValue;

                            if (!isProductMatch && !isCategoryMatch)
                            {
                                isApplicableForVoucher = false;
                            }
                        }
                    }

                    if (isApplicableForVoucher)
                    {
                        applicableAmount += itemTotal;
                    }

                    if (finalizePurchase)
                    {
                        book.Stock -= item.Quantity;
                    }
                }

                if (appliedVoucher != null)
                {
                    if (totalAmount < appliedVoucher.MinOrderValue)
                        throw new Exception($"Đơn hàng chưa đạt mức tối thiểu ({appliedVoucher.MinOrderValue:N0} đ) để áp dụng mã giảm giá!");

                    decimal discount = appliedVoucher.DiscountType == "Percentage"
                        ? applicableAmount * (appliedVoucher.DiscountAmount / 100m)
                        : Math.Min(appliedVoucher.DiscountAmount, applicableAmount);

                    totalAmount -= discount;
                    if (totalAmount < 0) totalAmount = 0;

                }

                order.TotalAmount = totalAmount;
                await _repo.AddAsync(order);

                if (appliedVoucher != null && finalizePurchase)
                {
                    await _context.SaveChangesAsync();
                }

                if (finalizePurchase)
                {
                    await RemoveOrderedItemsFromCartAsync(userId, dto.Items.Select(i => i.BookId));
                }

                await transaction.CommitAsync();
                var createdOrder = await GetUserOrderDetailAsync(userId, order.OrderId) ?? throw new Exception("Không thể tạo đơn hàng!");
                if (finalizePurchase)
                {
                    await NotifyNewOrderCreatedAsync(order);
                }

                return createdOrder;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> CompletePendingVnpayOrderAsync(string orderId)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var order = await _context.Orders
                    .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Book)
                    .FirstOrDefaultAsync(o => o.OrderId == orderId && o.Status == "PaymentPending" && o.PaymentMethod == "VNPAY");

                if (order == null)
                    return false;

                foreach (var item in order.OrderItems)
                {
                    if (item.Book == null)
                        throw new Exception($"Sách {item.BookId} không tồn tại!");

                    if (item.Book.Stock < item.Quantity)
                        throw new Exception($"Sách '{item.Book.Title}' không đủ số lượng để hoàn tất đơn VNPAY!");

                    item.Book.Stock -= item.Quantity;
                }

                await RemoveOrderedItemsFromCartAsync(order.UserId, order.OrderItems.Select(i => i.BookId));

                order.Status = "Processing";
                order.Note = RemoveVoucherMarker(order.Note);
                if (!order.Note.Contains("VNPAY", StringComparison.OrdinalIgnoreCase))
                {
                    order.Note = string.IsNullOrWhiteSpace(order.Note)
                        ? "Thanh toán qua VNPAY sandbox"
                        : $"{order.Note} | Thanh toán qua VNPAY sandbox";
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                await NotifyNewOrderCreatedAsync(order);
                await NotifyOrderStatusChangedAsync(order);
                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> CancelUserOrderAsync(string userId, string orderId)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Book)
                .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == userId);

            if (order == null) return false;

            if (order.Status != "Pending" && order.Status != "Processing")
                throw new Exception("Chỉ có thể hủy đơn hàng khi đang chờ xác nhận hoặc đang xử lý!");

            await RestoreOrderStockAsync(order);
            order.Status = "Cancelled";
            order.Note = string.IsNullOrWhiteSpace(order.Note)
                ? "Khách hàng đã hủy đơn"
                : $"{order.Note} | Khách hàng đã hủy đơn";

            await _context.SaveChangesAsync();
            await _notificationHub.Clients.Group("Admins").SendAsync("OrderCancelledByCustomer", new
            {
                orderId = order.OrderId,
                userId = order.UserId,
                status = order.Status,
                statusText = GetStatusText(order.Status),
                totalAmount = order.TotalAmount
            });

            return true;
        }

        public async Task<IEnumerable<UserOrderDetailDto>> GetUserOrdersAsync(string userId)
        {
            var orders = await _context.Orders
                .Where(o => o.UserId == userId && o.Status != "PaymentPending")
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Book)
                .ThenInclude(b => b!.BookImages)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            return orders.Select(o => new UserOrderDetailDto
            {
                OrderId = o.OrderId,
                OrderDate = o.OrderDate,
                TotalAmount = o.TotalAmount,
                Status = o.Status,
                PaymentMethod = ResolvePaymentMethod(o),
                AppliedVoucherCode = o.AppliedVoucherCode ?? ExtractVoucherCode(o.Note),
                ShippingAddress = o.ShippingAddress,
                PhoneNumber = o.PhoneNumber,
                Note = o.Note,
                Items = o.OrderItems.Select(MapUserOrderItemDto).ToList()
            });
        }

        public async Task<UserOrderDetailDto?> GetUserOrderDetailAsync(string userId, string orderId)
        {
            var order = await _context.Orders
                .Where(o => o.OrderId == orderId && o.UserId == userId)
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Book)
                .ThenInclude(b => b!.BookImages)
                .FirstOrDefaultAsync();

            if (order == null) return null;
            return new UserOrderDetailDto
            {
                OrderId = order.OrderId,
                OrderDate = order.OrderDate,
                TotalAmount = order.TotalAmount,
                Status = order.Status,
                PaymentMethod = ResolvePaymentMethod(order),
                AppliedVoucherCode = order.AppliedVoucherCode ?? ExtractVoucherCode(order.Note),
                ShippingAddress = order.ShippingAddress,
                PhoneNumber = order.PhoneNumber,
                Note = order.Note,
                Items = order.OrderItems.Select(MapUserOrderItemDto).ToList()
            };
        }

        private static Task RestoreOrderStockAsync(Order order)
        {
            foreach (var item in order.OrderItems)
            {
                if (item.Book != null)
                {
                    item.Book.Stock += item.Quantity;
                }
            }

            return Task.CompletedTask;
        }

        private async Task CountAppliedVoucherUsageAsync(Order order)
        {
            var voucherCode = order.AppliedVoucherCode ?? ExtractVoucherCode(order.Note);
            if (string.IsNullOrWhiteSpace(voucherCode))
                return;

            var voucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Code == voucherCode && v.IsActive && !v.IsHidden);
            if (voucher == null)
                return;

            if (voucher.UsedCount >= voucher.Quantity)
                throw new Exception("Mã giảm giá đã hết số lượng sử dụng!");

            voucher.UsedCount += 1;
            _context.Vouchers.Update(voucher);
        }

        private static OrderItemDto MapOrderItemDto(OrderItem item)
        {
            var hasHardcodedDiscount = item.Book != null && item.UnitPrice < item.Book.Price;

            return new OrderItemDto
            {
                OrderItemId = item.OrderItemId,
                BookId = item.BookId,
                BookTitle = item.Book?.Title ?? "Sách không tồn tại",
                ImageUrl = item.Book?.BookImages.FirstOrDefault()?.ImageUrl ?? "",
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                OriginalPrice = hasHardcodedDiscount ? item.Book!.Price : null,
                HardcodedVoucherCode = null
            };
        }

        private static UserOrderItemDto MapUserOrderItemDto(OrderItem item)
        {
            var hasHardcodedDiscount = item.Book != null && item.UnitPrice < item.Book.Price;

            return new UserOrderItemDto
            {
                BookId = item.BookId,
                BookTitle = item.Book?.Title ?? "Sách không tồn tại",
                ImageUrl = item.Book?.BookImages.FirstOrDefault()?.ImageUrl ?? "",
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                OriginalPrice = hasHardcodedDiscount ? item.Book!.Price : null,
                HardcodedVoucherCode = null
            };
        }

        private async Task RemoveOrderedItemsFromCartAsync(string userId, IEnumerable<string> bookIds)
        {
            var cart = await _cartRepo.GetUserCartAsync(userId);
            if (cart == null || !cart.CartItems.Any())
                return;

            var orderedBookIds = bookIds.ToHashSet();
            var itemsToRemove = cart.CartItems.Where(ci => orderedBookIds.Contains(ci.BookId)).ToList();

            foreach (var itemToRemove in itemsToRemove)
            {
                await _cartRepo.DeleteCartItemAsync(itemToRemove.CartItemId);
                cart.CartItems.Remove(itemToRemove);
            }

            cart.TotalQuantity = cart.CartItems.Sum(x => x.Quantity);
            cart.TotalPrice = cart.CartItems.Sum(x => x.TotalPrice);

            await _cartRepo.UpdateCartAsync(cart);
        }

        private static string BuildOrderNote(string? note, string? voucherCode)
        {
            var cleanNote = note ?? string.Empty;
            return string.IsNullOrWhiteSpace(voucherCode)
                ? cleanNote
                : $"{cleanNote} [VoucherCode:{voucherCode}]".Trim();
        }

        private static string? ExtractVoucherCode(string? note)
        {
            const string marker = "[VoucherCode:";
            if (string.IsNullOrWhiteSpace(note))
                return null;

            var start = note.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
            if (start < 0)
                return null;

            start += marker.Length;
            var end = note.IndexOf(']', start);
            return end > start ? note[start..end] : null;
        }

        private static string RemoveVoucherMarker(string note)
        {
            const string marker = "[VoucherCode:";
            var start = note.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
            if (start < 0)
                return note;

            var end = note.IndexOf(']', start);
            if (end < start)
                return note;

            return (note[..start] + note[(end + 1)..]).Trim();
        }

        private static string ResolvePaymentMethod(Order order)
        {
            if (order.PaymentMethod == "VNPAY" ||
                (!string.IsNullOrWhiteSpace(order.Note) && order.Note.Contains("VNPAY", StringComparison.OrdinalIgnoreCase)))
            {
                return "VNPAY";
            }

            return "COD";
        }

        private async Task NotifyOrderStatusChangedAsync(Order order)
        {
            await _notificationHub.Clients.User(order.UserId).SendAsync("OrderStatusChanged", new
            {
                orderId = order.OrderId,
                status = order.Status,
                statusText = GetStatusText(order.Status),
                totalAmount = order.TotalAmount,
                paymentMethod = ResolvePaymentMethod(order)
            });
        }

        private async Task NotifyNewOrderCreatedAsync(Order order)
        {
            await _notificationHub.Clients.Group("Admins").SendAsync("NewOrderCreated", new
            {
                orderId = order.OrderId,
                userId = order.UserId,
                status = order.Status,
                statusText = GetStatusText(order.Status),
                totalAmount = order.TotalAmount,
                paymentMethod = ResolvePaymentMethod(order)
            });
        }

        private static string GetStatusText(string status)
        {
            return status switch
            {
                "Pending" => "Chờ xác nhận",
                "Processing" => "Đang xử lý",
                "Shipped" => "Đang giao hàng",
                "Delivered" => "Giao thành công",
                "Cancelled" => "Đã hủy",
                "PaymentPending" => "Chờ thanh toán",
                _ => status
            };
        }
    }
}
