using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Data;

namespace BookStore.API.Utilities
{
    public static class IdGenerator
    {
        private static IServiceProvider? _serviceProvider;

        public static string GenerateCategoryId() => GenerateSequenceBackedId("category_id_seq", "C");
        public static string GenerateAuthorId() => GenerateSequenceBackedId("author_id_seq", "A");
        public static string GeneratePublisherId() => GenerateSequenceBackedId("publisher_id_seq", "N");
        public static string GenerateBannerId() => GenerateSequenceBackedId("banner_id_seq", "BA");
        public static string GenerateBookId() => GenerateSequenceBackedId("book_id_seq", "B");
        public static string GenerateUserId() => GenerateSequenceBackedId("user_id_seq", "U");
        public static string GenerateOrderId() => GenerateSequenceBackedId("order_id_seq", "O");
        public static string GenerateImageId() => GenerateSequenceBackedId("image_id_seq", "I");
        public static string GenerateCartId() => GenerateSequenceBackedId("cart_id_seq", "CT");
        public static string GenerateCartItemId() => GenerateSequenceBackedId("cart_item_id_seq", "CI");
        public static string GenerateOrderItemId() => GenerateSequenceBackedId("order_item_id_seq", "OI");
        public static string GenerateReviewId() => GenerateSequenceBackedId("review_id_seq", "R");
        public static string GenerateReviewReplyId() => GenerateSequenceBackedId("review_reply_id_seq", "RR");
        public static string GenerateVoucherId() => GenerateSequenceBackedId("voucher_id_seq", "V");

        public static void Initialize(System.IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        private static string GenerateSequenceBackedId(string sequenceName, string prefix)
        {
            if (_serviceProvider == null)
            {
                throw new InvalidOperationException("IdGenerator chưa được khởi tạo với IServiceProvider.");
            }

            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<BookStore.API.Data.AppDbContext>();
            var connection = context.Database.GetDbConnection();
            var shouldClose = connection.State != ConnectionState.Open;
            if (shouldClose)
            {
                connection.Open();
            }

            try
            {
                using var command = connection.CreateCommand();
                command.CommandText = $"SELECT nextval('{sequenceName}')::int";
                var result = command.ExecuteScalar();
                var nextValue = Convert.ToInt32(result);
                return $"{prefix}{nextValue:000}";
            }
            finally
            {
                if (shouldClose)
                {
                    connection.Close();
                }
            }
        }
    }
}
