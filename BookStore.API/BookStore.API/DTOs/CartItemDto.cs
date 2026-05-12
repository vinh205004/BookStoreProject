using System.Text.Json.Serialization;

namespace BookStore.API.DTOs
{
    public class CartItemDto
    {
        public string? CartItemId { get; set; }
        public string BookId { get; set; } = string.Empty;
        public string BookTitle { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public decimal? DiscountedPrice { get; set; } 
        public string? DiscountBadge { get; set; } 
        public string? DiscountVoucherCode { get; set; }
        public string? CategoryId { get; set; } 
    }

    public class CartDto
    {
        public List<CartItemDto> Items { get; set; } = new List<CartItemDto>();
        public decimal TotalPrice { get; set; }
        public int TotalItems { get; set; }
    }

    public class AddToCartDto
    {
        [System.Text.Json.Serialization.JsonPropertyName("bookId")]
        public string BookId { get; set; } = string.Empty;
        
        [System.Text.Json.Serialization.JsonPropertyName("quantity")]
        public int Quantity { get; set; } = 1;
    }

    public class UpdateCartItemDto
    {
        [System.Text.Json.Serialization.JsonPropertyName("quantity")]
        public int Quantity { get; set; }
    }
}
