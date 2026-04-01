using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace BookStore.API.Models
{
    [Table("BookImages")]
    public class BookImage
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int BookImageId { get; set; }

        [Required]
        public string ImageUrl { get; set; } = string.Empty;

        public int BookId { get; set; }

        [JsonIgnore] // Để khi GET JSON về không bị lặp vô tận (Vòng lặp tham chiếu)
        [ForeignKey("BookId")]
        public Book? Book { get; set; }
    }
}