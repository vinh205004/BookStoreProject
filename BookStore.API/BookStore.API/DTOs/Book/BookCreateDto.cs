using System.ComponentModel.DataAnnotations;

namespace BookStore.API.DTOs
{
    public class BookCreateDto
    {
        [Required(ErrorMessage = "Tên sách là bắt buộc")]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phải chọn tác giả")]
        public int AuthorId { get; set; }

        public string Publisher { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Giá bán phải lớn hơn hoặc bằng 0")]
        public decimal Price { get; set; }

        [Required]
        [Range(0, int.MaxValue, ErrorMessage = "Số lượng tồn kho không hợp lệ")]
        public int Stock { get; set; }

        public string ImageUrl { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phải chọn danh mục cho sách")]
        public int CategoryId { get; set; }
    }
}