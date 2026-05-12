using BookStore.API.DTOs;
using BookStore.API.Models;
using BookStore.API.Repositories;
using BookStore.API.Utilities;

namespace BookStore.API.Services
{
    public class CartService : ICartService
    {
        private readonly ICartRepository _cartRepository;
        private readonly IBookService _bookService;

        public CartService(ICartRepository cartRepository, IBookService bookService)
        {
            _cartRepository = cartRepository;
            _bookService = bookService;
        }

        /// <summary>
        /// Lấy giỏ hàng của người dùng và chuyển đổi thành CartDto
        /// </summary>
        public async Task<CartDto?> GetUserCartAsync(string userId)
        {
            var cart = await _cartRepository.GetUserCartAsync(userId);
            
            if (cart == null)
                return null;

            bool priceChanged = false;
            foreach (var item in cart.CartItems)
            {
                var bookDetail = await _bookService.GetBookDetailAsync(item.BookId);
                if (bookDetail != null)
                {
                    var currentPrice = bookDetail.DiscountedPrice ?? bookDetail.Price;
                    if (item.UnitPrice != currentPrice)
                    {
                        item.UnitPrice = currentPrice;
                        item.TotalPrice = currentPrice * item.Quantity;
                        priceChanged = true;
                    }
                }
            }

            if (priceChanged)
            {
                RecalculateCartTotals(cart);
                await _cartRepository.UpdateCartAsync(cart);
            }

            return MapCartToDto(cart);
        }

