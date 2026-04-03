using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BookStore.API.Models
{
    [Table("Books")]
    public class Book
    {
        [Key]
        public string BookId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tên sách là bắt buộc")]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phải chọn tác giả cho sách")]
        [ForeignKey("Author")]
        public string AuthorId { get; set; } = string.Empty;
        public Author? Author { get; set; }

        public string PublisherId { get; set; } = string.Empty;

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
        public string CategoryId { get; set; } = string.Empty;
        public Category? Category { get; set; }

        // Target audience enum
        [Required]
        public string TargetAudience { get; set; } = "Trưởng thành"; // Options: "Nhi đồng (6-10 tuổi)", "Vị thành niên (10-17 tuổi)", "Trưởng thành (18+)"

        // Dimensions
        public decimal? Length { get; set; } // Chiều dài (chỉ số)
        public decimal? Width { get; set; } // Chiều rộng (chỉ số)

        [MaxLength(10)]
        public string? LengthUnit { get; set; } = "cm"; // Options: "mm", "cm", "dm"

        // Page count
        public int? PageCount { get; set; } // Số trang
    }
}