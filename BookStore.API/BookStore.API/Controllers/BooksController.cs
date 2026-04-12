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
            [FromQuery] decimal? maxPrice = null)
        {
            try
            {
                var products = await _bookService.SearchBooksAsync(searchQuery, categoryId, authorId, publisherId, targetAudience, minPrice, maxPrice);
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

        // GET: api/Books/discounted?count=10
        [HttpGet("discounted")]
        public async Task<IActionResult> GetDiscountedBooks([FromQuery] int count = 10)
        {
            try
            {
                var products = await _bookService.GetDiscountedBooksAsync(count);
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
            if (book == null) return NotFound(new { message = "Kh�ng t�m th?y s�ch" });
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
                    return NotFound(new { message = "S?n ph?m kh�ng t?n t?i" });

                return Ok(product);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // POST: api/Books (Ch? Admin)
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

        // PUT: api/Books/5 (Ch? Admin)
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] BookUpdateDto dto)
        {
            try
            {
                var success = await _bookService.UpdateBookAsync(id, dto);
                if (!success) return NotFound(new { message = "Kh�ng t�m th?y s�ch d? c?p nh?t" });
                return Ok(new { message = "C?p nh?t s�ch th�nh c�ng!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // DELETE: api/Books/5 (Ch? Admin)
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var success = await _bookService.DeleteBookAsync(id);
            if (!success) return NotFound(new { message = "Kh�ng t�m th?y s�ch d? x�a" });
            return Ok(new { message = "�� ?n s�ch th�nh c�ng!" });
        }
        // PUT: api/Books/5/restore (Ch? Admin)
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/restore")]
        public async Task<IActionResult> Restore(string id)
        {
            var success = await _bookService.RestoreBookAsync(id);
            if (!success) return NotFound(new { message = "Kh�ng t�m th?y s�ch" });
            return Ok(new { message = "�� kh�i ph?c s�ch th�nh c�ng!" });
        }
    
        [HttpGet("top-selling")]
        public async Task<IActionResult> GetTopSelling(int? month, int? year, [FromQuery] int count = 10)
        {
            var targetMonth = month ?? DateTime.Now.Month;
            var targetYear = year ?? DateTime.Now.Year;
            var result = await _bookService.GetTopSellingBooksAsync(targetMonth, targetYear, count);
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
