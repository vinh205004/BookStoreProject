using System.ComponentModel.DataAnnotations;

namespace BookStore.API.DTOs
{
    public class BookUpdateDto : BookCreateDto
    {
        public bool IsHidden { get; set; }
    }
}