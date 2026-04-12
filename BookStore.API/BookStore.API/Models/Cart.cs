namespace BookStore.API.Models
{
    public class Cart
    {
        public string CartId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public User? User { get; set; }
        public List<CartItem> CartItems { get; set; } = new();
        public decimal TotalPrice { get; set; }
        public int TotalQuantity { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class CartItem
    {
        public string CartItemId { get; set; } = string.Empty;
        public string CartId { get; set; } = string.Empty;
        public Cart? Cart { get; set; }
        public string BookId { get; set; } = string.Empty;
        public Book? Book { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    }
}
