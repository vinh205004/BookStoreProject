using System;
using System.ComponentModel.DataAnnotations;

namespace BookStore.API.DTOs
{
    public class VoucherDto
    {
        public string VoucherId { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string DiscountType { get; set; } = "Direct"; // "Direct" hoặc "Percentage"
        public decimal DiscountAmount { get; set; }
        public decimal MinOrderValue { get; set; }
        public int Quantity { get; set; }
        public int UsedCount { get; set; }
        public DateTime ExpirationDate { get; set; }
        public bool IsActive { get; set; }
    }

    public class VoucherCreateDto
    {
        [Required(ErrorMessage = "Mã Voucher không được để trống")]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "Loại giảm giá không được để trống")]
        [MaxLength(20)]
        public string DiscountType { get; set; } = "Direct";

        [Required]
        [Range(1, 1000000000, ErrorMessage = "Mức giảm phải lớn hơn 0")]
        public decimal DiscountAmount { get; set; }

        [Range(0, 1000000000, ErrorMessage = "Giá trị đơn hàng tối thiểu không hợp lệ")]
        public decimal MinOrderValue { get; set; } = 0;

        [Required]
        [Range(1, 10000000, ErrorMessage = "Số lượng phải lớn hơn 0")]
        public int Quantity { get; set; }

        [Required]
        public DateTime ExpirationDate { get; set; }
    }

    public class VoucherUpdateDto : VoucherCreateDto
    {
        public bool IsActive { get; set; }
    }
}