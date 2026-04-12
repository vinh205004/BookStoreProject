using System.Threading.Tasks;

namespace BookStore.API.Services
{
    public interface IDashboardService
    {
        Task<object> GetDashboardDataAsync(int month, int year, int chartYear);
    }
}