using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BookStore.API.Models
{
    [Table("OrderItems")]
    public class OrderItem
    {
        [Key]
        public string OrderItemId { get; set; } = string.Empty;

        [Required]
        public string OrderId { get; set; } = string.Empty;
        [ForeignKey("OrderId")]
        public Order? Order { get; set; }

        [Required]
        public string BookId { get; set; } = string.Empty;
        [ForeignKey("BookId")]
        public Book? Book { get; set; }

        [Required]
        public int Quantity { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; } // Giá của cuốn sách tại thời điểm mua (để tránh đổi giá sau này làm sai lệch)
    }
}