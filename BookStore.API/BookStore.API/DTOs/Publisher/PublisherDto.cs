namespace BookStore.API.DTOs
{
    public class PublisherDto
    {
        public string PublisherId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }
}