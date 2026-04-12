using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BookStore.API.DTOs
{
    public class BookCreateDto
    {
        [Required(ErrorMessage = "Tên sách là bắt buộc")]
        [MaxLength(255)]
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phải chọn tác giả")]
        [JsonPropertyName("authorId")]
        public string AuthorId { get; set; } = string.Empty;

        [JsonPropertyName("publisherId")]
        public string PublisherId { get; set; } = string.Empty;
        
        [JsonPropertyName("publisherName")]
        public string PublisherName { get; set; } = string.Empty;
        
        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Giá bán phải lớn hơn hoặc bằng 0")]
        [JsonPropertyName("price")]
        public decimal Price { get; set; }

        [Required]
        [Range(0, int.MaxValue, ErrorMessage = "Số lượng tồn kho không hợp lệ")]
        [JsonPropertyName("stock")]
        public int Stock { get; set; }

        [JsonPropertyName("imageUrls")]
        public List<string> ImageUrls { get; set; } = new List<string>();

        [Required(ErrorMessage = "Phải chọn danh mục cho sách")]
        [JsonPropertyName("categoryId")]
        public string CategoryId { get; set; } = string.Empty;

        // New book properties
        [JsonPropertyName("targetAudience")]
        public string? TargetAudience { get; set; }
        
        [JsonPropertyName("length")]
        public decimal? Length { get; set; }
        
        [JsonPropertyName("width")]
        public decimal? Width { get; set; }
        
        [JsonPropertyName("lengthUnit")]
        public string? LengthUnit { get; set; }
        
        [JsonPropertyName("pageCount")]
        public int? PageCount { get; set; }

        [JsonPropertyName("discountedPrice")]
        public decimal? DiscountedPrice { get; set; }

        [JsonPropertyName("discountBadge")]
        public string? DiscountBadge { get; set; }
    }
}