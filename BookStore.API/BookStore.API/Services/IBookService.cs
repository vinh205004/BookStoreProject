using BookStore.API.DTOs;

namespace BookStore.API.Services
{
    public interface IBookService
    {
        Task<IEnumerable<BookDto>> GetAllBooksAsync();
        Task<BookDto?> GetBookByIdAsync(int id);
        Task<BookDto> CreateBookAsync(BookCreateDto dto);
        Task<bool> UpdateBookAsync(int id, BookUpdateDto dto);
        Task<bool> DeleteBookAsync(int id); // Xóa mềm
        Task<bool> RestoreBookAsync(int id);
    }
}