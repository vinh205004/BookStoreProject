using BookStore.API.DTOs;

namespace BookStore.API.Services
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetAllUsersAsync();
        Task<UserDto?> GetUserByIdAsync(int id);
        Task<bool> ToggleLockUserAsync(int id); // Đảo trạng thái khóa/mở khóa
        Task<bool> ChangeUserRoleAsync(int id, UserRoleUpdateDto dto); // Cấp quyền
    }
}