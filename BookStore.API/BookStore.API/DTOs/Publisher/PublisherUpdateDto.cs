using System.ComponentModel.DataAnnotations;

namespace BookStore.API.DTOs
{
    public class PublisherUpdateDto
    {
        [Required(ErrorMessage = "Tên nhà xuất bản không được để trống")]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }
}