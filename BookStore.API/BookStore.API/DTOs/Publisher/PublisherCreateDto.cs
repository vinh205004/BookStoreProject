using System.ComponentModel.DataAnnotations;

namespace BookStore.API.DTOs
{
    public class PublisherCreateDto
    {
        [Required(ErrorMessage = "Tên danh mục không được để trống")]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}