import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ArchiveRestore, List } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import type { Category } from '../types';
import Modal from '../components/ui/Modal';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);

  // STATE ĐỂ CHUYỂN TAB (False = Danh sách chính, True = Thùng rác)
  const [showTrash, setShowTrash] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await axiosClient.get('/Categories');
      setCategories(data);
    } catch {
      toast.error('Lỗi khi tải danh sách danh mục!');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cat?: Category) => {
    if (cat) {
      setEditingId(cat.categoryId);
      setName(cat.name);
      setDescription(cat.description);
    } else {
      setEditingId(null);
      setName('');
      setDescription('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axiosClient.put(`/Categories/${editingId}`, { name, description, isActive: true });
        toast.success('Cập nhật thành công!');
      } else {
        await axiosClient.post('/Categories', { name, description });
        toast.success('Thêm mới thành công!');
      }
      setIsModalOpen(false);
      fetchCategories();
      setShowTrash(false); // Lưu xong thì tự động nhảy về tab Danh sách
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra!');
    }
  };

  // Nút Xóa mềm (Đẩy vào thùng rác)
  const handleDelete = async (id: number) => {
    if (window.confirm('Chuyển danh mục này vào thùng rác?')) {
      try {
        await axiosClient.delete(`/Categories/${id}`);
        toast.success('Đã chuyển vào thùng rác!');
        fetchCategories();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Không thể xóa!');
      }
    }
  };

  // MỚI: Nút Khôi phục từ thùng rác
  const handleRestore = async (id: number) => {
    if (window.confirm('Khôi phục lại danh mục này để sử dụng?')) {
      try {
        await axiosClient.put(`/Categories/${id}/restore`);
        toast.success('Khôi phục thành công!');
        fetchCategories();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
      } catch (error: any) {
        toast.error('Có lỗi khi khôi phục!');
      }
    }
  };

  // TÁCH DỮ LIỆU: Phân loại danh mục đang Hoạt động và danh mục trong Thùng rác
  const activeCategories = categories.filter(c => c.isActive);
  const trashCategories = categories.filter(c => !c.isActive);
  
  // Dữ liệu sẽ hiển thị trên bảng tùy thuộc vào Tab đang chọn
  const displayData = showTrash ? trashCategories : activeCategories;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      
      {/* HEADER & NÚT CHUYỂN TAB */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <div className="flex gap-4">
          <button 
            onClick={() => setShowTrash(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${!showTrash ? 'bg-orange-100 text-orange-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <List size={20} /> Danh sách hiện tại ({activeCategories.length})
          </button>
          
          <button 
            onClick={() => setShowTrash(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${showTrash ? 'bg-red-100 text-red-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Trash2 size={20} /> Thùng rác ({trashCategories.length})
          </button>
        </div>

        {/* Chỉ hiện nút Thêm mới ở tab Danh sách */}
        {!showTrash && (
          <button onClick={() => handleOpenModal()} className="bg-orange-500 hover:bg-orange-600 text-black px-4 py-2 rounded-lg font-medium flex items-center gap-2">
            <Plus size={20} /> Thêm mới
          </button>
        )}
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600 uppercase">
              <th className="p-4 font-semibold">Tên danh mục</th>
              <th className="p-4 font-semibold">Mô tả</th>
              <th className="p-4 font-semibold">Trạng thái</th>
              <th className="p-4 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {displayData.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">Trống.</td></tr>
            ) : (
              displayData.map((cat) => (
                <tr key={cat.categoryId} className="hover:bg-slate-50">
                  <td className="p-4 font-semibold">{cat.name}</td>
                  <td className="p-4">{cat.description}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {cat.isActive ? 'Hoạt động' : 'Đã xóa'}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center gap-3">
                    {!showTrash ? (
                      // Tab Danh Sách: Hiện nút Sửa và Nút Xóa (Đẩy vào thùng rác)
                      <>
                        <button onClick={() => handleOpenModal(cat)} className="text-orange-500 hover:text-orange-700"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(cat.categoryId)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                      </>
                    ) : (
                      // Tab Thùng rác: Hiện nút Khôi phục
                      <button 
                        onClick={() => handleRestore(cat.categoryId)} 
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-md text-sm font-medium transition-colors"
                      >
                        <ArchiveRestore size={16} /> Khôi phục
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL THÊM/SỬA */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên danh mục <span className="text-red-500">*</span></label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"></textarea>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg">Hủy</button>
            <button type="submit" className="px-4 py-2 text-black bg-orange-500 hover:bg-orange-600 rounded-lg">Lưu</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}