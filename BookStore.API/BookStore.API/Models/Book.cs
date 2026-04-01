using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BookStore.API.Models
{
    [Table("Books")]
    public class Book
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int BookId { get; set; }

        [Required(ErrorMessage = "Tên sách là bắt buộc")]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phải chọn tác giả cho sách")]
        [ForeignKey("Author")]
        public int AuthorId { get; set; }
        public Author? Author { get; set; }

        public int PublisherId { get; set; }

        [ForeignKey("PublisherId")]
        public Publisher? Publisher { get; set; }

        public string Description { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18,2)")] // Định dạng tiền
        public decimal Price { get; set; }

        [Required]
        public int Stock { get; set; } = 0; // Số lượng tồn kho

        public ICollection<BookImage> BookImages { get; set; } = new List<BookImage>();

        public bool IsHidden { get; set; } = false; // Ẩn sách khỏi cửa hàng

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; } // Cho phép null, cập nhật khi Admin sửa sách

        // Khóa ngoại liên kết với bảng Category
        [Required(ErrorMessage = "Phải chọn danh mục cho sách")]
        [ForeignKey("Category")]
        public int CategoryId { get; set; }
        public Category? Category { get; set; }
    }
}