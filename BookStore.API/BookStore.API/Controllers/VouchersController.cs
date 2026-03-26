using BookStore.API.DTOs;
using BookStore.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookStore.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")] // Đặt Authorize ở mức class để áp dụng cho mọi hàm bên dưới
    public class VouchersController : ControllerBase
    {
        private readonly IVoucherService _voucherService;

        public VouchersController(IVoucherService voucherService)
        {
            _voucherService = voucherService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var vouchers = await _voucherService.GetAllVouchersAsync();
            return Ok(vouchers);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var voucher = await _voucherService.GetVoucherByIdAsync(id);
            if (voucher == null) return NotFound(new { message = "Không tìm thấy Voucher" });
            return Ok(voucher);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] VoucherCreateDto dto)
        {
            try
            {
                var result = await _voucherService.CreateVoucherAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = result.VoucherId }, result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] VoucherUpdateDto dto)
        {
            try
            {
                var success = await _voucherService.UpdateVoucherAsync(id, dto);
                if (!success) return NotFound(new { message = "Không tìm thấy Voucher để cập nhật" });
                return Ok(new { message = "Cập nhật Voucher thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _voucherService.DeleteVoucherAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy Voucher để vô hiệu hóa" });
            return Ok(new { message = "Đã vô hiệu hóa Voucher thành công!" });
        }
    }
}