using BookStore.API.Repositories;
using System.Threading.Tasks;

namespace BookStore.API.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly IDashboardRepository _dashboardRepository;

        public DashboardService(IDashboardRepository dashboardRepository)
        {
            _dashboardRepository = dashboardRepository;
        }

        public async Task<object> GetDashboardDataAsync(int month, int year, int chartYear)
        {
            return await _dashboardRepository.GetDashboardDataAsync(month, year, chartYear);
        }
    }
}