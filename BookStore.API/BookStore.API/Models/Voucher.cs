using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BookStore.API.Models
{
    [Table("Vouchers")]
    public class Voucher
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int VoucherId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty; // Mã nhập

        [MaxLength(20)]
        public string DiscountType { get; set; } = "Direct"; // "Direct" (VNĐ) hoặc "Percentage" (%)

        public decimal DiscountAmount { get; set; } // Số tiền hoặc phần trăm được giảm

        public decimal MinOrderValue { get; set; } // Đơn hàng tối thiểu

        public int Quantity { get; set; } // Số lượng mã phát hành

        public int UsedCount { get; set; } = 0; // Số lượt đã sử dụng

        public DateTime ExpirationDate { get; set; } // Ngày hết hạn

        public bool IsActive { get; set; } = true; // Trạng thái (Thùng rác)
    }
}