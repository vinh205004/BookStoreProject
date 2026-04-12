using BookStore.API.Models;
using System.Threading.Tasks;

namespace BookStore.API.Repositories
{
    public interface IReviewReplyRepository
    {
        Task<ReviewReply> AddReplyAsync(ReviewReply reply);
        Task<ReviewReply?> GetReplyByIdAsync(string replyId);
        Task UpdateReplyAsync(ReviewReply reply);
        Task DeleteReplyAsync(ReviewReply reply);
    }
}
