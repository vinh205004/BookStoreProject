using BookStore.API.Models;
using BookStore.API.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BookStore.API.Services
{
    public class BannerService : IBannerService
    {
        private readonly IBannerRepository _bannerRepo;

        public BannerService(IBannerRepository bannerRepo)
        {
            _bannerRepo = bannerRepo;
        }

        public Task<IEnumerable<Banner>> GetAllBannersAsync(bool onlyActive) =>
            _bannerRepo.GetAllBannersAsync(onlyActive);

        public Task<Banner?> GetBannerByIdAsync(string id) =>
            _bannerRepo.GetBannerByIdAsync(id);

        public async Task<Banner> CreateBannerAsync(Banner banner)
        {
            if (banner.IsActive)
            {
                int activeCount = await _bannerRepo.CountActiveBannersAsync();
                if (activeCount >= 5)
                {
                    throw new InvalidOperationException("Đã đạt số lượng tối đa 5 banner hoạt động. Vui lòng tắt một vài banner trước khi thêm mới.");
                }
            }

            if (string.IsNullOrEmpty(banner.BannerId))
                banner.BannerId = Guid.NewGuid().ToString();
            banner.CreatedAt = DateTime.UtcNow;
            
            await ReorderBannersOnSaveAsync(banner, isNew: true);

            return await _bannerRepo.AddBannerAsync(banner);
        }

        public async Task<Banner> UpdateBannerAsync(string id, Banner banner)
        {
            var existing = await _bannerRepo.GetBannerByIdAsync(id);
            if (existing == null) throw new KeyNotFoundException("Banner not found");

            if (banner.IsActive)
            {
                int activeCount = await _bannerRepo.CountActiveBannersAsync(id);
                if (activeCount >= 5)
                {
                    throw new InvalidOperationException("Đã đạt số lượng tối đa 5 banner hoạt động. Không thể kích hoạt thêm.");
                }
            }
            
            bool orderChanged = existing.DisplayOrder != banner.DisplayOrder;
            
            existing.Title = banner.Title;
            existing.Subtitle = banner.Subtitle;
            existing.ImageUrl = banner.ImageUrl;
            existing.LinkUrl = banner.LinkUrl;
            existing.IsActive = banner.IsActive;
            
            if (orderChanged) {
                existing.DisplayOrder = banner.DisplayOrder;
                await ReorderBannersOnSaveAsync(existing, isNew: false);
            }
            
            await _bannerRepo.UpdateBannerAsync(existing);
            return existing;
        }

        public async Task DeleteBannerAsync(string id)
        {
            var banner = await _bannerRepo.GetBannerByIdAsync(id);
            if (banner != null) {
                await _bannerRepo.DeleteBannerAsync(id);
                // Shift remaining down
                var allBanners = (await _bannerRepo.GetAllBannersAsync(false)).Where(b => b.BannerId != id).OrderBy(b => b.DisplayOrder).ToList();
                bool needUpdate = false;
                for (int i = 0; i < allBanners.Count; i++) {
                    if (allBanners[i].DisplayOrder != i + 1) {
                        allBanners[i].DisplayOrder = i + 1;
                        needUpdate = true;
                    }
                }
                if (needUpdate) {
                    await _bannerRepo.UpdateBannersAsync(allBanners);
                }
            }
        }
        
        private async Task ReorderBannersOnSaveAsync(Banner targetBanner, bool isNew)
        {
            var allBanners = (await _bannerRepo.GetAllBannersAsync(false))
                             .Where(b => b.BannerId != targetBanner.BannerId)
                             .OrderBy(b => b.DisplayOrder)
                             .ToList();
                             
            targetBanner.DisplayOrder = Math.Max(1, targetBanner.DisplayOrder);
            targetBanner.DisplayOrder = Math.Min(allBanners.Count + 1, targetBanner.DisplayOrder);
            
            allBanners.Insert(targetBanner.DisplayOrder - 1, targetBanner);
            
            var toUpdate = new List<Banner>();
            for (int i = 0; i < allBanners.Count; i++)
            {
                if (allBanners[i].DisplayOrder != i + 1)
                {
                    allBanners[i].DisplayOrder = i + 1;
                    if (allBanners[i].BannerId != targetBanner.BannerId) 
                    {
                        toUpdate.Add(allBanners[i]);
                    }
                }
            }
            
            if (toUpdate.Any())
            {
                await _bannerRepo.UpdateBannersAsync(toUpdate);
            }
        }
    }
}
