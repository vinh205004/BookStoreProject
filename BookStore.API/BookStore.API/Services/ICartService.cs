using BookStore.API.DTOs;
using BookStore.API.Models;

namespace BookStore.API.Services
{
    public interface ICartService
    {
        Task<CartDto?> GetUserCartAsync(string userId);
        Task<CartDto> AddToCartAsync(string userId, string bookId, int quantity);
        Task<CartDto> RemoveFromCartAsync(string userId, string cartItemId);
        Task<CartDto> UpdateCartItemQuantityAsync(string userId, string cartItemId, int quantity);
        Task<bool> ClearCartAsync(string userId);
       
        CartDto AddToCart(CartDto currentCart, CartItemDto item);
        CartDto RemoveFromCart(CartDto currentCart, string bookId);
        CartDto UpdateCartItem(CartDto currentCart, string bookId, int quantity);
        CartDto ClearCart(CartDto currentCart);
        CartDto RecalculateCart(CartDto currentCart);
    }
}
