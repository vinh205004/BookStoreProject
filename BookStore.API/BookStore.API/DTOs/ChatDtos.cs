using System;

namespace BookStore.API.DTOs
{
    public class ChatMessageDto
    {
        public string Role { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
    }

    public class ChatRequestDto
    {
        public string Message { get; set; } = string.Empty;
        public List<ChatMessageDto>? History { get; set; }
    }

    public class ChatResponseDto
    {
        public string Response { get; set; } = string.Empty;
    }
}
