import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Eye, MonitorPlay } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import type { Banner, Category } from '../types';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import ImageUpload from '../components/ui/ImageUpload';
import Pagination from '../components/Pagination';
import SortableHeader, { type SortDirection } from '../components/SortableHeader';

const ITEMS_PER_PAGE = 10;

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
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

  const sortedBanners = [...banners].sort((a, b) => {
    return sortDirection === 'asc'
      ? a.displayOrder - b.displayOrder
      : b.displayOrder - a.displayOrder;
  });
  const totalPages = Math.ceil(sortedBanners.length / ITEMS_PER_PAGE);
  const paginatedBanners = sortedBanners.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [banners.length]);

  return (
    <div className="bg-white shadow-sm p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-100 pb-4 gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
          <MonitorPlay className="text-orange-500 flex-shrink-0" size={24} /> 
          <span>Quản lý Banner</span>
        </h2>
        <Button onClick={() => handleOpenModal()} icon={<Plus size={20} />}>
          Thêm Banner
        </Button>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs sm:text-sm text-slate-600 uppercase">
              <th className="p-3 sm:p-4 font-semibold">Hình ảnh</th>
              <th className="p-3 sm:p-4 font-semibold">Tiêu đề / Phụ đề</th>
              <th className="p-3 sm:p-4 font-semibold">Liên kết URL</th>
              <SortableHeader
                active
                direction={sortDirection}
                onClick={() => {
                  setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
                  setCurrentPage(1);
                }}
                className="text-center"
              >
                Thứ tự
              </SortableHeader>
              <th className="p-3 sm:p-4 font-semibold text-center">Trạng thái</th>
              <th className="p-3 sm:p-4 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
              {banners.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Trống.</td></tr>
              ) : (
                paginatedBanners.map((b) => (
                  <tr key={b.bannerId} className="hover:bg-slate-50">
                    <td className="p-3 sm:p-4">
                      <img src={b.imageUrl} alt="Banner" className="h-14 w-28 sm:h-16 sm:w-32 object-cover shadow-sm border" />
                    </td>
                    <td className="p-3 sm:p-4 text-xs sm:text-base">
                      <div className="font-semibold text-slate-900">{b.title}</div>
                      <div className="text-xs sm:text-sm text-slate-500">{b.subtitle}</div>
                    </td>
                    <td className="p-3 sm:p-4 text-xs sm:text-base">
                      {(() => {
                        if (!b.linkUrl) return <span className="text-slate-500">Không có</span>;
                        const catId = b.linkUrl.match(/categoryId=([^&]+)/)?.[1];
                        const matchedCat = catId ? categories.find(c => c.categoryId === catId) : null;
                        return (
                          <div className="flex flex-col">
                            {matchedCat && <span className="font-semibold text-slate-800">{matchedCat.name}</span>}
                            <a href={b.linkUrl} target="_blank" rel="noreferrer" className={`text-orange-500 hover:underline ${matchedCat ? 'text-xs text-blue-400 mt-0.5' : ''}`}>
                              {b.linkUrl}
                            </a>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-3 sm:p-4 text-center font-semibold text-slate-600 text-xs sm:text-base">{b.displayOrder}</td>
                    <td className="p-3 sm:p-4 text-center">
                      <span className={`px-2 sm:px-3 py-1 text-xs font-bold inline-block whitespace-nowrap ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {b.isActive ? 'Đang hiển thị' : 'Đang ẩn'}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 flex justify-center gap-2 sm:gap-3">
                      <button onClick={() => handleToggleActive(b)} className={`p-1 ${b.isActive ? 'text-green-600 hover:text-green-800' : 'text-slate-400 hover:text-slate-600'}`} title="Đổi trạng thái">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => handleOpenModal(b)} className="text-orange-500 hover:text-orange-700 p-1" title="Sửa">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(b.bannerId)} className="text-red-500 hover:text-red-700 p-1" title="Xóa">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

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

