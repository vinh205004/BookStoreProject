using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace BookStore.API.Models
{
    [Table("BookImages")]
    public class BookImage
    {
        [Key]
        public string ImageId { get; set; } = string.Empty;

        [Required]
        public string ImageUrl { get; set; } = string.Empty;

        public string BookId { get; set; } = string.Empty;

        [JsonIgnore] // Để khi GET JSON về không bị lặp vô tận (Vòng lặp tham chiếu)
        [ForeignKey("BookId")]
        public Book? Book { get; set; }
    }
}