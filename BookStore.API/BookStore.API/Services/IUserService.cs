using BookStore.API.DTOs;

namespace BookStore.API.Services
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetAllUsersAsync();
        Task<UserDto?> GetUserByIdAsync(string id);
        Task<bool> ToggleLockUserAsync(string id, string currentUserId); // Đảo trạng thái khóa/mở khóa
        Task<bool> ChangeUserRoleAsync(string id, UserRoleUpdateDto dto, string currentUserId); // Cấp quyền
    }
}