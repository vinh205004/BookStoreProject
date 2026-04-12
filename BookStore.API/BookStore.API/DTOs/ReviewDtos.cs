using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace BookStore.API.DTOs
{
    public class ReviewDto
    {
        public string ReviewId { get; set; } = string.Empty;
        public string BookId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = "Anonymous";
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<ReviewReplyDto> Replies { get; set; } = new List<ReviewReplyDto>();
    }

    public class ReviewReplyDto
    {
        public string ReplyId { get; set; } = string.Empty;
        public string ReviewId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = "Anonymous";
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsAdmin { get; set; } = false;
    }

    public class CreateReviewReplyDto
    {
        [Required]
        [MaxLength(1000)]
        public string Content { get; set; } = string.Empty;
    }

    public class CreateReviewDto
    {
        [Required]
        public string BookId { get; set; } = string.Empty;

        [Required]
        [Range(1, 5, ErrorMessage = "Đánh giá phải từ 1 đến 5 sao.")]
        public int Rating { get; set; }

        [MaxLength(1000)]
        public string? Comment { get; set; }
    }
}
