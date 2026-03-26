using BookStore.API.DTOs;

namespace BookStore.API.Services
{
    public interface IVoucherService
    {
        Task<IEnumerable<VoucherDto>> GetAllVouchersAsync();
        Task<VoucherDto?> GetVoucherByIdAsync(int id);
        Task<VoucherDto> CreateVoucherAsync(VoucherCreateDto dto);
        Task<bool> UpdateVoucherAsync(int id, VoucherUpdateDto dto);
        Task<bool> DeleteVoucherAsync(int id); // Xóa mềm (Tắt voucher)
    }
}