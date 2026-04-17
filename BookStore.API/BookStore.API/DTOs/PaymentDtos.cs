using BookStore.API.DTOs;

namespace BookStore.API.DTOs
{
    public class CreateVnpayPaymentDto
    {
        public CreateOrderDto Order { get; set; } = new();
    }

    public class CreateVnpayPaymentResponseDto
    {
        public string OrderId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string PaymentUrl { get; set; } = string.Empty;
    }
}
