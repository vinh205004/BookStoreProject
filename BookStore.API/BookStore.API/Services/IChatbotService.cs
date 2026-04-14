using BookStore.API.DTOs;
using System.Threading.Tasks;

namespace BookStore.API.Services
{
    public interface IChatbotService
    {
        Task<ChatResponseDto> GetChatResponseAsync(ChatRequestDto request);
    }
}
