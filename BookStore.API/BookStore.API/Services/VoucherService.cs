using BookStore.API.DTOs;
using BookStore.API.Models;
using BookStore.API.Repositories;

namespace BookStore.API.Services
{
    public class VoucherService : IVoucherService
    {
        private readonly IVoucherRepository _repo;

        public VoucherService(IVoucherRepository repo) => _repo = repo;

        public async Task<IEnumerable<VoucherDto>> GetAllVouchersAsync()
        {
            var vouchers = await _repo.GetAllAsync();
            return vouchers.Select(v => new VoucherDto
            {
                VoucherId = v.VoucherId,
                Code = v.Code,
                DiscountType = v.DiscountType,
                DiscountAmount = v.DiscountAmount,
                MinOrderValue = v.MinOrderValue,
                Quantity = v.Quantity,
                UsedCount = v.UsedCount,
                ExpirationDate = v.ExpirationDate,
                IsActive = v.IsActive
            });
        }

        public async Task<VoucherDto?> GetVoucherByIdAsync(int id)
        {
            var v = await _repo.GetByIdAsync(id);
            if (v == null) return null;

            return new VoucherDto
            {
                VoucherId = v.VoucherId,
                Code = v.Code,
                DiscountType = v.DiscountType,
                DiscountAmount = v.DiscountAmount,
                MinOrderValue = v.MinOrderValue,
                Quantity = v.Quantity,
                UsedCount = v.UsedCount,
                ExpirationDate = v.ExpirationDate,
                IsActive = v.IsActive
            };
        }

        public async Task<VoucherDto> CreateVoucherAsync(VoucherCreateDto dto)
        {
            // 1. Kiểm tra ngày hết hạn hợp lệ
            if (dto.ExpirationDate <= DateTime.UtcNow)
                throw new Exception("Ngày hết hạn phải lớn hơn ngày hiện tại!");

            // 2. Kiểm tra mã Code đã tồn tại chưa
            var existing = await _repo.GetByCodeAsync(dto.Code);
            if (existing != null)
                throw new Exception("Mã Voucher này đã tồn tại trong hệ thống!");

            var newVoucher = new Voucher
            {
                Code = dto.Code.ToUpper(), // Chuẩn hóa mã viết hoa
                DiscountType = dto.DiscountType,
                DiscountAmount = dto.DiscountAmount,
                MinOrderValue = dto.MinOrderValue,
                Quantity = dto.Quantity,
                UsedCount = 0, // Mặc định 0 khi tạo mới
                ExpirationDate = dto.ExpirationDate,
                IsActive = true // Mặc định tạo ra là hoạt động
            };

            await _repo.AddAsync(newVoucher);

            return new VoucherDto
            {
                VoucherId = newVoucher.VoucherId,
                Code = newVoucher.Code,
                DiscountType = newVoucher.DiscountType,
                DiscountAmount = newVoucher.DiscountAmount,
                MinOrderValue = newVoucher.MinOrderValue,
                Quantity = newVoucher.Quantity,
                UsedCount = newVoucher.UsedCount,
                ExpirationDate = newVoucher.ExpirationDate.ToUniversalTime(),
                IsActive = newVoucher.IsActive
            };
        }

        public async Task<bool> UpdateVoucherAsync(int id, VoucherUpdateDto dto)
        {
            var voucher = await _repo.GetByIdAsync(id);
            if (voucher == null) return false;

            if (dto.ExpirationDate <= DateTime.UtcNow && dto.IsActive)
                throw new Exception("Ngày hết hạn phải lớn hơn ngày hiện tại!");

            var existing = await _repo.GetByCodeAsync(dto.Code);
            if (existing != null && existing.VoucherId != id)
                throw new Exception("Mã Voucher này đã được sử dụng cho chương trình khác!");

            voucher.Code = dto.Code.ToUpper();
            voucher.DiscountType = dto.DiscountType;
            voucher.DiscountAmount = dto.DiscountAmount;
            voucher.MinOrderValue = dto.MinOrderValue;
            voucher.Quantity = dto.Quantity;
            voucher.ExpirationDate = dto.ExpirationDate.ToUniversalTime();
            voucher.IsActive = dto.IsActive;

            await _repo.UpdateAsync(voucher);
            return true;
        }

        public async Task<bool> DeleteVoucherAsync(int id)
        {
            var voucher = await _repo.GetByIdAsync(id);
            if (voucher == null) return false;

            voucher.IsActive = false;
            await _repo.UpdateAsync(voucher);
            return true;
        }
    }
}