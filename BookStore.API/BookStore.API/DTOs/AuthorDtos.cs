using System.ComponentModel.DataAnnotations;

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
        public string Name { get; set; } = string.Empty;
        public string Biography { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
    }

    public class AuthorUpdateDto : AuthorCreateDto
    {
        public bool IsActive { get; set; }
    }
}