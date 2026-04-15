using BookStore.API.DTOs;
using BookStore.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookStore.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentsController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
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

                var result = await _paymentService.CreateVnpayPaymentAsync(userId, dto, HttpContext);
                return Ok(result);
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
            var redirectUrl = await _paymentService.HandleVnpayReturnAsync(Request.Query);
            return Redirect(redirectUrl);
        }
    }
}
