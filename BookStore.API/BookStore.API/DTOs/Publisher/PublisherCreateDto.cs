using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BookStore.API.DTOs
{
    public class PublisherCreateDto
    {
        [Required(ErrorMessage = "Tên danh mục không được để trống")]
        [MaxLength(100)]
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
        
        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;
    }
}