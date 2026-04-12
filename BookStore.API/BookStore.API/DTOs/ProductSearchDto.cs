namespace BookStore.API.DTOs
{
    public class ProductSearchDto
    {
        public string BookId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string CategoryId { get; set; } = string.Empty;
        public string PublisherName { get; set; } = string.Empty;
        public string TargetAudience { get; set; } = string.Empty;
        public int? PageCount { get; set; }
        public string? MainImageUrl { get; set; }
        public double? Rating { get; set; }
        public bool HasDiscount { get; set; }
        public decimal? DiscountedPrice { get; set; }
        public string? DiscountBadge { get; set; }
        public string? DiscountVoucherCode { get; set; }
    }

    public class ProductDetailDto
    {
        public string BookId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string AuthorId { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string CategoryId { get; set; } = string.Empty;
        public string PublisherName { get; set; } = string.Empty;
        public string PublisherId { get; set; } = string.Empty;
        public string TargetAudience { get; set; } = string.Empty;
        public decimal? Length { get; set; }
        public decimal? Width { get; set; }
        public string? LengthUnit { get; set; }
        public int? PageCount { get; set; }
        public List<string> ImageUrls { get; set; } = new List<string>();
        public double? Rating { get; set; }
        public decimal? DiscountedPrice { get; set; }
        public string? DiscountBadge { get; set; }
        public string? DiscountVoucherCode { get; set; }
    }
}
