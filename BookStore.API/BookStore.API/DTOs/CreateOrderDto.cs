namespace BookStore.API.DTOs
{
    public class CreateOrderDto
    {
        public string ShippingAddress { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Note { get; set; }
        public List<OrderItemInputDto> Items { get; set; } = new List<OrderItemInputDto>();
        public string? VoucherCode { get; set; }
    }

    public class OrderItemInputDto
    {
        public string BookId { get; set; } = string.Empty;
        public int Quantity { get; set; }
    }

    public class UserOrderDetailDto
    {
        public string OrderId { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public string? AppliedVoucherCode { get; set; }
        public string ShippingAddress { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Note { get; set; }
        public List<UserOrderItemDto> Items { get; set; } = new List<UserOrderItemDto>();
    }

    public class UserOrderItemDto
    {
        public string BookId { get; set; } = string.Empty;
        public string BookTitle { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal? OriginalPrice { get; set; }
        public string? HardcodedVoucherCode { get; set; }
    }
}
