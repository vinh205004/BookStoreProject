using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BookStore.API.DTOs
{
    public class BookUpdateDto : BookCreateDto
    {
        [JsonPropertyName("isHidden")]
        public bool IsHidden { get; set; }
    }
}