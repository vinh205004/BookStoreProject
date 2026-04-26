using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BookStore.API.Models
{
    [Table("ReviewReplies")]
    public class ReviewReply
    {
        [Key]
        public string ReplyId { get; set; } = string.Empty;

        [Required]
        public string ReviewId { get; set; } = string.Empty;
        
        [ForeignKey("ReviewId")]
        public Review? Review { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Content { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
