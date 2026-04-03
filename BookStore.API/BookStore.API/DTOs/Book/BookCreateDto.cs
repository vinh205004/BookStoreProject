using System.ComponentModel.DataAnnotations;

namespace BookStore.API.DTOs
{
    public class BookCreateDto
    {
        [Required(ErrorMessage = "Tên sách là bắt buộc")]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phải chọn tác giả")]
        public string AuthorId { get; set; } = string.Empty;

        public string PublisherId { get; set; } = string.Empty;
        public string PublisherName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Giá bán phải lớn hơn hoặc bằng 0")]
        public decimal Price { get; set; }

        [Required]
        [Range(0, int.MaxValue, ErrorMessage = "Số lượng tồn kho không hợp lệ")]
        public int Stock { get; set; }

        public List<string> ImageUrls { get; set; } = new List<string>();

        [Required(ErrorMessage = "Phải chọn danh mục cho sách")]
        public string CategoryId { get; set; } = string.Empty;

        // New book properties
        public string? TargetAudience { get; set; }
        public decimal? Length { get; set; }
        public decimal? Width { get; set; }
        public string? LengthUnit { get; set; }
        public int? PageCount { get; set; }
    }
}