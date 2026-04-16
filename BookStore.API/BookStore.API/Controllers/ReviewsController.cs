using BookStore.API.DTOs;
using BookStore.API.Hubs;
using BookStore.API.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using System;

namespace BookStore.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;
        private readonly IReviewReplyService _reviewReplyService;
        private readonly IHubContext<NotificationHub> _notificationHub;

        public ReviewsController(IReviewService reviewService, IReviewReplyService reviewReplyService, IHubContext<NotificationHub> notificationHub)
        {
            _reviewService = reviewService;
            _reviewReplyService = reviewReplyService;
            _notificationHub = notificationHub;
        }

        [HttpGet("book/{bookId}")]
        public async Task<IActionResult> GetReviewsByBookId(string bookId)
        {
            var reviews = await _reviewService.GetReviewsByBookIdAsync(bookId);
            return Ok(reviews);
        }

        [HttpGet("book/{bookId}/can-review")]
        [Authorize]
        public async Task<IActionResult> CanReview(string bookId)
        {
            var userId = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrEmpty(userId)) return Ok(new { canReview = false });

            var hasPurchased = await _reviewService.CanReviewAsync(bookId, userId);
            return Ok(new { canReview = hasPurchased });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetReviewById(string id)
        {
            var review = await _reviewService.GetReviewByIdAsync(id);
            if (review == null) return NotFound("Không tìm thấy đánh giá.");
            return Ok(review);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> AddReview([FromBody] CreateReviewDto dto)
        {
            try
            {
                var userId = User.FindFirst("UserId")?.Value;
                if (string.IsNullOrEmpty(userId)) return Unauthorized();

                var review = await _reviewService.AddReviewAsync(dto, userId);
                await _notificationHub.Clients.Group("Admins").SendAsync("NewReviewCreated", new
                {
                    reviewId = review.ReviewId,
                    bookId = review.BookId,
                    userName = review.UserName,
                    rating = review.Rating,
                    comment = review.Comment
                });

                return CreatedAtAction(nameof(GetReviewById), new { id = review.ReviewId }, review);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.InnerException?.Message ?? ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateReview(string id, [FromBody] CreateReviewDto dto)
        {
            try
            {
                var userId = User.FindFirst("UserId")?.Value;
                var isAdmin = User.IsInRole("Admin");

                if (string.IsNullOrEmpty(userId)) return Unauthorized();

                var result = await _reviewService.UpdateReviewAsync(id, dto, userId, isAdmin);
                if (!result) return NotFound("Không tìm thấy đánh giá.");

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteReview(string id)
        {
            try
            {
                var userId = User.FindFirst("UserId")?.Value;
                var isAdmin = User.IsInRole("Admin");

                if (string.IsNullOrEmpty(userId)) return Unauthorized();

                var result = await _reviewService.DeleteReviewAsync(id, userId, isAdmin);
                if (!result) return NotFound("Không tìm thấy đánh giá.");

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpPost("{reviewId}/replies")]
        [Authorize]
        public async Task<IActionResult> AddReply(string reviewId, [FromBody] CreateReviewReplyDto dto)
        {
            try
            {
                var userId = User.FindFirst("UserId")?.Value;
                var isAdmin = User.IsInRole("Admin");
                if (string.IsNullOrEmpty(userId)) return Unauthorized();

                var reply = await _reviewReplyService.AddReplyAsync(reviewId, dto, userId, isAdmin);
                var review = await _reviewService.GetReviewByIdAsync(reviewId);
                if (isAdmin)
                {
                    if (review != null && review.UserId != userId)
                    {
                        await _notificationHub.Clients.User(review.UserId).SendAsync("ReviewReplied", new
                        {
                            reviewId = review.ReviewId,
                            bookId = review.BookId,
                            replyId = reply.ReplyId,
                            content = reply.Content
                        });
                    }
                }
                else if (review != null)
                {
                    await _notificationHub.Clients.Group("Admins").SendAsync("ReviewReplyCreated", new
                    {
                        reviewId = review.ReviewId,
                        bookId = review.BookId,
                        replyId = reply.ReplyId,
                        userName = reply.UserName,
                        content = reply.Content
                    });
                }

                return Ok(reply);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.InnerException?.Message ?? ex.Message });
            }
        }

        [HttpPut("replies/{replyId}")]
        [Authorize]
        public async Task<IActionResult> UpdateReply(string replyId, [FromBody] CreateReviewReplyDto dto)
        {
            try
            {
                var userId = User.FindFirst("UserId")?.Value;
                var isAdmin = User.IsInRole("Admin");

                if (string.IsNullOrEmpty(userId)) return Unauthorized();

                var result = await _reviewReplyService.UpdateReplyAsync(replyId, dto, userId, isAdmin);
                if (!result) return NotFound("Không tìm thấy phản hồi.");
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpDelete("replies/{replyId}")]
        [Authorize]
        public async Task<IActionResult> DeleteReply(string replyId)
        {
            try
            {
                var userId = User.FindFirst("UserId")?.Value;
                var isAdmin = User.IsInRole("Admin");
                if (string.IsNullOrEmpty(userId)) return Unauthorized();

                var result = await _reviewReplyService.DeleteReplyAsync(replyId, userId, isAdmin);
                if (!result) return NotFound("Không tìm thấy phản hồi.");
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }
    }
}
