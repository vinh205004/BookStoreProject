using System;

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

        public static string GenerateCategoryId() => $"C{++_categoryCounter:000}";
        public static string GenerateAuthorId() => $"A{++_authorCounter:000}";
        public static string GeneratePublisherId() => $"N{++_publisherCounter:000}";
        public static string GenerateBookId() => $"S{++_bookCounter:000}";
        public static string GenerateVoucherId() => $"V{++_voucherCounter:000}";
        public static string GenerateOrderId() => $"O{++_orderCounter:000}";
        public static string GenerateUserId() => $"U{++_userCounter:000}";
        public static string GenerateImageId() => $"I{++_imageCounter:000}";
    }
}
