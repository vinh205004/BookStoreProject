using BookStore.API.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BookStore.API.Services
{
    public interface IReviewService
    {
        Task<IEnumerable<ReviewDto>> GetReviewsByBookIdAsync(string bookId);
        Task<ReviewDto?> GetReviewByIdAsync(string id);
        Task<ReviewDto> AddReviewAsync(CreateReviewDto dto, string userId);
        Task<bool> UpdateReviewAsync(string id, CreateReviewDto dto, string userId, bool isAdmin);
        Task<bool> DeleteReviewAsync(string id, string userId, bool isAdmin);
        Task<bool> CanReviewAsync(string bookId, string userId);
    }
}
