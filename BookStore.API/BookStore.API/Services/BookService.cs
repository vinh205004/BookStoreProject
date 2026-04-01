using BookStore.API.DTOs;
using BookStore.API.Models;
using BookStore.API.Repositories;

namespace BookStore.API.Services
{
    public class BookService : IBookService
    {
        private readonly IBookRepository _bookRepo;
        private readonly ICategoryRepository _categoryRepo; // Cần gọi CategoryRepo để kiểm tra danh mục có tồn tại không

        public BookService(IBookRepository bookRepo, ICategoryRepository categoryRepo)
        {
            _bookRepo = bookRepo;
            _categoryRepo = categoryRepo;
        }

        public async Task<IEnumerable<BookDto>> GetAllBooksAsync()
        {
            var books = await _bookRepo.GetAllAsync();
            return books.Select(b => new BookDto
            {
                BookId = b.BookId,
                Title = b.Title,
                AuthorId = b.AuthorId,
                AuthorName = b.Author?.Name ?? "Không xác định",
                PublisherId = b.PublisherId,
                PublisherName = b.Publisher != null ? b.Publisher.Name : "",
                Description = b.Description,
                Price = b.Price,
                Stock = b.Stock,
                ImageUrls = b.BookImages.Select(img => img.ImageUrl).ToList(),
                IsHidden = b.IsHidden,
                CategoryId = b.CategoryId,
                CategoryName = b.Category?.Name ?? "Không xác định"
            });
        }

        public async Task<BookDto?> GetBookByIdAsync(int id)
        {
            var b = await _bookRepo.GetByIdAsync(id);
            if (b == null) return null;

            return new BookDto
            {
                BookId = b.BookId,
                Title = b.Title,
                AuthorId = b.AuthorId,
                AuthorName = b.Author?.Name ?? "Không xác định",
                PublisherId = b.PublisherId,
                Description = b.Description,
                Price = b.Price,
                Stock = b.Stock,
                ImageUrls = b.BookImages.Select(img => img.ImageUrl).ToList(),
                IsHidden = b.IsHidden,
                CategoryId = b.CategoryId,
                CategoryName = b.Category?.Name ?? "Không xác định"
            };
        }

        public async Task<BookDto> CreateBookAsync(BookCreateDto dto)
        {
            // Kiểm tra CategoryId có hợp lệ không
            var category = await _categoryRepo.GetByIdAsync(dto.CategoryId);
            if (category == null || !category.IsActive)
                throw new Exception("Danh mục không tồn tại hoặc đã bị khóa!");

            var newBook = new Book
            {
                Title = dto.Title,
                AuthorId = dto.AuthorId,
                PublisherId = dto.PublisherId,
                Description = dto.Description,
                Price = dto.Price,
                Stock = dto.Stock,
                BookImages = dto.ImageUrls.Select(url => new BookImage { ImageUrl = url }).ToList(),
                CategoryId = dto.CategoryId,
                IsHidden = false,
                CreatedAt = DateTime.UtcNow
            };

            await _bookRepo.AddAsync(newBook);

            return await GetBookByIdAsync(newBook.BookId); 
        }

        public async Task<bool> UpdateBookAsync(int id, BookUpdateDto dto)
        {
            var book = await _bookRepo.GetByIdAsync(id);
            if (book == null) return false;

            if (book.CategoryId != dto.CategoryId)
            {
                var category = await _categoryRepo.GetByIdAsync(dto.CategoryId);
                if (category == null || !category.IsActive)
                    throw new Exception("Danh mục mới không tồn tại hoặc đã bị khóa!");
            }

            book.Title = dto.Title;
            book.AuthorId = dto.AuthorId;
            book.PublisherId = dto.PublisherId;
            book.Description = dto.Description;
            book.Price = dto.Price;
            book.Stock = dto.Stock;
            book.BookImages = dto.ImageUrls.Select(url => new BookImage { ImageUrl = url, BookId = book.BookId }).ToList();
            book.CategoryId = dto.CategoryId;
            book.IsHidden = dto.IsHidden;
            book.UpdatedAt = DateTime.UtcNow;

            await _bookRepo.UpdateAsync(book);
            return true;
        }

        public async Task<bool> DeleteBookAsync(int id)
        {
            var book = await _bookRepo.GetByIdAsync(id);
            if (book == null) return false;

            book.IsHidden = true; // Xóa mềm
            book.UpdatedAt = DateTime.UtcNow;

            await _bookRepo.UpdateAsync(book);
            return true;
        }
        public async Task<bool> RestoreBookAsync(int id)
        {
            var book = await _bookRepo.GetByIdAsync(id);
            if (book == null) return false;

            book.IsHidden = false; // Khôi phục (bỏ ẩn)
            book.UpdatedAt = DateTime.UtcNow;

            await _bookRepo.UpdateAsync(book);
            return true;
        }
    }
}