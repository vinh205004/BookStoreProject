using BookStore.API.DTOs;
using BookStore.API.Repositories;

namespace BookStore.API.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _repo;

        public UserService(IUserRepository repo) => _repo = repo;

        public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
        {
            var users = await _repo.GetAllAsync();
            return users.Select(u => new UserDto
            {
                UserId = u.UserId,
                Username = u.Username,
                FullName = u.FullName,
                Email = u.Email,
                PhoneNumber = u.PhoneNumber,
                Address = u.Address,
                Role = u.Role,
                IsLocked = u.IsLocked,
                CreatedAt = u.CreatedAt
            });
        }

        public async Task<UserDto?> GetUserByIdAsync(string id)
        {
            var u = await _repo.GetByIdAsync(id);
            if (u == null) return null;

            return new UserDto
            {
                UserId = u.UserId,
                Username = u.Username,
                FullName = u.FullName,
                Email = u.Email,
                PhoneNumber = u.PhoneNumber,
                Address = u.Address,
                Role = u.Role,
                IsLocked = u.IsLocked,
                CreatedAt = u.CreatedAt
            };
        }

        public async Task<bool> ToggleLockUserAsync(string id, string currentUserId)
        {
            // Không cho phép admin khóa/mở khóa chính mình
            if (id == currentUserId)
                throw new Exception("Bạn không thể khóa/mở khóa tài khoản của chính mình!");

            var user = await _repo.GetByIdAsync(id);
            if (user == null) return false;

            // Đảo ngược trạng thái
            user.IsLocked = !user.IsLocked;

            await _repo.UpdateAsync(user);
            return true;
        }

        public async Task<bool> ChangeUserRoleAsync(string id, UserRoleUpdateDto dto, string currentUserId)
        {
            // Không cho phép admin thay đổi quyền của chính mình
            if (id == currentUserId)
                throw new Exception("Bạn không thể thay đổi quyền của chính mình!");

            var user = await _repo.GetByIdAsync(id);
            if (user == null) return false;

            // Chỉ cho phép 2 quyền chuẩn này
            if (dto.Role != "Admin" && dto.Role != "Customer")
                throw new Exception("Quyền (Role) không hợp lệ! Chỉ chấp nhận 'Admin' hoặc 'Customer'.");

            user.Role = dto.Role;
            await _repo.UpdateAsync(user);
            return true;
        }
    }
}