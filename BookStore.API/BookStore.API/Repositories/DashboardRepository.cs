using BookStore.API.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BookStore.API.Repositories
{
    public class DashboardRepository : IDashboardRepository
    {
        private readonly AppDbContext _context;

        public DashboardRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetDashboardDataAsync(int month, int year, int chartYear)
        {
            // Calculate previous month and year
            int prevMonth = month == 1 ? 12 : month - 1;
            int prevYear = month == 1 ? year - 1 : year;

            // 1. Thống kê tổng quan chung (Stats)
            var totalRevenueAmount = await _context.Orders
                .Where(o => o.Status == "Delivered")
                .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;
            var totalOrdersCount = await _context.Orders.CountAsync(o => o.Status != "PaymentPending");

            var currentMonthRevenue = await _context.Orders
                .Where(o => o.Status == "Delivered" && o.OrderDate.Month == month && o.OrderDate.Year == year)
                .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

            var prevMonthRevenue = await _context.Orders
                .Where(o => o.Status == "Delivered" && o.OrderDate.Month == prevMonth && o.OrderDate.Year == prevYear)
                .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;
                
            var currentMonthOrders = await _context.Orders.CountAsync(o =>
                o.Status == "Delivered" && o.OrderDate.Month == month && o.OrderDate.Year == year);
            var prevMonthOrders = await _context.Orders.CountAsync(o =>
                o.Status == "Delivered" && o.OrderDate.Month == prevMonth && o.OrderDate.Year == prevYear);
            var currentMonthActiveOrders = await _context.Orders.CountAsync(o =>
                o.Status != "PaymentPending" &&
                o.Status != "Delivered" &&
                o.Status != "Cancelled" &&
                o.OrderDate.Month == month &&
                o.OrderDate.Year == year);
            var currentMonthCancelledOrders = await _context.Orders.CountAsync(o =>
                o.Status == "Cancelled" && o.OrderDate.Month == month && o.OrderDate.Year == year);

            var totalUsers = await _context.Users.CountAsync(u => u.Role != "Admin");
            var totalBooks = await _context.Books.CountAsync();

            double revenueTrend = prevMonthRevenue > 0 ? (double)((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : (currentMonthRevenue > 0 ? 100 : 0);
            double ordersTrend = prevMonthOrders > 0 ? (double)((currentMonthOrders - prevMonthOrders) / (double)prevMonthOrders) * 100 : (currentMonthOrders > 0 ? 100 : 0);

            // 2. Biểu đồ doanh thu theo tháng (của chartYear)
            var monthlyRevenue = new List<object>();
            int currentYear = DateTime.UtcNow.Year;
            int maxMonth = chartYear == currentYear ? DateTime.UtcNow.Month : 12;
            var monthlyRevenueData = await _context.Orders
                .Where(o => o.Status == "Delivered" && o.OrderDate.Year == chartYear)
                .GroupBy(o => o.OrderDate.Month)
                .Select(g => new
                {
                    Month = g.Key,
                    Revenue = g.Sum(o => o.TotalAmount),
                    Orders = g.Count()
                })
                .ToDictionaryAsync(x => x.Month);

            for (int i = 1; i <= maxMonth; i++)
            {
                monthlyRevenueData.TryGetValue(i, out var item);
                monthlyRevenue.Add(new
                {
                    month = $"Thg {i}",
                    revenue = item?.Revenue ?? 0,
                    orders = item?.Orders ?? 0
                });
            }

            // 3. Tỷ lệ Category (Danh mục sách đã bán) - Group by category, then return items with book details
            var categorySalesQuery = await _context.OrderItems
                .Include(oi => oi.Book)
                    .ThenInclude(b => b!.Category)
                .Include(oi => oi.Order)
                .Where(oi => oi.Order!.Status == "Delivered" && oi.Order.OrderDate.Year == year && oi.Order.OrderDate.Month == month)
                .ToListAsync();

            var categorySalesData = categorySalesQuery
                .GroupBy(oi => oi.Book?.Category?.Name ?? "Khác")
                .Select(g => new 
                { 
                    name = g.Key, 
                    value = g.Sum(oi => oi.Quantity),
                    books = g.GroupBy(oi => oi.Book?.Title ?? "Unknown")
                             .Select(bg => new { title = bg.Key, quantity = bg.Sum(oi => oi.Quantity) })
                             .OrderByDescending(b => b.quantity)
                             .ToList()
                })
                .OrderByDescending(c => c.value)
                .ToList();

            // 4. Top Selling trong tháng và năm được chọn
            var topSellingQuery = await _context.OrderItems
                .Include(oi => oi.Book)
                    .ThenInclude(b => b!.BookImages)
                .Include(oi => oi.Order)
                .Where(oi => oi.Order!.Status == "Delivered" && oi.Order.OrderDate.Year == year && oi.Order.OrderDate.Month == month)
                .ToListAsync();

            var topSelling = topSellingQuery
                .GroupBy(oi => oi.Book)
                .Where(g => g.Key != null)
                .Select(g => new
                {
                    id = g.Key!.BookId,
                    title = g.Key.Title,
                    price = g.Key.Price,
                    sold = g.Sum(oi => oi.Quantity),
                    img = g.Key.BookImages?.OrderBy(i => i.ImageId).FirstOrDefault()?.ImageUrl ?? "https://via.placeholder.com/50"
                })
                .OrderByDescending(x => x.sold)
                .Take(5)
                .ToList();

            // 5. Top Rated (Thực tế thông qua bảng Reviews, đánh giá trung bình cao nhất, tối thiểu 1 review)
            var topRatedQuery = await _context.Reviews
                .Where(r => r.CreatedAt.Year == year && r.CreatedAt.Month == month)
                .Include(r => r.User)
                .Include(r => r.Replies)
                    .ThenInclude(reply => reply.User)
                .Include(r => r.Book)
                    .ThenInclude(b => b!.BookImages)
                .ToListAsync();

            var topRated = topRatedQuery
                .GroupBy(r => r.Book)
                .Where(g => g.Key != null)
                .Select(g => new
                {
                    id = g.Key!.BookId,
                    title = g.Key.Title,
                    price = g.Key.Price,
                    rating = Math.Round(g.Average(r => r.Rating), 1),
                    reviews = g.Count(),
                    img = g.Key.BookImages?.OrderBy(i => i.ImageId).FirstOrDefault()?.ImageUrl ?? "https://via.placeholder.com/50",
                    commentList = g.Select(r => new 
                    { 
                        id = r.ReviewId, 
                        fullName = r.User != null ? r.User.FullName : null, 
                        rating = r.Rating, 
                        comment = r.Comment, 
                        createdAt = r.CreatedAt,
                        replies = r.Replies != null ? r.Replies.Select(reply => new {
                            id = reply.ReplyId,
                            content = reply.Content,
                            createdAt = reply.CreatedAt,
                            isAdmin = reply.User != null && reply.User.Role == "Admin",
                            fullName = reply.User != null ? reply.User.FullName : null
                        }).OrderBy(reply => reply.createdAt).ToList() : null
                    }).OrderByDescending(r => r.createdAt).ToList()
                })
                .OrderByDescending(x => x.rating)
                .ThenByDescending(x => x.reviews)
                .Take(5)
                .ToList();

            return new
            {
                stats = new 
                { 
                    totalRevenue = totalRevenueAmount, 
                    totalOrders = totalOrdersCount, 
                    currentMonthRevenue = currentMonthRevenue,
                    currentMonthOrders = currentMonthOrders,
                    currentMonthActiveOrders = currentMonthActiveOrders,
                    currentMonthCancelledOrders = currentMonthCancelledOrders,
                    revenueTrend = Math.Round(revenueTrend, 2),
                    ordersTrend = Math.Round(ordersTrend, 2),
                    totalUsers, 
                    totalBooks 
                },
                monthlyRevenue,
                categorySales = categorySalesData,
                topSellingProducts = topSelling,
                topRatedProducts = topRated
            };
        }
    }
}
