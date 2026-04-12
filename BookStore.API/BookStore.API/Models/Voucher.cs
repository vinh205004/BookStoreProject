using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BookStore.API.Models
{
    [Table("Vouchers")]
    public class Voucher
    {
        [Key]
        public string VoucherId { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty; // Mã nhập

        [MaxLength(20)]
        public string DiscountType { get; set; } = "Direct"; // "Direct" (VNĐ) hoặc "Percentage" (%)

        public decimal DiscountAmount { get; set; } // Số tiền hoặc phần trăm được giảm

        public decimal MinOrderValue { get; set; } // Đơn hàng tối thiểu

        public int Quantity { get; set; } // Số lượng mã phát hành

        public int UsedCount { get; set; } = 0; // Số lượt đã sử dụng

        public DateTime StartDate { get; set; } // Ngày bắt đầu

        public DateTime ExpirationDate { get; set; } // Ngày hết hạn

        public string? ApplicableCategoryId { get; set; } // Mã danh mục áp dụng (null nếu áp dụng toàn sàn)

        public string? ApplicableProductId { get; set; } // Mã sản phẩm áp dụng (null nếu áp dụng toàn sàn)

        public bool IsActive { get; set; } = true; // Trạng thái (Thùng rác)
    }
}