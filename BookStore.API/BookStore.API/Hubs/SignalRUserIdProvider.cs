using Microsoft.AspNetCore.SignalR;

namespace BookStore.API.Hubs
{
    public class SignalRUserIdProvider : IUserIdProvider
    {
        public string? GetUserId(HubConnectionContext connection)
        {
            return connection.User?.FindFirst("UserId")?.Value;
        }
    }
}
