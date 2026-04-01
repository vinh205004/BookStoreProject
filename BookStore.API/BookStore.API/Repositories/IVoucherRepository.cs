using BookStore.API.Models;

namespace BookStore.API.Repositories
{
    public interface IVoucherRepository
    {
        Task<IEnumerable<Voucher>> GetAllAsync();
        Task<Voucher?> GetByIdAsync(int id);
        Task<Voucher?> GetByCodeAsync(string code);
        Task AddAsync(Voucher voucher);
        Task UpdateAsync(Voucher voucher);
    }
}