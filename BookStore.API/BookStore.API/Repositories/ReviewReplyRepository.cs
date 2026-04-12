using BookStore.API.Data;
using BookStore.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace BookStore.API.Repositories
{
    public class ReviewReplyRepository : IReviewReplyRepository
    {
        private readonly AppDbContext _context;

        public ReviewReplyRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ReviewReply> AddReplyAsync(ReviewReply reply)
        {
            _context.ReviewReplies.Add(reply);
            await _context.SaveChangesAsync();
            return reply;
        }

        public async Task<ReviewReply?> GetReplyByIdAsync(string replyId)
        {
            return await _context.ReviewReplies
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.ReplyId == replyId);
        }

        public async Task UpdateReplyAsync(ReviewReply reply)
        {
            _context.ReviewReplies.Update(reply);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteReplyAsync(ReviewReply reply)
        {
            _context.ReviewReplies.Remove(reply);
            await _context.SaveChangesAsync();
        }
    }
}
