using BookStore.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookStore.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")] // Chỉ Admin mới được phép Upload ảnh
    public class UploadsController : ControllerBase
    {
        private readonly PhotoService _photoService;

        public UploadsController(PhotoService photoService)
        {
            _photoService = photoService;
        }

        [HttpPost("image")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { error = "Không tìm thấy file ảnh!" });

                // Kiểm tra định dạng
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(extension))
                    return BadRequest(new { error = "Chỉ chấp nhận file ảnh (.jpg, .png, .webp)!" });

                var url = await _photoService.UploadImageAsync(file);

                // Trả về URL bảo mật
                return Ok(new { url = url });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}