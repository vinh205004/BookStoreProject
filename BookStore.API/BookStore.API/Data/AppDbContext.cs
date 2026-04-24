using BookStore.API.Models;
using Microsoft.EntityFrameworkCore;

namespace BookStore.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Author> Authors { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Book> Books { get; set; }
        public DbSet<Voucher> Vouchers { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<BookImage> BookImages { get; set; }
        public DbSet<Publisher> Publishers { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Banner> Banners { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<ReviewReply> ReviewReplies { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Order>()
                .Property(o => o.PaymentMethod)
                .HasDefaultValue("COD");

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => new { u.Role, u.IsLocked });

            modelBuilder.Entity<User>()
                .HasIndex(u => u.CreatedAt);

            modelBuilder.Entity<Book>()
                .HasIndex(b => new { b.IsHidden, b.CategoryId });

            modelBuilder.Entity<Book>()
                .HasIndex(b => new { b.IsHidden, b.AuthorId });

            modelBuilder.Entity<Book>()
                .HasIndex(b => new { b.IsHidden, b.PublisherId });

            modelBuilder.Entity<Book>()
                .HasIndex(b => new { b.IsHidden, b.TargetAudience });

            modelBuilder.Entity<Book>()
                .HasIndex(b => new { b.IsHidden, b.CreatedAt });

            modelBuilder.Entity<Order>()
                .HasIndex(o => new { o.UserId, o.OrderDate });

            modelBuilder.Entity<Order>()
                .HasIndex(o => new { o.UserId, o.Status });

            modelBuilder.Entity<Order>()
                .HasIndex(o => new { o.Status, o.OrderDate });

            modelBuilder.Entity<Order>()
                .HasIndex(o => new { o.PaymentMethod, o.Status });

            modelBuilder.Entity<Order>()
                .HasIndex(o => o.AppliedVoucherCode);

            modelBuilder.Entity<Voucher>()
                .HasIndex(v => v.Code)
                .IsUnique();

            modelBuilder.Entity<Voucher>()
                .HasIndex(v => new { v.IsActive, v.IsHidden, v.StartDate, v.ExpirationDate });

            modelBuilder.Entity<Voucher>()
                .HasIndex(v => v.ApplicableCategoryId);

            modelBuilder.Entity<Cart>()
                .HasIndex(c => c.UserId)
                .IsUnique();

            modelBuilder.Entity<CartItem>()
                .HasIndex(ci => new { ci.CartId, ci.BookId })
                .IsUnique();

            modelBuilder.Entity<Review>()
                .HasIndex(r => new { r.BookId, r.UserId })
                .IsUnique();

            modelBuilder.Entity<Review>()
                .HasIndex(r => new { r.BookId, r.CreatedAt });

            modelBuilder.Entity<ReviewReply>()
                .HasIndex(rr => new { rr.ReviewId, rr.CreatedAt });

            modelBuilder.Entity<Banner>()
                .HasIndex(b => new { b.IsActive, b.DisplayOrder });
        }
    }
}
