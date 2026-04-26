using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BookStore.API.Models;
using BookStore.API.Utilities;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace BookStore.API.Data
{
    public class AppDbSeeder
    {
        private readonly AppDbContext _context;

        public AppDbSeeder(AppDbContext context)
        {
            _context = context;
        }

        public async Task SeedAsync()
        {
            await _context.Database.EnsureCreatedAsync();

            _context.OrderItems.RemoveRange(_context.OrderItems);
            _context.Orders.RemoveRange(_context.Orders);
            _context.Reviews.RemoveRange(_context.Reviews);
            _context.BookImages.RemoveRange(_context.BookImages);
            _context.Books.RemoveRange(_context.Books);
            _context.Categories.RemoveRange(_context.Categories);
            _context.Authors.RemoveRange(_context.Authors);
            _context.Publishers.RemoveRange(_context.Publishers);
            _context.Vouchers.RemoveRange(_context.Vouchers);
            
            var existingUsers = await _context.Users.Where(u => u.Role != "Admin").ToListAsync();
            _context.Users.RemoveRange(existingUsers);
            
            await _context.SaveChangesAsync();

            var passwordHash = BCrypt.Net.BCrypt.HashPassword("User@123");
            var users = new List<User>();
            for (int i = 1; i <= 50; i++)
            {
                users.Add(new User
                {
                    UserId = IdGenerator.GenerateUserId(),
                    Username = $"khachhang{i}",
                    PasswordHash = passwordHash,
                    FullName = $"Khách Hàng {i}",
                    Email = $"khachhang{i}@gmail.com",
                    PhoneNumber = $"098{i.ToString("D7")}",
                    Address = $"Số {i}, Đường ABC, Quận XYZ, Hà Nội",
                    Role = "Customer",
                    CreatedAt = DateTime.UtcNow.AddDays(-i),
                    IsLocked = false
                });
            }
            await _context.Users.AddRangeAsync(users);

            var categoryNames = new[] { "Văn Học Việt Nam", "Văn Học Nước Ngoài", "Kỹ Năng Sống", "Kinh Tế - Quản Trị", "Khoa Học - Kỹ Thuật", "Thiếu Nhi", "Lịch Sử - Văn Hóa" };
            var categories = categoryNames.Select(c => new Category { CategoryId = IdGenerator.GenerateCategoryId(), Name = c, Description = "Sách danh mục " + c }).ToList();
            await _context.Categories.AddRangeAsync(categories);

            var publishers = new[] { "NXB Trẻ", "NXB Kim Đồng", "Nhã Nam", "Alpha Books", "NXB Phụ Nữ", "NXB Tổng Hợp", "NXB Thế Giới", "First News" }
                .Select(p => new Publisher { PublisherId = IdGenerator.GeneratePublisherId(), Name = p, Description = p + " Việt Nam" }).ToList();
            await _context.Publishers.AddRangeAsync(publishers);

            var authorNames = new[]
            {
                "Nhiều tác giả", "Nguyễn Nhật Ánh", "Tô Hoài", "Ngô Tất Tố", "Nam Cao",
                "Thạch Lam", "Vũ Trọng Phụng", "Nguyên Hồng", "Nguyễn Công Hoan",
                "Nguyễn Ngọc Tư", "Paulo Coelho", "Haruki Murakami", "J.K. Rowling",
                "Dan Brown", "George Orwell", "Stephen Hawking", "Yuval Noah Harari",
                "Dale Carnegie", "Antoine de Saint-Exupéry", "J.M. Barrie", "Lewis Carroll",
                "Charles Dickens", "Hector Malot", "Mark Twain", "Herman Melville",
                "Ernest Hemingway", "Margaret Mitchell", "Alexandre Dumas", "Victor Hugo",
                "Miguel de Cervantes", "Daniel Defoe", "Jonathan Swift", "Jane Austen",
                "Oscar Wilde", "Mary Shelley", "Emily Brontë", "Harper Lee", "J.R.R. Tolkien",
                "L. Frank Baum", "Rudyard Kipling", "A.A. Milne", "Anh em Grimm",
                "Hans Christian Andersen", "Carlo Collodi", "E.B. White", "Fujiko F. Fujio",
                "Aoyama Gosho", "Akira Toriyama", "Hergé", "Robert Louis Stevenson",
                "Trác Nhã", "Johanna Spyri", "P.L. Travers", "Trần Trọng Kim", "Ngô Sĩ Liên",
                "Nguyễn Hiến Lê", "Tony Buổi Sáng", "Jules Verne", "J.D. Salinger",
                "Ayn Rand", "Jeffrey Archer", "Ethel Lilian Voynich", "Colleen McCullough",
                "Carlos Ruiz Zafón", "Albert Camus", "Baird T. Spalding", "Stephen R. Covey",
                "Napoleon Hill", "George S. Clason", "Charles Duhigg", "Gustave Le Bon",
                "David J. Lieberman", "Keith Ferrazzi", "Minh Niệm", "Robert Kiyosaki",
                "T. Harv Eker", "W. Chan Kim", "Jim Collins", "Steven D. Levitt",
                "Stephen J. Dubner", "Benjamin Graham", "Peter Thiel", "Song Hongbing",
                "Charles Darwin", "Thomas L. Friedman", "Brian Greene", "Carl Sagan",
                "Jared Diamond", "Ban biên soạn Tiến Thọ - Văn học Việt Nam",
                "Ban biên soạn Tiến Thọ - Văn học nước ngoài",
                "Ban biên soạn Tiến Thọ - Kỹ năng sống",
                "Ban biên soạn Tiến Thọ - Kinh tế quản trị",
                "Ban biên soạn Tiến Thọ - Khoa học kỹ thuật",
                "Ban biên soạn Tiến Thọ - Thiếu nhi",
                "Ban biên soạn Tiến Thọ - Lịch sử văn hóa"
            };
            var authors = authorNames.Select(a => new Author { AuthorId = IdGenerator.GenerateAuthorId(), Name = a, Biography = "Một tác giả nổi tiếng." }).ToList();
            await _context.Authors.AddRangeAsync(authors);
            var authorIds = authors.ToDictionary(a => a.Name, a => a.AuthorId);

            var titleAuthors = new Dictionary<string, string>
            {
                ["Mắt Biếc"] = "Nguyễn Nhật Ánh",
                ["Cho Tôi Xin Một Vé Đi Tuổi Thơ"] = "Nguyễn Nhật Ánh",
                ["Ngồi Khóc Trên Cây"] = "Nguyễn Nhật Ánh",
                ["Tôi Thấy Hoa Vàng Trên Cỏ Xanh"] = "Nguyễn Nhật Ánh",
                ["Dế Mèn Phiêu Lưu Ký"] = "Tô Hoài",
                ["Chí Phèo"] = "Nam Cao",
                ["Lão Hạc"] = "Nam Cao",
                ["Sống Mòn"] = "Nam Cao",
                ["Gió Lạnh Đầu Mùa"] = "Thạch Lam",
                ["Hai Đứa Trẻ"] = "Thạch Lam",
                ["Tắt Đèn"] = "Ngô Tất Tố",
                ["Số Đỏ"] = "Vũ Trọng Phụng",
                ["Bỉ Vỏ"] = "Nguyên Hồng",
                ["Bước Đường Cùng"] = "Nguyễn Công Hoan",
                ["Cánh Đồng Bất Tận"] = "Nguyễn Ngọc Tư",

                ["Nhà Giả Kim"] = "Paulo Coelho",
                ["Rừng Na Uy"] = "Haruki Murakami",
                ["Phía Nam Biên Giới Phía Tây Mặt Trời"] = "Haruki Murakami",
                ["Kafka Bên Bờ Biển"] = "Haruki Murakami",
                ["Harry Potter"] = "J.K. Rowling",
                ["Mật Mã Da Vinci"] = "Dan Brown",
                ["Thiên Thần Và Ác Quỷ"] = "Dan Brown",
                ["Pháo Đài Số"] = "Dan Brown",
                ["1984"] = "George Orwell",
                ["Trại Súc Vật"] = "George Orwell",
                ["Ông Già Và Biển Cả"] = "Ernest Hemingway",
                ["Giết Con Chim Nhại"] = "Harper Lee",
                ["Cuốn Theo Chiều Gió"] = "Margaret Mitchell",
                ["Không Gia Đình"] = "Hector Malot",
                ["Đồi Gió Hú"] = "Emily Brontë",
                ["Kiêu Hãnh Và Định Kiến"] = "Jane Austen",
                ["Bức Tranh Dorian Gray"] = "Oscar Wilde",
                ["Đảo Giấu Vàng"] = "Robert Louis Stevenson",
                ["Bá Tước Monte Cristo"] = "Alexandre Dumas",
                ["Frankenstein"] = "Mary Shelley",
                ["Hai Vạn Dặm Dưới Đáy Biển"] = "Jules Verne",
                ["Bắt Trẻ Đồng Xanh"] = "J.D. Salinger",
                ["Suối Nguồn"] = "Ayn Rand",
                ["Hai Số Phận"] = "Jeffrey Archer",
                ["Ruồi Trâu"] = "Ethel Lilian Voynich",
                ["Tiếng Chim Hót Trong Bụi Mận Gai"] = "Colleen McCullough",
                ["Bóng Chìm Của Gió"] = "Carlos Ruiz Zafón",
                ["Người Dưng"] = "Albert Camus",

                ["Đắc Nhân Tâm"] = "Dale Carnegie",
                ["Quẳng Gánh Lo Đi Và Vui Sống"] = "Dale Carnegie",
                ["Khéo Ăn Nói Sẽ Có Được Thiên Hạ"] = "Trác Nhã",
                ["Tony Buổi Sáng"] = "Tony Buổi Sáng",
                ["7 Thói Quen Của Người Thành Đạt"] = "Stephen R. Covey",
                ["Nghĩ Giàu Làm Giàu"] = "Napoleon Hill",
                ["Người Giàu Có Nhất Babylon"] = "George S. Clason",
                ["Sức Mạnh Của Thói Quen"] = "Charles Duhigg",
                ["Tâm Lý Học Đám Đông"] = "Gustave Le Bon",
                ["Đọc Vị Bất Kỳ Ai"] = "David J. Lieberman",
                ["Đừng Bao Giờ Đi Ăn Một Mình"] = "Keith Ferrazzi",
                ["Hiểu Về Trái Tim"] = "Minh Niệm",
                ["Hành Trình Về Phương Đông"] = "Baird T. Spalding",

                ["Lược Sử Thời Gian"] = "Stephen Hawking",
                ["Vũ Trụ Trong Vỏ Hạt Dẻ"] = "Stephen Hawking",
                ["Sapiens - Lược Sử Loài Người"] = "Yuval Noah Harari",
                ["Homo Deus"] = "Yuval Noah Harari",
                ["Nguồn Gốc Các Loài"] = "Charles Darwin",
                ["Thế Giới Phẳng"] = "Thomas L. Friedman",
                ["Lý Thuyết Dây"] = "Brian Greene",
                ["Sự Sống Trong Vũ Trụ"] = "Carl Sagan",
                ["Súng Vi Trùng Và Thép"] = "Jared Diamond",

                ["Rich Dad Poor Dad"] = "Robert Kiyosaki",
                ["Cha Giàu Cha Nghèo"] = "Robert Kiyosaki",
                ["Bí Mật Tư Duy Triệu Phú"] = "T. Harv Eker",
                ["Chiến Lược Đại Dương Xanh"] = "W. Chan Kim",
                ["Từ Tốt Đến Vĩ Đại"] = "Jim Collins",
                ["Kinh Tế Học Hài Hước"] = "Steven D. Levitt",
                ["Nhà Đầu Tư Thông Minh"] = "Benjamin Graham",
                ["Zero to One"] = "Peter Thiel",
                ["Chiến Tranh Tiền Tệ"] = "Song Hongbing",

                ["Doremon"] = "Fujiko F. Fujio",
                ["Conan"] = "Aoyama Gosho",
                ["7 Viên Ngọc Rồng"] = "Akira Toriyama",
                ["Những Cuộc Phiêu Lưu Của TinTin"] = "Hergé",
                ["Cổ Tích Grimm"] = "Anh em Grimm",
                ["Cổ Tích Andersen"] = "Hans Christian Andersen",
                ["Alice Ở Xứ Sở Diệu Kỳ"] = "Lewis Carroll",
                ["Hoàng Tử Bé"] = "Antoine de Saint-Exupéry",
                ["Gulliver Du Ký"] = "Jonathan Swift",
                ["Heidi"] = "Johanna Spyri",
                ["Mary Poppins"] = "P.L. Travers",
                ["Pinocchio"] = "Carlo Collodi",
                ["Peter Pan"] = "J.M. Barrie",
                ["Oliver Twist"] = "Charles Dickens",
                ["Gấu Pooh"] = "A.A. Milne",
                ["Cậu Bé Rừng Xanh"] = "Rudyard Kipling",
                ["Phù Thủy Xứ Oz"] = "L. Frank Baum",

                ["Việt Nam Sử Lược"] = "Trần Trọng Kim",
                ["Đại Việt Sử Ký Toàn Thư"] = "Ngô Sĩ Liên",
                ["Nguyễn Trãi - Sự Nghiệp"] = "Ban biên soạn Tiến Thọ - Lịch sử văn hóa"
            };

            var random = new Random();
            var books = new List<Book>();

            var catVn = categories[0].CategoryId;
            var vnTitles = new[] { "Mắt Biếc", "Cho Tôi Xin Một Vé Đi Tuổi Thơ", "Dế Mèn Phiêu Lưu Ký", "Chí Phèo", "Số Đỏ", "Cánh Đồng Bất Tận", "Ngồi Khóc Trên Cây", "Lão Hạc", "Gió Lạnh Đầu Mùa", "Tắt Đèn", "Bỉ Vỏ", "Hai Đứa Trẻ", "Bước Đường Cùng", "Lều Chõng", "Sống Mòn", "Hoa Hồng Tặng Mẹ", "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", "Ngọn Cỏ Gió Đùa", "Chút Tình Gửi Gió", "Bóng Mát Trưa Hè", "Mưa Rơi Trên Mái Ngói", "Tắt Lửa Lòng", "Những Đứa Trẻ Không Bao Giờ Lớn", "Cõi Nhân Gian", "Về Quê", "Bình Minh Nhỏ", "Trăng Non", "Những Người Khốn Khổ Việt", "Dòng Sông Tuổi Thơ", "Mùa Lau Thưa" };
            foreach(var t in vnTitles) books.Add(new Book { Title = t, CategoryId = catVn, TargetAudience = "Vị thành niên (10-17 tuổi)" });

            var catNgoai = categories[1].CategoryId;
            var nnTitles = new[] { "Nhà Giả Kim", "Rừng Na Uy", "Phía Nam Biên Giới Phía Tây Mặt Trời", "Hai Vạn Dặm Dưới Đáy Biển", "Harry Potter", "Mật Mã Da Vinci", "Thiên Thần Và Ác Quỷ", "Bắt Trẻ Đồng Xanh", "Ông Già Và Biển Cả", "Kafka Bên Bờ Biển", "1984", "Trại Súc Vật", "Giết Con Chim Nhại", "Hai Số Phận", "Suối Nguồn", "Bóng Chìm Của Gió", "Pháo Đài Số", "Tiếng Chim Hót Trong Bụi Mận Gai", "Cuốn Theo Chiều Gió", "Không Gia Đình", "Ruồi Trâu", "Đồi Gió Hú", "Kiêu Hãnh Và Định Kiến", "Bức Tranh Dorian Gray", "Người Dưng", "Không Khóc Ở Kuala Lumpur", "Người Truyền Ký", "Đảo Giấu Vàng", "Bá Tước Monte Cristo", "Frankenstein" };
            foreach(var t in nnTitles) books.Add(new Book { Title = t, CategoryId = catNgoai, TargetAudience = "Trưởng thành (18+)" });
            
            var catKN = categories[2].CategoryId;
            var knTitles = new[] { "Đắc Nhân Tâm", "Hạt Giống Tâm Hồn", "Quẳng Gánh Lo Đi Và Vui Sống", "Đọc Vị Bất Kỳ Ai", "Sức Mạnh Của Thói Quen", "Tư Duy Tích Cực", "Nuôi Dạy Con Kiểu Nhật", "Hành Trình Về Phương Đông", "7 Thói Quen Của Người Thành Đạt", "Nghệ Thuật Giao Tiếp", "Nghĩ Giàu Làm Giàu", "Thiết Kế Cuộc Đời Đáng Sống", "Mình Là Cá Việc Của Mình Là Bơi", "Đừng Bao Giờ Đi Ăn Một Mình", "Kỹ Năng Lãnh Đạo", "Giải Quyết Vấn Đề", "Kỷ Luật Không Nước Mắt", "Bí Quyết Giao Tiếp", "Người Giàu Có Nhất Babylon", "Chìa Khóa Thành Công", "Đánh Thức Năng Lực Vô Hạn", "Lập Trình Quỹ Đạo Cuộc Đời", "Hiểu Về Trái Tim", "Minh Triết Trong Đời Sống", "Vượt Qua Nghịch Cảnh", "Tâm Lý Học Đám Đông", "Khéo Ăn Nói Sẽ Có Được Thiên Hạ", "Sống Chậm Lại Giữa Thế Gian Vội Vã", "Chủ Động Sống", "Sức Mạnh Của Tĩnh Lặng" };
            foreach(var t in knTitles) books.Add(new Book { Title = t, CategoryId = catKN, TargetAudience = "Trưởng thành (18+)" });

            var catKT = categories[3].CategoryId;
            var ktTitles = new[] { "Rich Dad Poor Dad", "Bí Mật Tư Duy Triệu Phú", "Chiến Lược Đại Dương Xanh", "Từ Tốt Đến Vĩ Đại", "Kinh Tế Học Hài Hước", "Đầu Tư Tài Chính", "Tỷ Phú Khởi Nghiệp", "Lãnh Đạo Tinh Gọn", "Marketing Căn Bản", "Quản Trị Nhân Sự", "Kiếm Tiền Qua Mạng", "Đầu Tư Chứng Khoán", "Cha Giàu Cha Nghèo", "Giao Dịch Lớn", "Lợi Thế Cạnh Tranh", "Bước Chân Vào Wall Street", "Nhà Đầu Tư Thông Minh", "Khởi Nghiệp Du Kích", "Zero to One", "Phân Tích Kỹ Thuật", "Hành Vi Người Tiêu Dùng", "Bí Quyết Kinh Doanh Thời 4.0", "Quản Lý Dự Án", "Tài Chính Doanh Nghiệp", "Sát Thủ Kinh Doanh", "Nghệ Thuật Bán Hàng", "Bậc Thầy Bán Hàng", "Tâm Lý Học Lãnh Đạo", "Chiến Tranh Tiền Tệ", "Giàu Có" };
            foreach(var t in ktTitles) books.Add(new Book { Title = t, CategoryId = catKT, TargetAudience = "Trưởng thành (18+)" });
            
            var catKH = categories[4].CategoryId;
            var khTitles = new[] { "Lược Sử Thời Gian", "Vũ Trụ Trong Vỏ Hạt Dẻ", "Vật Lý Lượng Tử", "Thế Giới Phẳng", "Sapiens - Lược Sử Loài Người", "Homo Deus", "Lập Trình Cơ Bản", "AI Và Tương Lai", "Khoa Học Trữ Tình", "Nguồn Gốc Các Loài", "Vũ Trụ Rộng Lớn", "Thế Giới Vi Sinh", "Sinh Học Tế Bào", "Hoá Học Hữu Cơ", "Thiết Kế Trí Tuệ Nhân Tạo", "Kiến Trúc Máy Tính", "Toán Học Thú Vị", "Khám Phá Sao Hỏa", "Sự Sống Trong Vũ Trụ", "Thiên Văn Học", "Cơ Học Lượng Tử Giản Lược", "Lý Thuyết Dây", "Năng Lượng Sạch", "Bảo Mật Máy Tính", "Kỷ Nguyên Trí Tuệ", "Vật Trất Tối", "Cuộc Cách Mạng Khoa Học", "Nhập Môn Lập Trình Python", "C++ Cho Người Mới Bắt Đầu", "Data Science Toàn Tập" };
            foreach(var t in khTitles) books.Add(new Book { Title = t, CategoryId = catKH, TargetAudience = "Vị thành niên (10-17 tuổi)" });
            
            var catTN = categories[5].CategoryId;
            var tnTitles = new[] { "Doremon", "Conan", "7 Viên Ngọc Rồng", "Nữ Thần Chiến Binh", "Những Cuộc Phiêu Lưu Của TinTin", "Cổ Tích Grimm", "Cổ Tích Andersen", "Thần Đồng Đất Việt", "Alice Ở Xứ Sở Diệu Kỳ", "Hoàng Tử Bé", "Gulliver Du Ký", "Tom Và Jerry", "Heidi", "Mary Poppins", "Pinocchio", "Lọ Lem", "Bạch Tuyết Và Cảm Xúc", "Peter Pan", "Cuộc Phiêu Lưu Của Mít Đặc", "Oliver Twist", "Chiếc Chìa Khóa Vàng", "Heidi Bồng Bềnh", "Dế Hương Nhi", "Truyện Tranh Thần Thoại", "Bác Gấu Đen", "Gấu Pooh", "Cậu Bé Rừng Xanh", "Chú Mèo Đi Hia", "Phù Thủy Xứ Oz", "Kẻ Cắp Mặt Trăng" };
            foreach(var t in tnTitles) books.Add(new Book { Title = t, CategoryId = catTN, TargetAudience = "Nhi đồng (6-10 tuổi)" });

            var catLS = categories[6].CategoryId;
            var lsTitles = new[] { "Việt Nam Sử Lược", "Đại Việt Sử Ký Toàn Thư", "Súng Vi Trùng Và Thép", "Lịch Sử Văn Minh Thế Giới", "Lịch Sử Nghệ Thuật", "Hồ Chí Minh Biển Cả", "Vua Quang Trung", "Nguyễn Trãi - Sự Nghiệp", "Đại Nam Nhất Thống Chí", "Văn Hóa Dân Gian Việt Nam", "Con Người Của Lịch Sử", "Phong Tục Tập Quán", "Dấu Chân Lịch Sử", "Lịch Sử Chiến Tranh", "Hoàng Đế La Mã", "Hy Lạp Cổ Đại", "Ai Cập Huyền Bí", "Nghìn Năm Văn Hiến", "Câu Chuyện Về Đất Nước", "Thế Giới Cổ Đại", "Con Đường Tơ Lụa", "Kho Báu Của Những Nền Văn Minh", "Thời Đại Khai Sáng", "Châu Âu Trung Cổ", "Châu Á Tỏa Sáng", "Lịch Sử Thế Kỷ 20", "Chiến Tranh Lạnh", "Bản Cầm Ca Xưa", "Bí Mật Của Lịch Sử", "Đi Chơi Lịch Sử" };
            foreach(var t in lsTitles) books.Add(new Book { Title = t, CategoryId = catLS, TargetAudience = "Trưởng thành (18+)" });

            foreach(var b in books) 
            {
                b.BookId = IdGenerator.GenerateBookId();
                var fallbackAuthorName = b.CategoryId switch
                {
                    var id when id == catVn => "Ban biên soạn Tiến Thọ - Văn học Việt Nam",
                    var id when id == catNgoai => "Ban biên soạn Tiến Thọ - Văn học nước ngoài",
                    var id when id == catKN => "Ban biên soạn Tiến Thọ - Kỹ năng sống",
                    var id when id == catKT => "Ban biên soạn Tiến Thọ - Kinh tế quản trị",
                    var id when id == catKH => "Ban biên soạn Tiến Thọ - Khoa học kỹ thuật",
                    var id when id == catTN => "Ban biên soạn Tiến Thọ - Thiếu nhi",
                    var id when id == catLS => "Ban biên soạn Tiến Thọ - Lịch sử văn hóa",
                    _ => "Nhiều tác giả"
                };
                var selectedAuthorName = titleAuthors.TryGetValue(b.Title, out var authorName)
                    ? authorName
                    : fallbackAuthorName;
                b.AuthorId = authorIds.TryGetValue(selectedAuthorName, out var authorId)
                    ? authorId
                    : authorIds[fallbackAuthorName];
                b.PublisherId = publishers[random.Next(publishers.Count)].PublisherId;
                b.Price = random.Next(40, 300) * 1000;
                b.Stock = random.Next(20, 200);
                b.Description = "Mô tả chi tiết nội dung cuốn sách " + b.Title;
                b.PageCount = random.Next(150, 800);
                b.Length = (decimal)(random.NextDouble() * 5 + 15);
                b.Width = (decimal)(random.NextDouble() * 5 + 10);
                b.CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 300));
                
                // Set these explicit for API schema constraints
                b.Title = b.Title.Length > 255 ? b.Title.Substring(0, 255) : b.Title;
                if(b.Description.Length > 500) b.Description = b.Description.Substring(0, 500);
            }
            await _context.Books.AddRangeAsync(books);
            
            var vouchers = new List<Voucher>
            {
                new Voucher { VoucherId = IdGenerator.GenerateVoucherId(), Code = "WELCOME50K", DiscountType = "Direct", DiscountAmount = 50000, MinOrderValue = 200000, Quantity = 500, StartDate = DateTime.UtcNow.AddDays(-5), ExpirationDate = DateTime.UtcNow.AddMonths(1) },
                new Voucher { VoucherId = IdGenerator.GenerateVoucherId(), Code = "SALE10", DiscountType = "Percentage", DiscountAmount = 10, MinOrderValue = 100000, Quantity = 1000, StartDate = DateTime.UtcNow.AddDays(-2), ExpirationDate = DateTime.UtcNow.AddMonths(2) },
                new Voucher { VoucherId = IdGenerator.GenerateVoucherId(), Code = "FREESHIPTQ", DiscountType = "Direct", DiscountAmount = 30000, MinOrderValue = 150000, Quantity = 200, StartDate = DateTime.UtcNow.AddDays(-10), ExpirationDate = DateTime.UtcNow.AddMonths(3) },
                new Voucher { VoucherId = IdGenerator.GenerateVoucherId(), Code = "GIAM20", DiscountType = "Percentage", DiscountAmount = 20, MinOrderValue = 500000, Quantity = 100, StartDate = DateTime.UtcNow, ExpirationDate = DateTime.UtcNow.AddDays(15) },
                new Voucher { VoucherId = IdGenerator.GenerateVoucherId(), Code = "MUA1TANG1", DiscountType = "Direct", DiscountAmount = 40000, MinOrderValue = 300000, Quantity = 50, StartDate = DateTime.UtcNow.AddDays(-1), ExpirationDate = DateTime.UtcNow.AddDays(7) },
                new Voucher { VoucherId = IdGenerator.GenerateVoucherId(), Code = "THANGDEALS", DiscountType = "Percentage", DiscountAmount = 15, MinOrderValue = 250000, Quantity = 300, StartDate = DateTime.UtcNow.AddMonths(-1), ExpirationDate = DateTime.UtcNow.AddMonths(1) },
            };
            await _context.Vouchers.AddRangeAsync(vouchers);

            var orders = new List<Order>();
            var orderItems = new List<OrderItem>();
            var orderStatuses = new[] { "Pending", "Processing", "Shipped", "Delivered" };

            for (int i = 0; i < 100; i++)
            {
                var user = users[random.Next(users.Count)];
                var order = new Order
                {
                    OrderId = IdGenerator.GenerateOrderId(),
                    UserId = user.UserId,
                    OrderDate = DateTime.UtcNow.AddDays(-random.Next(1, 100)),
                    Status = orderStatuses[random.Next(4)],
                    ShippingAddress = user.Address,
                    PhoneNumber = user.PhoneNumber,
                    Note = random.NextDouble() > 0.7 ? "Giao gấp" : ""
                };

                int itemCount = random.Next(1, 5);
                var selectedBooks = books.OrderBy(x => random.Next()).Take(itemCount).ToList();
                decimal total = 0;

                foreach(var b in selectedBooks)
                {
                    var qty = random.Next(1, 3);
                    orderItems.Add(new OrderItem
                    {
                        OrderItemId = IdGenerator.GenerateOrderItemId(),
                        OrderId = order.OrderId,
                        BookId = b.BookId,
                        Quantity = qty,
                        UnitPrice = b.Price
                    });
                    total += b.Price * qty;
                }

                order.TotalAmount = total;
                orders.Add(order);
            }
            await _context.Orders.AddRangeAsync(orders);
            await _context.OrderItems.AddRangeAsync(orderItems);

            await _context.SaveChangesAsync();
        }
    }
}
