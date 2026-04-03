using BookStore.API.DTOs;
using BookStore.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BookStore.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")] // chỉ Admin được vào
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _userService.GetAllUsersAsync();
            return Ok(users);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null) return NotFound(new { message = "Không tìm thấy người dùng" });
            return Ok(user);
        }

        // Endpoint để Khóa / Mở khóa
        [HttpPut("{id}/toggle-lock")]
        public async Task<IActionResult> ToggleLock(string id)
        {
            // Lấy ID của user hiện tại từ JWT token
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null)
                return Unauthorized(new { message = "Không thể xác định user hiện tại" });

            try
            {
                var success = await _userService.ToggleLockUserAsync(id, userIdClaim.Value);
                if (!success) return NotFound(new { message = "Không tìm thấy người dùng" });
                return Ok(new { message = "Đã cập nhật trạng thái khóa tài khoản!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // Endpoint để thay đổi quyền
        [HttpPut("{id}/role")]
        public async Task<IActionResult> ChangeRole(string id, [FromBody] UserRoleUpdateDto dto)
        {
            // Lấy ID của user hiện tại từ JWT token
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null)
                return Unauthorized(new { message = "Không thể xác định user hiện tại" });

            try
            {
                var success = await _userService.ChangeUserRoleAsync(id, dto, userIdClaim.Value);
                if (!success) return NotFound(new { message = "Không tìm thấy người dùng" });
                return Ok(new { message = "Cập nhật quyền thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}