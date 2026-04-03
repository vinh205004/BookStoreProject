using BookStore.API.DTOs;

namespace BookStore.API.Services
{
    public interface IBookService
    {
        Task<IEnumerable<BookDto>> GetAllBooksAsync();
        Task<BookDto?> GetBookByIdAsync(string id);
        Task<BookDto> CreateBookAsync(BookCreateDto dto);
        Task<bool> UpdateBookAsync(string id, BookUpdateDto dto);
        Task<bool> DeleteBookAsync(string id); // Xóa mềm
        Task<bool> RestoreBookAsync(string id);
    }
}