using System;
using System.ComponentModel.DataAnnotations;

namespace BookStore.API.DTOs
{
    public class VoucherDto
    {
        public int VoucherId { get; set; }
        public string Code { get; set; } = string.Empty;
        public decimal DiscountAmount { get; set; }
        public decimal MinOrderValue { get; set; }
        public DateTime ExpirationDate { get; set; }
        public bool IsActive { get; set; }
    }

    public class VoucherCreateDto
    {
        [Required(ErrorMessage = "Mã Voucher không được để trống")]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [Range(1, double.MaxValue, ErrorMessage = "Số tiền giảm phải lớn hơn 0")]
        public decimal DiscountAmount { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Giá trị đơn hàng tối thiểu không hợp lệ")]
        public decimal MinOrderValue { get; set; } = 0;

        [Required]
        public DateTime ExpirationDate { get; set; }
    }

    public class VoucherUpdateDto : VoucherCreateDto
    {
        public bool IsActive { get; set; }
    }
}