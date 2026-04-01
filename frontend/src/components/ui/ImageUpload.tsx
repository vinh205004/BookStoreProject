import React, { useState } from 'react';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';

interface ImageUploadProps {
  imageUrl: string; // URL ảnh hiện tại
  onUploadSuccess: (url: string) => void; // Hàm callback trả URL về cho component cha
}

export default function ImageUpload({ imageUrl, onUploadSuccess }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(imageUrl); // Quản lý ảnh preview

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chỉ chọn file hình ảnh!');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dung lượng ảnh không được vượt quá 5MB!');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('file', file); // Gắn file vào form

      // GỌI THẲNG VÀO API CỦA BACKEND 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await axiosClient.post('/Uploads/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data' // Bắt buộc phải có khi gửi file
        }
      });

      const uploadedUrl = response.url; // Nhận URL do Backend trả về
      
      toast.success('Tải ảnh thành công!');
      setPreview(uploadedUrl);
      onUploadSuccess(uploadedUrl);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Upload Error:", error);
      toast.error(error.response?.data?.error || 'Lỗi khi tải ảnh lên server!');
      setPreview(imageUrl);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview('');
    onUploadSuccess('');
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">Hình ảnh đại diện</label>
      
      {preview ? (
        // Giao diện khi ĐÃ CÓ ảnh
        <div className="relative w-32 h-32 group border-2 border-slate-200 border-dashed rounded-xl p-1">
          <img src={preview} alt="Preview" className="w-full h-full rounded-lg object-cover" />
          
          {loading ? (
            // Lớp phủ khi đang upload
            <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
              <Loader2 className="animate-spin text-white" size={24} />
            </div>
          ) : (
            // Nút xóa ảnh
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 transition-colors shadow-md"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        // Giao diện khi CHƯA CÓ ảnh
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-all group p-4 text-center">
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <span className="text-sm font-medium text-slate-600">Đang tải lên...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <UploadCloud className="text-slate-400 group-hover:text-blue-500 transition-colors" size={32} />
              <span className="text-sm font-medium text-slate-700">Click để tải ảnh từ máy</span>
              <span className="text-xs text-slate-500">PNG, JPG, JPEG (Max 5MB)</span>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={loading} />
        </label>
      )}
    </div>
  );
}