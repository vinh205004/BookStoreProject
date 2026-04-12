using System;
using System.Linq;
using Microsoft.Extensions.DependencyInjection;

namespace BookStore.API.Utilities
{
    public static class IdGenerator
    {
        private static int _categoryCounter = 0;
        private static int _authorCounter = 0;
        private static int _publisherCounter = 0;
        private static int _bookCounter = 0;
        private static int _voucherCounter = 0;
        private static int _orderCounter = 0;
        private static int _userCounter = 0;
        private static int _imageCounter = 0;
        private static int _cartCounter = 0;
        private static int _cartItemCounter = 0;
        private static int _orderItemCounter = 0;

        public static string GenerateCategoryId() => $"C{++_categoryCounter:000}";
        public static string GenerateAuthorId() => $"A{++_authorCounter:000}";
        public static string GeneratePublisherId() => $"N{++_publisherCounter:000}";
        public static string GenerateBookId() => $"S{++_bookCounter:000}";
        public static string GenerateVoucherId() => $"V{++_voucherCounter:000}";
        public static string GenerateOrderId() => $"O{++_orderCounter:000}";
        public static string GenerateUserId() => $"U{++_userCounter:000}";
        public static string GenerateImageId() => $"I{++_imageCounter:000}";
        public static string GenerateCartId() => $"CT{++_cartCounter:000}";
        public static string GenerateCartItemId() => $"CI{++_cartItemCounter:000}";
        public static string GenerateOrderItemId() => $"OI{++_orderItemCounter:000}";

        public static void Initialize(System.IServiceProvider serviceProvider)
        {
            using (var scope = serviceProvider.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<BookStore.API.Data.AppDbContext>();
                
                _categoryCounter = GetMaxCounter(context.Categories.Select(x => x.CategoryId).ToList(), "C");
                _authorCounter = GetMaxCounter(context.Authors.Select(x => x.AuthorId).ToList(), "A");
                _publisherCounter = GetMaxCounter(context.Publishers.Select(x => x.PublisherId).ToList(), "N");
                _bookCounter = GetMaxCounter(context.Books.Select(x => x.BookId).ToList(), "S");
                _voucherCounter = GetMaxCounter(context.Vouchers.Select(x => x.VoucherId).ToList(), "V");
                _orderCounter = GetMaxCounter(context.Orders.Select(x => x.OrderId).ToList(), "O");
                _userCounter = GetMaxCounter(context.Users.Select(x => x.UserId).ToList(), "U");
                _imageCounter = GetMaxCounter(context.BookImages.Select(x => x.ImageId).ToList(), "I");
                _cartCounter = GetMaxCounter(context.Carts.Select(x => x.CartId).ToList(), "CT");
                _cartItemCounter = GetMaxCounter(context.CartItems.Select(x => x.CartItemId).ToList(), "CI");
                _orderItemCounter = GetMaxCounter(context.OrderItems.Select(x => x.OrderItemId).ToList(), "OI");
            }
        }

        private static int GetMaxCounter(System.Collections.Generic.List<string> ids, string prefix)
        {
            if (ids == null || ids.Count == 0) return 0;
            
            int max = 0;
            foreach (var id in ids)
            {
                if (id != null && id.StartsWith(prefix) && id.Length > prefix.Length)
                {
                    if (int.TryParse(id.Substring(prefix.Length), out int num))
                    {
                        if (num > max) max = num;
                    }
                }
            }
            return max;
        }
    }
}
