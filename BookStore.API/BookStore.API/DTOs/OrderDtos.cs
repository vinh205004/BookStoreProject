using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace BookStore.API.DTOs
{
    public class OrderItemDto
    {
        public int OrderItemId { get; set; }
        public int BookId { get; set; }
        public string BookTitle { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    public class OrderDto
    {
        public int OrderId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string ShippingAddress { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Note { get; set; } = string.Empty;

        public List<OrderItemDto> Items { get; set; } = new List<OrderItemDto>();
    }

    public class OrderUpdateStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;
    }
}