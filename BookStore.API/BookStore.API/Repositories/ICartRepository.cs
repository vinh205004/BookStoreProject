using BookStore.API.Models;

namespace BookStore.API.Repositories
{
    public interface ICartRepository
    {
        Task<Cart?> GetUserCartAsync(string userId);
        Task<Cart> CreateCartAsync(Cart cart);
        Task<Cart?> UpdateCartAsync(Cart cart);
        Task<bool> DeleteCartAsync(string cartId);
        Task<bool> DeleteCartItemAsync(string cartItemId);
        Task<CartItem?> GetCartItemAsync(string cartItemId);
        Task<IEnumerable<CartItem>> GetCartItemsAsync(string cartId);
    }
}
