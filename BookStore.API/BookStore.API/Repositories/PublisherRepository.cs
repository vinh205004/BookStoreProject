using BookStore.API.Data;
using BookStore.API.Models;
using Microsoft.EntityFrameworkCore;

namespace BookStore.API.Repositories
{
    public class PublisherRepository : IPublisherRepository
    {
        private readonly AppDbContext _context;
        public PublisherRepository(AppDbContext context) => _context = context;

        public async Task<IEnumerable<Publisher>> GetAllAsync()
        {
            return await _context.Publishers.ToListAsync();
        }

        public async Task<Publisher?> GetByIdAsync(string id)
        {
            return await _context.Publishers.FindAsync(id);
        }

        public async Task<Publisher?> GetByNameAsync(string name)
        {
            // Kiểm tra không phân biệt hoa thường
            return await _context.Publishers
                .FirstOrDefaultAsync(c => c.Name.ToLower() == name.ToLower());
        }

        public async Task AddAsync(Publisher Publisher)
        {
            await _context.Publishers.AddAsync(Publisher);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Publisher Publisher)
        {
            _context.Publishers.Update(Publisher);
            await _context.SaveChangesAsync();
        }
    }
}