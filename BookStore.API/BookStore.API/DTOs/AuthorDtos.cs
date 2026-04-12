using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BookStore.API.DTOs
{
    public class AuthorDto
    {
        public string AuthorId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Biography { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int BookCount { get; set; }
    }

    public class AuthorCreateDto
    {
        [Required(ErrorMessage = "Tên tác giả không được để trống")]
        [MaxLength(150)]
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
        
        [JsonPropertyName("biography")]
        public string Biography { get; set; } = string.Empty;
        
        [JsonPropertyName("imageUrl")]
        public string ImageUrl { get; set; } = string.Empty;
    }

    public class AuthorUpdateDto : AuthorCreateDto
    {
        [JsonPropertyName("isActive")]
        public bool IsActive { get; set; }
    }
}