using System.Threading.Tasks;

namespace BookStore.API.Repositories
{
    public interface IDashboardRepository
    {
        Task<object> GetDashboardDataAsync(int month, int year, int chartYear);
    }
}