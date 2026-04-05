import React, { useState } from 'react';
import { X, Loader2, ImagePlus } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';

interface MultiImageUploadProps {
  currentImages: string[]; // Danh sách URL ảnh hiện tại
  onUploadSuccess: (urls: string[]) => void; // Trả về danh sách URL mới sau khi upload/xóa
}

export default function MultiImageUpload({ currentImages, onUploadSuccess }: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>(currentImages); // Quản lý danh sách ảnh trong component

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [...images]; // Sao chép danh sách ảnh cũ

    try {
      // Vì Cloudinary/Backend chỉ nhận 1 file cho mỗi request, ta phải chạy vòng lặp
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 1. Kiểm tra (Chỉ nhận ảnh < 5MB)
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 5 * 1024 * 1024) {
          toast.warning(`Bỏ qua file ${file.name} vì dung lượng > 5MB!`);
          continue;
        }

        // 2. Upload file lên Backend của mình
        const formData = new FormData();
        formData.append('file', file);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = await axiosClient.post('/Uploads/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        // 3. Thêm URL mới vào mảng
        uploadedUrls.push(response.url);
      }

      toast.success(`Tải lên thành công ${files.length} ảnh!`);
      setImages(uploadedUrls); // Cập nhật danh sách ảnh preview
      onUploadSuccess(uploadedUrls); // Trả về danh sách mới cho component cha (VD: Books.tsx)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error('Có lỗi xảy ra trong quá trình tải một số file!');
    } finally {
      setUploading(false);
      // Reset input file để có thể chọn lại file vừa chọn
      e.target.value = ''; 
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const newImages = images.filter((_, index) => index !== indexToRemove);
    setImages(newImages);
    onUploadSuccess(newImages); // Trả về danh sách mới sau khi xóa
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">Bộ sưu tập hình ảnh sách</label>
      
      {/* KHU VỰC PREVIEW ẢNH (GALLERY) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((url, index) => (
          <div key={index} className="relative group border border-slate-200 rounded-xl p-1 bg-slate-50 transition-all hover:border-slate-300">
            <img src={url} alt={`Preview ${index + 1}`} className="w-full h-24 rounded-lg object-cover" />
            
            {/* Nút xóa ảnh đại diện */}
            <button
              type="button"
              onClick={() => handleRemoveImage(index)}
              className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 shadow-md transition-all opacity-0 group-hover:opacity-100"
              title="Xóa ảnh"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        
        {/* NÚT BẤM THÊM ẢNH (CHỈ HIỆN KHI KHÔNG ĐANG UPLOAD) */}
        {!uploading && (
          <label className="flex flex-col items-center justify-center h-24 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-100 hover:border-blue-400 hover:bg-slate-200 transition-all text-center p-3 text-slate-500 hover:text-blue-600">
            <ImagePlus size={24} />
            <span className="text-xs font-medium mt-1">Thêm ảnh</span>
            <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
          </label>
        )}
        
        {/* LỚP PHỦ KHI ĐANG UPLOAD */}
        {uploading && (
          <div className="flex flex-col items-center justify-center h-24 border-2 border-slate-300 border-dashed rounded-xl bg-slate-100 text-slate-500 p-3">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-xs font-medium mt-1">Đang tải...</span>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 italic">Hỗ trợ chọn nhiều file PNG, JPG, JPEG (Max 5MB/ảnh).</p>
    </div>
  );
}