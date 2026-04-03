namespace BookStore.API.DTOs
{
    public class BookDto
    {
        public string BookId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string AuthorId { get; set; } = string.Empty;
        public string AuthorName { get; set; } = string.Empty;
        public string PublisherId { get; set; } = string.Empty;
        public string PublisherName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public List<string> ImageUrls { get; set; } = new List<string>();
        public bool IsHidden { get; set; }
        public string CategoryId { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string TargetAudience { get; set; } = string.Empty;
        public decimal? Length { get; set; }
        public decimal? Width { get; set; }
        public string? LengthUnit { get; set; }
        public int? PageCount { get; set; } 
    }
}