using BookStore.API.Data;
using BookStore.API.Models;
using Microsoft.EntityFrameworkCore;

namespace BookStore.API.Repositories
{
    public class CartRepository : ICartRepository
    {
        private readonly AppDbContext _context;

        public CartRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Cart?> GetUserCartAsync(string userId)
        {
            return await _context.Carts
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Book)
                        .ThenInclude(b => b!.BookImages)
                .FirstOrDefaultAsync(c => c.UserId == userId);
        }

        public async Task<Cart> CreateCartAsync(Cart cart)
        {
            _context.Carts.Add(cart);
            await _context.SaveChangesAsync();
            return cart;
        }

        public async Task<Cart?> UpdateCartAsync(Cart cart)
        {
            var existingCart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.CartId == cart.CartId);

            if (existingCart == null)
                return null;

            existingCart.TotalPrice = cart.TotalPrice;
            existingCart.TotalQuantity = cart.TotalQuantity;
            existingCart.UpdatedAt = DateTime.UtcNow;

            _context.Carts.Update(existingCart); 
            await _context.SaveChangesAsync();

            return existingCart;
        }

        public async Task<bool> DeleteCartAsync(string cartId)
        {
            var cart = await _context.Carts.FirstOrDefaultAsync(c => c.CartId == cartId);
            if (cart == null)
                return false;

            _context.Carts.Remove(cart);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteCartItemAsync(string cartItemId)
        {
            var cartItem = await _context.CartItems.FirstOrDefaultAsync(ci => ci.CartItemId == cartItemId);
            if (cartItem == null)
                return false;

            _context.CartItems.Remove(cartItem);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<CartItem?> GetCartItemAsync(string cartItemId)
        {
            return await _context.CartItems
                .Include(ci => ci.Book)
                .FirstOrDefaultAsync(ci => ci.CartItemId == cartItemId);
        }

        public async Task<IEnumerable<CartItem>> GetCartItemsAsync(string cartId)
        {
            return await _context.CartItems
                .Where(ci => ci.CartId == cartId)
                .Include(ci => ci.Book)
                .ToListAsync();
        }
    }
}