        /// <summary>
        /// Thêm sản phẩm vào giỏ hàng của người dùng hoặc tạo giỏ hàng mới nếu chưa có
        /// </summary>
        public async Task<CartDto> AddToCartAsync(string userId, string bookId, int quantity)
        {
            // Xác thực đầu vào
            if (string.IsNullOrEmpty(bookId))
                throw new ArgumentException("BookId là bắt buộc");

            if (quantity <= 0)
                throw new ArgumentException("Số lượng phải lớn hơn 0");

            // Xác thực sách tồn tại và lấy giá
            var book = await _bookService.GetBookDetailAsync(bookId);
            if (book == null)
                throw new ArgumentException($"Sách với ID {bookId} không tồn tại");

            if (book.Stock < quantity)
                throw new ArgumentException($"Chỉ còn {book.Stock} sản phẩm trong kho. Bạn yêu cầu {quantity}");

            // Lấy hoặc tạo giỏ hàng của người dùng
            var cart = await _cartRepository.GetUserCartAsync(userId);
            
            if (cart == null)
            {
                cart = new Cart
                {
                    CartId = IdGenerator.GenerateCartId(),
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                cart = await _cartRepository.CreateCartAsync(cart);
            }

            // Kiểm tra sản phẩm đã tồn tại trong giỏ hàng
            var existingItem = cart.CartItems.FirstOrDefault(ci => ci.BookId == bookId);
            
            if (existingItem != null)
            {
                // Cập nhật số lượng
                if (existingItem.Quantity + quantity > book.Stock)
                    throw new ArgumentException($"Chỉ còn {book.Stock} sản phẩm trong kho. Hiện có {existingItem.Quantity}, bạn thêm {quantity}");
                
                existingItem.Quantity += quantity;
                existingItem.UnitPrice = book.DiscountedPrice ?? book.Price;
                existingItem.TotalPrice = existingItem.Quantity * existingItem.UnitPrice;
            }
            else
            {
                // Thêm sản phẩm mới
                var cartItem = new CartItem
                {
                    CartItemId = IdGenerator.GenerateCartItemId(),
                    CartId = cart.CartId,
                    BookId = bookId,
                    Quantity = quantity,
                    UnitPrice = book.DiscountedPrice ?? book.Price,
                    TotalPrice = quantity * (book.DiscountedPrice ?? book.Price),
                    AddedAt = DateTime.UtcNow
                };
                cart.CartItems.Add(cartItem);
            }

            // Tính toán lại tổng
            RecalculateCartTotals(cart);
            
            // Cập nhật giỏ hàng trong cơ sở dữ liệu
            await _cartRepository.UpdateCartAsync(cart);
            
            return MapCartToDto(cart);
        }

        /// <summary>
        /// Xóa sản phẩm khỏi giỏ hàng
        /// </summary>
        public async Task<CartDto> RemoveFromCartAsync(string userId, string cartItemId)
        {
            // Xác thực đầu vào
            if (string.IsNullOrEmpty(cartItemId))
                throw new ArgumentException("CartItemId là bắt buộc");

            var cart = await _cartRepository.GetUserCartAsync(userId);
            if (cart == null)
                throw new InvalidOperationException("Giỏ hàng không tồn tại");

            // Xóa sản phẩm
            var item = cart.CartItems.FirstOrDefault(ci => ci.CartItemId == cartItemId);
            if (item == null)
                throw new ArgumentException("Sản phẩm không tồn tại trong giỏ hàng");

            await _cartRepository.DeleteCartItemAsync(item.CartItemId);
            cart.CartItems.Remove(item);

            // Tính toán lại tổng
            RecalculateCartTotals(cart);
            
            // Cập nhật giỏ hàng trong cơ sở dữ liệu
            await _cartRepository.UpdateCartAsync(cart);
            
            return MapCartToDto(cart);
        }

        /// <summary>
        /// Cập nhật số lượng của sản phẩm trong giỏ hàng
        /// </summary>
        public async Task<CartDto> UpdateCartItemQuantityAsync(string userId, string cartItemId, int quantity)
        {
            // Xác thực đầu vào
            if (string.IsNullOrEmpty(cartItemId))
                throw new ArgumentException("CartItemId là bắt buộc");

            if (quantity < 0)
                throw new ArgumentException("Số lượng không được âm");

            var cart = await _cartRepository.GetUserCartAsync(userId);
            if (cart == null)
                throw new InvalidOperationException("Giỏ hàng không tồn tại");

            var item = cart.CartItems.FirstOrDefault(ci => ci.CartItemId == cartItemId);
            if (item == null)
                throw new ArgumentException("Sản phẩm không tồn tại trong giỏ hàng");

            // Lấy sách để xác thực tồn kho
            var book = await _bookService.GetBookDetailAsync(item.BookId);
            if (book == null)
                throw new ArgumentException("Sách không tồn tại");

            if (quantity > book.Stock)
                throw new ArgumentException($"Chỉ còn {book.Stock} sản phẩm trong kho. Bạn yêu cầu {quantity}");

            if (quantity <= 0)
            {
                // Xóa sản phẩm nếu số lượng nhỏ hơn hoặc bằng 0
                await _cartRepository.DeleteCartItemAsync(item.CartItemId);
                cart.CartItems.Remove(item);
            }
            else
            {
                // Cập nhật số lượng và giá
                item.Quantity = quantity;
                item.UnitPrice = book.DiscountedPrice ?? book.Price;
                item.TotalPrice = quantity * item.UnitPrice;
            }

            // Tính toán lại tổng
            RecalculateCartTotals(cart);
            
            // Cập nhật giỏ hàng trong cơ sở dữ liệu
            await _cartRepository.UpdateCartAsync(cart);
            
            return MapCartToDto(cart);
        }

        /// <summary>
        /// Xóa tất cả sản phẩm khỏi giỏ hàng của người dùng
        /// </summary>
        public async Task<bool> ClearCartAsync(string userId)
        {
            var cart = await _cartRepository.GetUserCartAsync(userId);
            if (cart == null)
                return false;

            // Xóa từng sản phẩm
            foreach (var item in cart.CartItems.ToList())
            {
                await _cartRepository.DeleteCartItemAsync(item.CartItemId);
            }

            // Xóa danh sách và đặt lại tổng
            cart.CartItems.Clear();
            cart.TotalPrice = 0;
            cart.TotalQuantity = 0;

            // Cập nhật giỏ hàng trong cơ sở dữ liệu
            await _cartRepository.UpdateCartAsync(cart);
            
            return true;
        }

        // Các trợ giúp trong bộ nhớ (giữ lại để tương thích ngược)

        public CartDto AddToCart(CartDto currentCart, CartItemDto item)
        {
            var existingItem = currentCart.Items.FirstOrDefault(x => x.BookId == item.BookId);
            
            if (existingItem != null)
            {
                existingItem.Quantity += item.Quantity;
            }
            else
            {
                currentCart.Items.Add(item);
            }

            return RecalculateCart(currentCart);
        }

        public CartDto RemoveFromCart(CartDto currentCart, string bookId)
        {
            currentCart.Items.RemoveAll(x => x.BookId == bookId);
            return RecalculateCart(currentCart);
        }

        public CartDto UpdateCartItem(CartDto currentCart, string bookId, int quantity)
        {
            var item = currentCart.Items.FirstOrDefault(x => x.BookId == bookId);
            if (item != null)
            {
                if (quantity <= 0)
                {
                    currentCart.Items.Remove(item);
                }
                else
                {
                    item.Quantity = quantity;
                }
            }

            return RecalculateCart(currentCart);
        }

        public CartDto ClearCart(CartDto currentCart)
        {
            currentCart.Items.Clear();
            currentCart.TotalPrice = 0;
            currentCart.TotalItems = 0;
            return currentCart;
        }

        public CartDto RecalculateCart(CartDto currentCart)
        {
            currentCart.TotalPrice = currentCart.Items.Sum(x => x.Price * x.Quantity);
            currentCart.TotalItems = currentCart.Items.Sum(x => x.Quantity);
            return currentCart;
        }

        // Các phương thức trợ giúp 

        private CartDto MapCartToDto(Cart cart)
        {
            var items = new List<CartItemDto>();
            
            foreach (var ci in cart.CartItems)
            {
                var bookDetail = _bookService.GetBookDetailAsync(ci.BookId).Result;
                
                items.Add(new CartItemDto
                {
                    CartItemId = ci.CartItemId,
                    BookId = ci.BookId,
                    BookTitle = ci.Book?.Title ?? string.Empty,
                      Price = bookDetail?.Price ?? ci.UnitPrice,
                      Quantity = ci.Quantity,
                      ImageUrl = ci.Book?.BookImages?.FirstOrDefault()?.ImageUrl ?? string.Empty,
                      DiscountedPrice = bookDetail?.DiscountedPrice ?? ci.UnitPrice,
                    DiscountBadge = bookDetail?.DiscountBadge,
                    DiscountVoucherCode = bookDetail?.DiscountVoucherCode,
                    CategoryId = bookDetail?.CategoryId
                });
            }
            
            return new CartDto
            {
                Items = items,
                TotalPrice = cart.TotalPrice,
                TotalItems = cart.TotalQuantity
            };
        }

        private void RecalculateCartTotals(Cart cart)
        {
            cart.TotalPrice = cart.CartItems.Sum(ci => ci.TotalPrice);
            cart.TotalQuantity = cart.CartItems.Sum(ci => ci.Quantity);
            cart.UpdatedAt = DateTime.UtcNow;
        }
    }
}



