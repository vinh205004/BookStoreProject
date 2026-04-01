using BookStore.API.DTOs;
using BookStore.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookStore.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PublishersController : ControllerBase
    {
        private readonly IPublisherService _publisherService;

        public PublishersController(IPublisherService publisherService)
        {
            _publisherService = publisherService;
        }

        // Ai cũng có thể xem danh sách nhà xuất bản
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _publisherService.GetAllCategoriesAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _publisherService.GetPublisherByIdAsync(id);
            if (result == null) return NotFound(new { message = "Không tìm thấy nhà xuất bản" });
            return Ok(result);
        }

        // Chỉ Admin mới được Thêm mới
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PublisherCreateDto dto)
        {
            try
            {
                var result = await _publisherService.CreatePublisherAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = result.PublisherId }, result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // Chỉ Admin mới được Sửa
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] PublisherUpdateDto dto)
        {
            try
            {
                var success = await _publisherService.UpdatePublisherAsync(id, dto);
                if (!success) return NotFound(new { message = "Không tìm thấy nhà xuất bản" });
                return Ok(new { message = "Cập nhật thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // Chỉ Admin mới được Xóa (ẩn đi)
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _publisherService.DeletePublisherAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy nhà xuất bản" });
            return Ok(new { message = "Đã xóa (ẩn) nhà xuất bản thành công!" });
        }

        // Khôi phục nhà xuất bản đã xóa (ẩn đi)
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/restore")]
        public async Task<IActionResult> Restore(int id)
        {
            var success = await _publisherService.RestorePublisherAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy nhà xuất bản" });
            return Ok(new { message = "Khôi phục thành công!" });
        }
    }
}
