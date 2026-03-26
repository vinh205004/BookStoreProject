namespace BookStore.API.DTOs
{
    public class BookDto
    {
        public int BookId { get; set; }
        public string Title { get; set; } = string.Empty;
        public int AuthorId { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string Publisher { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsHidden { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty; // Trả về thêm tên danh mục cho dễ hiển thị UI
    }
}