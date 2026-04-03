using BookStore.API.Data;
using BookStore.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace BookStore.API.Repositories
{
    public class BookRepository : IBookRepository
    {
        private readonly AppDbContext _context;
        public BookRepository(AppDbContext context) => _context = context;

        public async Task<IEnumerable<Book>> GetAllAsync()
        {
            return await _context.Books.Include(b => b.Category).Include(b => b.Author).Include(b => b.BookImages).Include(b => b.Publisher).ToListAsync();
        }

        public async Task<Book?> GetByIdAsync(string id)
        {
            return await _context.Books.Include(b => b.Category).Include(b => b.Author).Include(b => b.BookImages).Include(b => b.Publisher)
                                       .FirstOrDefaultAsync(b => b.BookId == id);
        }

        public async Task AddAsync(Book book)
        {
            await _context.Books.AddAsync(book);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Book book)
        {
            // 1. Lấy dữ liệu hiện tại trong DB ra để so sánh
            var existingBook = await _context.Books
                .Include(b => b.BookImages)
                .FirstOrDefaultAsync(b => b.BookId == book.BookId);

            if (existingBook == null) return;

            // 2. Cập nhật các trường thông tin cơ bản
            _context.Entry(existingBook).CurrentValues.SetValues(book);
            existingBook.UpdatedAt = DateTime.UtcNow;

            // 3. Xử lý cập nhật hình ảnh
            // Chỉ xử lý nếu danh sách ảnh gửi lên khác null
            if (book.BookImages != null)
            {
                // Lấy danh sách URL ảnh mới gửi từ Frontend
                var newImageUrls = book.BookImages.Select(img => img.ImageUrl).ToList();

                // Lấy danh sách URL ảnh hiện đang có trong DB
                var currentImageUrls = existingBook.BookImages.Select(img => img.ImageUrl).ToList();

                // Nếu danh sách URL ảnh có sự thay đổi (thêm hoặc bớt ảnh)
                if (!newImageUrls.SequenceEqual(currentImageUrls))
                {
                    // xóa hết ảnh cũ trong DB
                    _context.BookImages.RemoveRange(existingBook.BookImages);

                    // gán danh sách ảnh mới vào
                    existingBook.BookImages = book.BookImages;
                }
            }

            // 4. Lưu thay đổi
            await _context.SaveChangesAsync();
        }
    }
}