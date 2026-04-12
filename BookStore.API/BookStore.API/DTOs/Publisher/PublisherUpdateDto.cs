using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BookStore.API.DTOs
{
    public class PublisherUpdateDto
    {
        [Required(ErrorMessage = "Tên nhà xuất bản không được để trống")]
        [MaxLength(100)]
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
        
        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;
        
        [JsonPropertyName("isActive")]
        public bool IsActive { get; set; }
    }
}