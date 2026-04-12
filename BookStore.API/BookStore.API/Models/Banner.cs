using System;
using System.ComponentModel.DataAnnotations;

namespace BookStore.API.Models
{
    public class Banner
    {
        [Key]
        public string BannerId { get; set; } = Guid.NewGuid().ToString();
        [Required]
        public string ImageUrl { get; set; } = string.Empty;
        [Required]
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string? LinkUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public int DisplayOrder { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}