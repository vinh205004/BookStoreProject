import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import type { Banner, Category } from '../types';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import ImageUpload from '../components/ui/ImageUpload';

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchBanners = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await axiosClient.get('/Banners?onlyActive=false');
      setBanners(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) { if(error.response && error.response.status === 400 && typeof error.response.data === 'string') { toast.error(error.response.data); return; }
      toast.error('Lỗi khi tải danh sách banner!');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBanners();

    const fetchCategories = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = await axiosClient.get('/Categories');
        setCategories(response.filter((c: Category) => c.isActive));
      } catch (err) {
        console.error('Lỗi lấy danh mục', err);
      }
    };
    fetchCategories();
  }, [fetchBanners]);

  const handleOpenModal = (b?: Banner) => {
    if (b) {
      setEditingId(b.bannerId);
      setImageUrl(b.imageUrl);
      setTitle(b.title);
      setSubtitle(b.subtitle || '');
      setLinkUrl(b.linkUrl || '');
      setIsActive(b.isActive);
      setDisplayOrder(b.displayOrder);
    } else {
      setEditingId(null);
      setImageUrl('');
      setTitle('');
      setSubtitle('');
      setLinkUrl('');
      setIsActive(true);
      // Auto-increment display order for new banners
      const nextOrder = banners.length > 0 ? Math.max(...banners.map(x => x.displayOrder)) + 1 : 1;
      setDisplayOrder(nextOrder);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      toast.error('Vui lòng upload ảnh banner!');
      return;
    }
    try {
      const payload = { title, subtitle, linkUrl, imageUrl, isActive, displayOrder };
      if (editingId) {
        await axiosClient.put(`/Banners/${editingId}`, payload);
        toast.success('Cập nhật banner thành công!');
      } else {
        await axiosClient.post('/Banners', payload);
        toast.success('Thêm banner thành công!');
      }
      setIsModalOpen(false);
      fetchBanners();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) { if(error.response && error.response.status === 400 && typeof error.response.data === 'string') { toast.error(error.response.data); return; }
      toast.error('Có lỗi xảy ra!');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa banner này?')) return;
    try {
      await axiosClient.delete(`/Banners/${id}`);
      toast.success('Đã xóa banner!');
      fetchBanners();
    } catch {
      toast.error('Lỗi khi xóa banner!');
    }
  };

  const handleToggleActive = async (b: Banner) => {
    try {
      await axiosClient.put(`/Banners/${b.bannerId}`, { ...b, isActive: !b.isActive });
      fetchBanners();
      toast.success(b.isActive ? 'Đã ẩn banner!' : 'Đã hiện banner!');
    } catch {
      toast.error('Lỗi khi cập nhật trạng thái!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quản lý Banner</h2>
        <Button onClick={() => handleOpenModal()} icon={<Plus size={20} />}>
          Thêm Banner
        </Button>
      </div>

      <div className="bg-white rounded-none shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-4 font-semibold">Hình ảnh</th>
                <th className="p-4 font-semibold">Tiêu đề / Phụ đề</th>
                <th className="p-4 font-semibold">Liên kết URL</th>
                <th className="p-4 font-semibold text-center">Thứ tự</th>
                <th className="p-4 font-semibold">Trạng thái</th>
                <th className="p-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {banners.map((b) => (
                <tr key={b.bannerId} className="hover:bg-gray-50">
                  <td className="p-4">
                    <img src={b.imageUrl} alt="Banner" className="h-16 w-32 object-cover rounded-none shadow-sm border" />
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-800">{b.title}</div>
                    <div className="text-sm text-gray-500">{b.subtitle}</div>
                  </td>
                  <td className="p-4">
                    {(() => {
                      if (!b.linkUrl) return <span className="text-sm text-gray-500">Không có</span>;
                      const catId = b.linkUrl.match(/categoryId=([^&]+)/)?.[1];
                      const matchedCat = catId ? categories.find(c => c.categoryId === catId) : null;
                      return (
                        <div className="flex flex-col">
                          {matchedCat && <span className="font-semibold text-sm text-gray-800">{matchedCat.name}</span>}
                          <a href={b.linkUrl} target="_blank" rel="noreferrer" className={`text-orange-500 hover:underline ${matchedCat ? 'text-xs text-blue-400 mt-0.5' : 'text-sm'}`}>
                            {b.linkUrl}
                          </a>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="p-4 text-center font-semibold text-gray-600">{b.displayOrder}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-none text-xs font-medium ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {b.isActive ? 'Đang hiển thị' : 'Đang ẩn'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => handleToggleActive(b)} className="p-2 bg-yellow-100 text-yellow-600 hover:bg-yellow-200 rounded-none transition" title="Đổi trạng thái">
                      <Eye size={18} className={b.isActive ? '' : 'opacity-50'} />
                    </button>
                    <button onClick={() => handleOpenModal(b)} className="p-2 bg-orange-100 text-orange-600 hover:bg-blue-200 rounded-none transition" title="Sửa">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(b.bannerId)} className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-none transition" title="Xóa">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {banners.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Chưa có banner nào được khởi tạo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Sửa banner' : 'Thêm banner'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh Banner (Nên dùng ảnh ngang) *</label>
            <ImageUpload imageUrl={imageUrl} onUploadSuccess={(url) => setImageUrl(url)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề chính *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full p-2 border rounded-none focus:ring-2 focus:ring-orange-500" placeholder="Ví dụ: Khuyến mãi tết..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phụ đề (Slogan)</label>
            <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full p-2 border rounded-none focus:ring-2 focus:ring-orange-500" placeholder="Nhập dòng chữ nhỏ bên dưới..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đường dẫn liên kết (Danh mục / Link URL)</label>
            <div className="flex gap-2 items-center">
              <select
                className="p-2 border rounded-none focus:ring-2 focus:ring-orange-500 min-w-[200px]"
                value={linkUrl.startsWith('/products?categoryId=') ? linkUrl.replace('/products?categoryId=', '') : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setLinkUrl(`/products?categoryId=${e.target.value}`);
                  } else {
                    setLinkUrl('');
                  }
                }}
              >
                <option value="">-- Chọn danh mục (Tùy chọn) --</option>
                {categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input 
                type="text" 
                value={linkUrl} 
                onChange={(e) => setLinkUrl(e.target.value)} 
                className="w-full p-2 border rounded-none focus:ring-2 focus:ring-orange-500" 
                placeholder="Hoặc tự điền Link tuỳ chỉnh (Ví dụ: /products)" 
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Chọn một danh mục hoặc nhập link thủ công.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự hiển thị</label>
              <select 
                value={displayOrder} 
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)} 
                className="w-full p-2 border rounded-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                {Array.from({ length: editingId ? Math.max(banners.length, displayOrder) : Math.max(banners.length + 1, displayOrder) }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>Vị trí thứ {num}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center mt-6">
              <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="mr-2 w-4 h-4 text-orange-500 rounded-none focus:ring-orange-500 cursor-pointer" />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">Hiển thị (Kích hoạt)</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="submit">{editingId ? 'Lưu thay đổi' : 'Thêm mới'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

