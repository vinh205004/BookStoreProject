using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BookStore.API.Models
{
    [Table("Authors")]
    public class Author
    {
        [Key]
        public string AuthorId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tên tác giả là bắt buộc")]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        public string Biography { get; set; } = string.Empty; // Tiểu sử tác giả

        public string ImageUrl { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;

        // Một tác giả có thể có nhiều sách
        public ICollection<Book> Books { get; set; } = new List<Book>();
    }
}