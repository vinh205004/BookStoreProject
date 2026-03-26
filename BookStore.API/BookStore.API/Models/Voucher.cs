using System;
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
        public string Code { get; set; } = string.Empty; // Mã nhập (VD: TIENTHO50K)

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal DiscountAmount { get; set; } // Số tiền được giảm

        [Column(TypeName = "decimal(18,2)")]
        public decimal MinOrderValue { get; set; } = 0; // Đơn hàng tối thiểu để áp dụng

        [Required]
        public DateTime ExpirationDate { get; set; } // Hạn sử dụng

        public bool IsActive { get; set; } = true; // Trạng thái voucher (Admin có thể tắt sớm)
    }
}