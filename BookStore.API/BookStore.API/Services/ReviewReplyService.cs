using BookStore.API.DTOs;
using BookStore.API.Models;
using BookStore.API.Repositories;
using BookStore.API.Utilities;
using System.Threading.Tasks;
using System;

namespace BookStore.API.Services
{
    public class ReviewReplyService : IReviewReplyService
    {
        private readonly IReviewReplyRepository _replyRepository;
        private readonly IReviewRepository _reviewRepository;

        public ReviewReplyService(IReviewReplyRepository replyRepository, IReviewRepository reviewRepository)
        {
            _replyRepository = replyRepository;
            _reviewRepository = reviewRepository;
        }

        public async Task<ReviewReplyDto> AddReplyAsync(string reviewId, CreateReviewReplyDto dto, string userId, bool isAdmin)
        {
            var review = await _reviewRepository.GetReviewByIdAsync(reviewId);
            if (review == null) throw new InvalidOperationException("Không tìm thấy đánh giá này.");

            var reply = new ReviewReply
            {
                ReplyId = IdGenerator.GenerateReviewReplyId(),
                ReviewId = reviewId,
                UserId = userId,
                Content = dto.Content
            };

            var createdReply = await _replyRepository.AddReplyAsync(reply);
            var repWithUser = await _replyRepository.GetReplyByIdAsync(createdReply.ReplyId);

            return new ReviewReplyDto
            {
                ReplyId = repWithUser!.ReplyId,
                ReviewId = repWithUser.ReviewId,
                UserId = repWithUser.UserId,
                UserName = repWithUser.User != null ? (string.IsNullOrEmpty(repWithUser.User.FullName) ? repWithUser.User.Username : repWithUser.User.FullName) : "Unknown",
                Content = repWithUser.Content,
                CreatedAt = repWithUser.CreatedAt,
                IsAdmin = repWithUser.User != null && repWithUser.User.Role == "Admin"
            };
        }

        public async Task<bool> UpdateReplyAsync(string replyId, CreateReviewReplyDto dto, string userId, bool isAdmin)
        {
            var reply = await _replyRepository.GetReplyByIdAsync(replyId);
            if (reply == null) return false;

            if (reply.UserId != userId && !isAdmin)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền sửa phản hồi này.");
            }

            reply.Content = dto.Content;
            await _replyRepository.UpdateReplyAsync(reply);
            return true;
        }

        public async Task<bool> DeleteReplyAsync(string replyId, string userId, bool isAdmin)
        {
            var reply = await _replyRepository.GetReplyByIdAsync(replyId);
            if (reply == null) return false;

            if (reply.UserId != userId && !isAdmin)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền xóa phản hồi này.");
            }

            await _replyRepository.DeleteReplyAsync(reply);
            return true;
        }
    }
}
