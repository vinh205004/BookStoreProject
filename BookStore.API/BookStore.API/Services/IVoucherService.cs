using BookStore.API.DTOs;

namespace BookStore.API.Services
{
    public interface IVoucherService
    {
        Task<IEnumerable<VoucherDto>> GetAllVouchersAsync();
        Task<VoucherDto?> GetVoucherByIdAsync(string id);
        Task<VoucherDto> CreateVoucherAsync(VoucherCreateDto dto);
        Task<bool> UpdateVoucherAsync(string id, VoucherUpdateDto dto);
        Task<bool> DeleteVoucherAsync(string id); // Xóa mềm
    }
}