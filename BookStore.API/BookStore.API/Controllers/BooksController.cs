using BookStore.API.DTOs;
using BookStore.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookStore.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BooksController : ControllerBase
    {
        private readonly IBookService _bookService;

        public BooksController(IBookService bookService)
        {
            _bookService = bookService;
        }

        // GET: api/Books
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var books = await _bookService.GetAllBooksAsync();
            return Ok(books);
        }

        // GET: api/Books/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var book = await _bookService.GetBookByIdAsync(id);
            if (book == null) return NotFound(new { message = "Không tìm thấy sách" });
            return Ok(book);
        }

        // POST: api/Books (Chỉ Admin)
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] BookCreateDto dto)
        {
            try
            {
                var result = await _bookService.CreateBookAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = result.BookId }, result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // PUT: api/Books/5 (Chỉ Admin)
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] BookUpdateDto dto)
        {
            try
            {
                var success = await _bookService.UpdateBookAsync(id, dto);
                if (!success) return NotFound(new { message = "Không tìm thấy sách để cập nhật" });
                return Ok(new { message = "Cập nhật sách thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // DELETE: api/Books/5 (Chỉ Admin)
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _bookService.DeleteBookAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy sách để xóa" });
            return Ok(new { message = "Đã ẩn sách thành công!" });
        }
        // PUT: api/Books/5/restore (Chỉ Admin)
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/restore")]
        public async Task<IActionResult> Restore(int id)
        {
            var success = await _bookService.RestoreBookAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy sách" });
            return Ok(new { message = "Đã khôi phục sách thành công!" });
        }
    }
}