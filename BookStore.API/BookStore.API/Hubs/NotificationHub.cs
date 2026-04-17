using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using BookStore.API.Data;

namespace BookStore.API.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        private readonly AppDbContext _context;
        private readonly ILogger<NotificationHub> _logger;

        public NotificationHub(AppDbContext context, ILogger<NotificationHub> logger)
        {
            _context = context;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            if (await IsAdminAsync())
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");
                _logger.LogInformation("Admin realtime connected: {ConnectionId}", Context.ConnectionId);
            }

            await base.OnConnectedAsync();
        }

        public async Task<bool> JoinAdminGroup()
        {
            if (!await IsAdminAsync())
                return false;

            await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");
            _logger.LogInformation("Admin realtime group joined: {ConnectionId}", Context.ConnectionId);
            return true;
        }

        private async Task<bool> IsAdminAsync()
        {
            var user = Context.User;
            if (user == null)
                return false;

            if (user.IsInRole("Admin"))
                return true;

            if (user.Claims.Any(claim =>
                (claim.Type == ClaimTypes.Role ||
                 claim.Type == "role" ||
                 claim.Type == "Role" ||
                 claim.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role") &&
                string.Equals(claim.Value, "Admin", StringComparison.OrdinalIgnoreCase)))
            {
                return true;
            }

            var userId = user.FindFirst("UserId")?.Value;
            if (string.IsNullOrWhiteSpace(userId))
                return false;

            return await _context.Users
                .AsNoTracking()
                .AnyAsync(u => u.UserId == userId && u.Role == "Admin" && !u.IsLocked);
        }
    }
}
