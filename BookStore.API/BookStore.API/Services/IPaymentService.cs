using BookStore.API.DTOs;

namespace BookStore.API.Services
{
    public interface IPaymentService
    {
        Task<CreateVnpayPaymentResponseDto> CreateVnpayPaymentAsync(string userId, CreateVnpayPaymentDto dto, HttpContext httpContext);
        Task<string> HandleVnpayReturnAsync(IQueryCollection query);
    }
}
