using BookStore.API.DTOs;
using BookStore.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookStore.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthorsController : ControllerBase
    {
        private readonly IAuthorService _authorService;

        public AuthorsController(IAuthorService authorService)
        {
            _authorService = authorService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var authors = await _authorService.GetAllAuthorsAsync();
            return Ok(authors);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var author = await _authorService.GetAuthorByIdAsync(id);
            if (author == null) return NotFound(new { message = "Không tìm thấy tác giả" });
            return Ok(author);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AuthorCreateDto dto)
        {
            try
            {
                var result = await _authorService.CreateAuthorAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = result.AuthorId }, result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] AuthorUpdateDto dto)
        {
            try
            {
                var success = await _authorService.UpdateAuthorAsync(id, dto);
                if (!success) return NotFound(new { message = "Không tìm thấy tác giả" });
                return Ok(new { message = "Cập nhật thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var success = await _authorService.DeleteAuthorAsync(id);
                if (!success) return NotFound(new { message = "Không tìm thấy tác giả" });
                return Ok(new { message = "Đã xóa tác giả thành công!" });
            }
            catch (Exception ex)
            {
                // Hứng lỗi nếu tác giả đang có sách
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}