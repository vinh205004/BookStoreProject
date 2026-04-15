using BookStore.API.Data;
using BookStore.API.DTOs;
using BookStore.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStore.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private readonly VnpayService _vnpayService;
        private readonly AppDbContext _context;

        public PaymentsController(IOrderService orderService, VnpayService vnpayService, AppDbContext context)
        {
            _orderService = orderService;
            _vnpayService = vnpayService;
            _context = context;
        }

        [HttpPost("vnpay/create")]
        [Authorize]
        public async Task<IActionResult> CreateVnpayPayment([FromBody] CreateVnpayPaymentDto dto)
        {
            try
            {
                var userId = User.FindFirst("UserId")?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Không xác định được người dùng" });

                var createdOrder = await _orderService.CreateOrderAsync(userId, dto.Order);
                var order = await _context.Orders.FirstOrDefaultAsync(o => o.OrderId == createdOrder.OrderId);
                if (order == null)
                    return BadRequest(new { error = "Không tìm thấy đơn hàng vừa tạo" });

                order.PaymentMethod = "VNPAY";
                await _context.SaveChangesAsync();

                var paymentUrl = _vnpayService.CreatePaymentUrl(order, HttpContext);
                return Ok(new CreateVnpayPaymentResponseDto
                {
                    OrderId = order.OrderId,
                    PaymentUrl = paymentUrl
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("vnpay-return")]
        [AllowAnonymous]
        public async Task<IActionResult> VnpayReturn()
        {
            var orderId = Request.Query["vnp_TxnRef"].ToString();
            var responseCode = Request.Query["vnp_ResponseCode"].ToString();
            var transactionStatus = Request.Query["vnp_TransactionStatus"].ToString();
            var isValidSignature = _vnpayService.ValidateSignature(Request.Query);
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

                    if (!isSuccess && order.Status != "Cancelled")
                    {
                        foreach (var item in order.OrderItems)
                        {
                            if (item.Book != null)
                            {
                                item.Book.Stock += item.Quantity;
                            }
                        }
                    }

                    order.Status = isSuccess ? "Processing" : "Cancelled";
                    if (!order.Note.Contains("VNPAY", StringComparison.OrdinalIgnoreCase))
                    {
                        order.Note = string.IsNullOrWhiteSpace(order.Note)
                            ? "Thanh toán qua VNPAY sandbox"
                            : $"{order.Note} | Thanh toán qua VNPAY sandbox";
                    }

                    await _context.SaveChangesAsync();
                }
            }

            var redirectUrl = _vnpayService.GetClientReturnUrl(orderId, isSuccess, responseCode);
            return Redirect(redirectUrl);
        }
    }
}
