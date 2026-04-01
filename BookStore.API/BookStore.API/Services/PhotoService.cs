using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace BookStore.API.Services
{
    public class PhotoService
    {
        private readonly Cloudinary _cloudinary;

        public PhotoService(IConfiguration config)
        {
            // Lấy thông tin bảo mật từ appsettings.json
            var account = new Account(
                config["CloudinarySettings:CloudName"],
                config["CloudinarySettings:ApiKey"],
                config["CloudinarySettings:ApiSecret"]
            );
            _cloudinary = new Cloudinary(account);
        }

        public async Task<string> UploadImageAsync(IFormFile file)
        {
            if (file.Length > 0)
            {
                using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = "TienTho_BookStore", // Ảnh sẽ được vào thư mục trên Cloudinary
                    Transformation = new Transformation().Quality("auto").FetchFormat("auto") // Tự động nén ảnh để web chạy mượt
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                if (uploadResult.Error != null)
                {
                    throw new Exception(uploadResult.Error.Message);
                }

                return uploadResult.SecureUrl.ToString();
            }
            throw new Exception("File không hợp lệ hoặc trống rỗng.");
        }
    }
}