using System;
using System.ComponentModel.DataAnnotations;

namespace BookStore.API.DTOs
{
    // DTO để trả thông tin User về cho Admin xem
    public class UserDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsLocked { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // DTO dùng khi Admin muốn đổi quyền (Cấp quyền Admin/Customer)
    public class UserRoleUpdateDto
    {
        [Required]
        public string Role { get; set; } = string.Empty;
    }
}