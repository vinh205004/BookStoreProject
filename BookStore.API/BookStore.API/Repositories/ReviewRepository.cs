using BookStore.API.Data;
using BookStore.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BookStore.API.Repositories
{
    public class ReviewRepository : IReviewRepository
    {
        private readonly AppDbContext _context;

        public ReviewRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Review>> GetReviewsByBookIdAsync(string bookId)
        {
            return await _context.Reviews
                .Include(r => r.User)
                .Include(r => r.Replies)
                    .ThenInclude(reply => reply.User)
                .Where(r => r.BookId == bookId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<Review?> GetReviewByIdAsync(string id)
        {
            return await _context.Reviews
                .Include(r => r.User)
                .Include(r => r.Replies)
                    .ThenInclude(reply => reply.User)
                .FirstOrDefaultAsync(r => r.ReviewId == id);
        }

        public async Task<Review> AddReviewAsync(Review review)
        {
            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();
            return review;
        }

        public async Task UpdateReviewAsync(Review review)
        {
            _context.Entry(review).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }

        public async Task DeleteReviewAsync(Review review)
        {
            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> ReviewExistsAsync(string bookId, string userId)
        {
            return await _context.Reviews.AnyAsync(r => r.BookId == bookId && r.UserId == userId);
        }

        public async Task<bool> HasUserPurchasedBookAsync(string bookId, string userId)
        {
            // Kiểm tra xem user có đơn hàng nào không bị hủy/pending và chứa sản phẩm này
            return await _context.Orders.AnyAsync(o => 
                o.UserId == userId && 
                (o.Status == "Delivered" || o.Status == "Processing" || o.Status == "Shipped") && 
                o.OrderItems.Any(oi => oi.BookId == bookId));
        }
    }
}
