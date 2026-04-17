using BookStore.API.Data;
using BookStore.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace BookStore.API.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IOrderService _orderService;
        private readonly VnpayService _vnpayService;
        private readonly AppDbContext _context;

        public PaymentService(IOrderService orderService, VnpayService vnpayService, AppDbContext context)
        {
            _orderService = orderService;
            _vnpayService = vnpayService;
            _context = context;
        }

        public async Task<CreateVnpayPaymentResponseDto> CreateVnpayPaymentAsync(string userId, CreateVnpayPaymentDto dto, HttpContext httpContext)
        {
            var createdOrder = await _orderService.CreateOrderAsync(userId, dto.Order, "VNPAY", finalizePurchase: false);
            var order = await _context.Orders.AsNoTracking().FirstOrDefaultAsync(o => o.OrderId == createdOrder.OrderId);
            if (order == null)
            {
                throw new Exception("Khong tim thay don hang vua tao");
            }

            var paymentUrl = _vnpayService.CreatePaymentUrl(order.OrderId, order.TotalAmount, httpContext);
            return new CreateVnpayPaymentResponseDto
            {
                OrderId = order.OrderId,
                Amount = order.TotalAmount,
                PaymentUrl = paymentUrl
            };
        }

        public async Task<string> HandleVnpayReturnAsync(IQueryCollection query)
        {
            var orderId = query["vnp_TxnRef"].ToString();
            var responseCode = query["vnp_ResponseCode"].ToString();
            var transactionStatus = query["vnp_TransactionStatus"].ToString();
            var isValidSignature = _vnpayService.ValidateSignature(query);
            var isSuccess = isValidSignature && responseCode == "00" && transactionStatus == "00";

            if (!string.IsNullOrEmpty(orderId))
            {
                var order = await _context.Orders
                    .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Book)
                    .FirstOrDefaultAsync(o => o.OrderId == orderId);

                if (order != null)
                {
                    order.PaymentMethod = "VNPAY";

                    if (isSuccess)
                    {
                        await _orderService.CompletePendingVnpayOrderAsync(order.OrderId);
                    }
                    else
                    {
                        if (order.Status != "PaymentPending" && order.Status != "Cancelled")
                        {
                            foreach (var item in order.OrderItems)
                            {
                                if (item.Book != null)
                                {
                                    item.Book.Stock += item.Quantity;
                                }
                            }
                        }

                        order.Status = "Cancelled";
                        if (!order.Note.Contains("VNPAY", StringComparison.OrdinalIgnoreCase))
                        {
                            order.Note = string.IsNullOrWhiteSpace(order.Note)
                                ? "Thanh toan qua VNPAY sandbox"
                                : $"{order.Note} | Thanh toan qua VNPAY sandbox";
                        }

                        await _context.SaveChangesAsync();
                    }
                }
            }

            return _vnpayService.GetClientReturnUrl(orderId, isSuccess, responseCode);
        }
    }
}
