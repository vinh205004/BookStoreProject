using BookStore.API.DTOs;
using BookStore.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BookStore.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;

        public CartController(ICartService cartService)
        {
            _cartService = cartService;
        }

        private string GetUserId()
        {
            return User.FindFirst("UserId")?.Value 
                ?? throw new UnauthorizedAccessException("Không xác định được người dùng");
        }

        /// <summary>
        /// Lấy giỏ hàng hiện tại của người dùng
        /// GET /api/cart
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            try
            {
                var userId = GetUserId();
                var cart = await _cartService.GetUserCartAsync(userId);
                
                if (cart == null)
                {
                    return Ok(new CartDto { Items = new List<CartItemDto>(), TotalPrice = 0, TotalItems = 0 });
                }

                return Ok(cart);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { error = "Không xác định được người dùng" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Thêm sản phẩm vào giỏ hàng
        /// POST /api/cart/items
        /// </summary>
        [HttpPost("items")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartDto dto)
        {
            try
            {
                var userId = GetUserId();
                var cart = await _cartService.AddToCartAsync(userId, dto.BookId, dto.Quantity);
                return Ok(cart);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { error = "Không xác định được người dùng" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Cập nhật số lượng sản phẩm trong giỏ hàng
        /// PUT /api/cart/items/{cartItemId}
        /// </summary>
        [HttpPut("items/{cartItemId}")]
        public async Task<IActionResult> UpdateCartItem(string cartItemId, [FromBody] UpdateCartItemDto dto)
        {
            try
            {
                var userId = GetUserId();
                var cart = await _cartService.UpdateCartItemQuantityAsync(userId, cartItemId, dto.Quantity);
                return Ok(cart);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { error = "Không xác định được người dùng" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Xóa sản phẩm khỏi giỏ hàng
        /// DELETE /api/cart/items/{cartItemId}
        /// </summary>
        [HttpDelete("items/{cartItemId}")]
        public async Task<IActionResult> RemoveFromCart(string cartItemId)
        {
            try
            {
                var userId = GetUserId();
                var cart = await _cartService.RemoveFromCartAsync(userId, cartItemId);
                return Ok(cart);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { error = "Không xác định được người dùng" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Xóa toàn bộ giỏ hàng
        /// DELETE /api/cart
        /// </summary>
        [HttpDelete]
        public async Task<IActionResult> ClearCart()
        {
            try
            {
                var userId = GetUserId();
                var success = await _cartService.ClearCartAsync(userId);
                
                if (!success)
                    return BadRequest(new { error = "Không thể xóa giỏ hàng" });

                return Ok(new { message = "Giỏ hàng đã được xóa", success = true });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { error = "Không xác định được người dùng" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}
