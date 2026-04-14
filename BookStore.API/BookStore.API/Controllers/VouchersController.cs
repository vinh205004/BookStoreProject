using BookStore.API.DTOs;
using BookStore.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookStore.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    
    public class VouchersController : ControllerBase
    {
        private readonly IVoucherService _voucherService;

        public VouchersController(IVoucherService voucherService)
        {
            _voucherService = voucherService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var vouchers = await _voucherService.GetAllVouchersAsync();
            return Ok(vouchers);
        }

        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveVouchers()
        {
            var vouchers = await _voucherService.GetAllVouchersAsync();
            var now = DateTime.UtcNow;
            var activeVouchers = vouchers.Where(v => 
                v.IsActive && 
                !v.IsHidden &&
                (v.StartDate <= now || v.StartDate == default) && 
                (v.ExpirationDate >= now || v.ExpirationDate == default) && 
                (string.IsNullOrEmpty(v.ApplicableProductId) ? v.UsedCount < v.Quantity : true));
            return Ok(activeVouchers);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetById(string id)
        {
            var voucher = await _voucherService.GetVoucherByIdAsync(id);
            if (voucher == null) return NotFound(new { message = "Không tìm thấy Voucher" });
            return Ok(voucher);
        }

        [HttpGet("public/{code}")]
        [Authorize] 
        public async Task<IActionResult> GetByCode(string code)
        {
            var rawVouchers = await _voucherService.GetAllVouchersAsync();
            var voucher = rawVouchers.FirstOrDefault(v => v.Code.ToUpper() == code.ToUpper() && v.IsActive);
            
            if (voucher == null) return NotFound(new { message = "Không tồn tại mã giảm giá này!" });
            
            var now = DateTime.UtcNow;
            if (now < voucher.StartDate) return BadRequest(new { message = "Mã giảm giá chưa tới thời gian bắt đầu!" });
            if (now > voucher.ExpirationDate) return BadRequest(new { message = "Mã giảm giá đã hết hạn!" });
            if (string.IsNullOrEmpty(voucher.ApplicableProductId) && voucher.UsedCount >= voucher.Quantity) return BadRequest(new { message = "Mã giảm giá đã hết số lượng!" });
            
            return Ok(voucher);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
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
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(string id, [FromBody] VoucherUpdateDto dto)
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
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(string id)
        {
            var success = await _voucherService.DeleteVoucherAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy Voucher để vô hiệu hóa" });
            return Ok(new { message = "Đã vô hiệu hóa Voucher thành công!" });
        }
    }
}