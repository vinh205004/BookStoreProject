using BookStore.API.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BookStore.API.Repositories
{
    public interface IReviewRepository
    {
        Task<IEnumerable<Review>> GetReviewsByBookIdAsync(string bookId);
        Task<Review?> GetReviewByIdAsync(string id);
        Task<Review> AddReviewAsync(Review review);
        Task UpdateReviewAsync(Review review);
        Task DeleteReviewAsync(Review review);
        Task<bool> ReviewExistsAsync(string bookId, string userId);
        Task<bool> HasUserPurchasedBookAsync(string bookId, string userId);
    }
}
