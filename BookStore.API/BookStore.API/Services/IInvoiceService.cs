namespace BookStore.API.Services
{
    public interface IInvoiceService
    {
        Task<InvoicePdfResult?> GenerateAdminInvoiceAsync(string orderId);
        Task<InvoicePdfResult?> GenerateUserInvoiceAsync(string userId, string orderId);
    }

    public class InvoicePdfResult
    {
        public required byte[] Content { get; init; }
        public required string FileName { get; init; }
    }
}
