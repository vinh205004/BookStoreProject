using BookStore.API.DTOs;
using BookStore.API.Models;
using BookStore.API.Repositories;
using BookStore.API.Utilities;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace BookStore.API.Services
{
    public class ReviewService : IReviewService
    {
        private readonly IReviewRepository _reviewRepository;

        public ReviewService(IReviewRepository reviewRepository)
        {
            _reviewRepository = reviewRepository;
        }

        public async Task<IEnumerable<ReviewDto>> GetReviewsByBookIdAsync(string bookId)
        {
            var reviews = await _reviewRepository.GetReviewsByBookIdAsync(bookId);
            return reviews.Select(r => new ReviewDto
            {
                ReviewId = r.ReviewId,
                BookId = r.BookId,
                UserId = r.UserId,
                UserName = r.User != null ? (string.IsNullOrEmpty(r.User.FullName) ? r.User.Username : r.User.FullName) : "Unknown",
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt,
                Replies = r.Replies.Select(rep => new ReviewReplyDto
                {
                    ReplyId = rep.ReplyId,
                    ReviewId = rep.ReviewId,
                    UserId = rep.UserId,
                    UserName = rep.User != null ? (string.IsNullOrEmpty(rep.User.FullName) ? rep.User.Username : rep.User.FullName) : "Unknown",
                    Content = rep.Content,
                    CreatedAt = rep.CreatedAt,
                    IsAdmin = rep.User != null && rep.User.Role == "Admin"
                }).ToList()
            });
        }

        public async Task<ReviewDto?> GetReviewByIdAsync(string id)
        {
            var r = await _reviewRepository.GetReviewByIdAsync(id);
            if (r == null) return null;

            return new ReviewDto
            {
                ReviewId = r.ReviewId,
                BookId = r.BookId,
                UserId = r.UserId,
                UserName = r.User != null ? (string.IsNullOrEmpty(r.User.FullName) ? r.User.Username : r.User.FullName) : "Unknown",
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt,
                Replies = r.Replies.Select(rep => new ReviewReplyDto
                {
                    ReplyId = rep.ReplyId,
                    ReviewId = rep.ReviewId,
                    UserId = rep.UserId,
                    UserName = rep.User != null ? (string.IsNullOrEmpty(rep.User.FullName) ? rep.User.Username : rep.User.FullName) : "Unknown",
                    Content = rep.Content,
                    CreatedAt = rep.CreatedAt,
                    IsAdmin = rep.User != null && rep.User.Role == "Admin"
                }).ToList()
            };
        }

        public async Task<ReviewDto> AddReviewAsync(CreateReviewDto dto, string userId)
        {
            // Kiểm tra xem người dùng đã mua sách này chưa (đơn hàng đã được duyệt/giao)
            if (!await _reviewRepository.HasUserPurchasedBookAsync(dto.BookId, userId))
            {
                throw new InvalidOperationException("Bạn phải mua thành công sản phẩm này mới có thể đánh giá.");
            }

            // Kiểm tra xem người dùng đã đánh giá sách này chưa
            if (await _reviewRepository.ReviewExistsAsync(dto.BookId, userId))
            {
                throw new InvalidOperationException("Bạn đã đánh giá sách này rồi.");
            }

            var review = new Review
            {
                ReviewId = IdGenerator.GenerateReviewId(),
                BookId = dto.BookId,
                UserId = userId,
                Rating = dto.Rating,
                Comment = dto.Comment
            };

            await _reviewRepository.AddReviewAsync(review);

            var created = await _reviewRepository.GetReviewByIdAsync(review.ReviewId);

            return new ReviewDto
            {
                ReviewId = created!.ReviewId,
                BookId = created.BookId,
                UserId = created.UserId,
                UserName = created.User != null ? (string.IsNullOrEmpty(created.User.FullName) ? created.User.Username : created.User.FullName) : "Unknown",
                Rating = created.Rating,
                Comment = created.Comment,
                CreatedAt = created.CreatedAt
            };
        }

        public async Task<bool> UpdateReviewAsync(string id, CreateReviewDto dto, string userId, bool isAdmin)
        {
            var review = await _reviewRepository.GetReviewByIdAsync(id);
            if (review == null) return false;

            if (review.UserId != userId && !isAdmin)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền sửa đánh giá này.");
            }

            review.Rating = dto.Rating;
            review.Comment = dto.Comment;

            await _reviewRepository.UpdateReviewAsync(review);
            return true;
        }

        public async Task<bool> DeleteReviewAsync(string id, string userId, bool isAdmin)
        {
            var review = await _reviewRepository.GetReviewByIdAsync(id);
            if (review == null) return false;

            if (review.UserId != userId && !isAdmin)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền xóa đánh giá này.");
            }

            await _reviewRepository.DeleteReviewAsync(review);
            return true;
        }

        public async Task<bool> CanReviewAsync(string bookId, string userId)
        {
            return await _reviewRepository.HasUserPurchasedBookAsync(bookId, userId);
        }
    }
}
