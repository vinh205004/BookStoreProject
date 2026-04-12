using BookStore.API.DTOs;
using System.Threading.Tasks;

namespace BookStore.API.Services
{
    public interface IReviewReplyService
    {
        Task<ReviewReplyDto> AddReplyAsync(string reviewId, CreateReviewReplyDto dto, string userId, bool isAdmin);
        Task<bool> UpdateReplyAsync(string replyId, CreateReviewReplyDto dto, string userId, bool isAdmin);
        Task<bool> DeleteReplyAsync(string replyId, string userId, bool isAdmin);
    }
}
