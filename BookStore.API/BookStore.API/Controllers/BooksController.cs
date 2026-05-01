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

        // GET: api/Books/search?searchQuery=&categoryId=&authorId=&publisherId=&targetAudience=&minPrice=&maxPrice=
        [HttpGet("search")]
        public async Task<IActionResult> Search(
            [FromQuery] string? searchQuery = null,
            [FromQuery] string? categoryId = null,
            [FromQuery] string? authorId = null,
            [FromQuery] string? publisherId = null,
            [FromQuery] string? targetAudience = null,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null,
            [FromQuery] bool? discount = null)
        {
            try
            {
                var products = await _bookService.SearchBooksAsync(searchQuery, categoryId, authorId, publisherId, targetAudience, minPrice, maxPrice, discount);
                return Ok(products);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET: api/Books/target-audiences
        [HttpGet("target-audiences")]
        public async Task<IActionResult> GetTargetAudiences()
        {
            try
            {
                var audiences = await _bookService.GetDistinctTargetAudiencesAsync();
                return Ok(audiences);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET: api/Books/featured?count=10
        [HttpGet("featured")]
        public async Task<IActionResult> GetFeaturedBooks([FromQuery] int count = 10)
        {
            try
            {
                var products = await _bookService.GetFeaturedBooksAsync(count);
                return Ok(products);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET: api/Books/discounted
        [HttpGet("discounted")]
        public async Task<IActionResult> GetDiscountedBooks([FromQuery] int count = 0)
        {
            try
            {
                // If count is 0 or not specified, get all discounted books
                var products = await _bookService.GetDiscountedBooksAsync(count == 0 ? int.MaxValue : count);
                return Ok(products);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET: api/Books/category/{categoryId}
        [HttpGet("category/{categoryId}")]
        public async Task<IActionResult> GetBooksByCategory(string categoryId)
        {
            try
            {
                var products = await _bookService.GetBooksByCategoryAsync(categoryId);
                return Ok(products);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET: api/Books/5 (Admin - returns full BookDto)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var book = await _bookService.GetBookByIdAsync(id);
            if (book == null) return NotFound(new { message = "Không tìm thấy sách" });
            return Ok(book);
        }

        // GET: api/Books/{id}/detail (Customer - returns ProductDetailDto)
        [HttpGet("{id}/detail")]
        public async Task<IActionResult> GetBookDetail(string id)
        {
            try
            {
                var product = await _bookService.GetBookDetailAsync(id);
                if (product == null)
                    return NotFound(new { message = "Sản phẩm không tồn tại" });

                return Ok(product);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
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
        public async Task<IActionResult> Update(string id, [FromBody] BookUpdateDto dto)
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
        public async Task<IActionResult> Delete(string id)
        {
            var success = await _bookService.DeleteBookAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy sách để xóa" });
            return Ok(new { message = "Xóa sách thành công!" });
        }
        // PUT: api/Books/5/restore (Chỉ Admin)
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/restore")]
        public async Task<IActionResult> Restore(string id)
        {
            var success = await _bookService.RestoreBookAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy sách" });
            return Ok(new { message = "Khôi phục sách thành công!" });
        }
    
        [HttpGet("top-selling")]
        public async Task<IActionResult> GetTopSelling(int? month, int? year, [FromQuery] int count = 10)
        {
            var result = await _bookService.GetTopSellingBooksAsync(month, year, count);
            return Ok(result);
        }

        [HttpGet("top-rated")]
        public async Task<IActionResult> GetTopRated([FromQuery] int count = 10)
        {
            var result = await _bookService.GetTopRatedBooksAsync(count);
            return Ok(result);
        }
    }
}
