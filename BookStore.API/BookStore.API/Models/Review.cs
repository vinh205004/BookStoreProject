using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BookStore.API.Models
{
    [Table("Reviews")]
    public class Review
    {
        [Key]
        public string ReviewId { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string BookId { get; set; } = string.Empty;

        [ForeignKey("BookId")]
        public Book? Book { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Required]
        [Range(1, 5, ErrorMessage = "Đánh giá phải từ 1 đến 5 sao.")]
        public int Rating { get; set; }

        [MaxLength(1000)]
        public string? Comment { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<ReviewReply> Replies { get; set; } = new List<ReviewReply>();
    }
}
