import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, ArchiveRestore, List, Search, Layers } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import type { Category } from '../types';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // STATE ĐỂ CHUYỂN TAB (False = Danh sách chính, True = Thùng rác)
  const [showTrash, setShowTrash] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await axiosClient.get('/Categories');
      setCategories(data);
    } catch {
      toast.error('Lỗi khi tải danh sách danh mục!');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
  }, [fetchCategories]);

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
  const handleDelete = async (id: string) => {
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
  const handleRestore = async (id: string) => {
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
  
  // TÌM KIẾM
  const filteredActive = activeCategories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTrash = trashCategories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Dữ liệu sẽ hiển thị trên bảng tùy thuộc vào Tab đang chọn
  const displayData = showTrash ? filteredTrash : filteredActive;

  return (
    <div className="bg-white shadow-sm p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-100 pb-4 gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
          <Layers className="text-orange-500 flex-shrink-0" size={24} /> 
          <span>Quản lý Danh mục</span>
        </h2>
      </div>

      {/* TÌM KIẾM */}
      <div className="mb-6 flex gap-2">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên hoặc mô tả..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-slate-300 px-4 py-2 pl-10 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
          />
        </div>
      </div>
      
      {/* HEADER & NÚT CHUYỂN TAB */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-100 pb-4 gap-3">
        <div className="flex gap-2 sm:gap-4 overflow-x-auto w-full sm:w-auto">
          <button 
            onClick={() => setShowTrash(false)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${!showTrash ? 'bg-orange-100 text-orange-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <List size={18} /> Danh sách ({activeCategories.length})
          </button>
          
          <button 
            onClick={() => setShowTrash(true)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${showTrash ? 'bg-red-100 text-red-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Trash2 size={18} /> Thùng rác ({trashCategories.length})
          </button>
        </div>

        {/* Chỉ hiện nút Thêm mới ở tab Danh sách */}
        {!showTrash && (
          <Button icon={<Plus size={20} />} onClick={() => handleOpenModal()}>
            Thêm mới
          </Button>
        )}
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs sm:text-sm text-slate-600 uppercase">
              <th className="p-3 sm:p-4 font-semibold">Tên danh mục</th>
              <th className="p-3 sm:p-4 font-semibold hidden sm:table-cell">Mô tả</th>
              <th className="p-3 sm:p-4 font-semibold">Trạng thái</th>
              <th className="p-3 sm:p-4 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {displayData.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">Trống.</td></tr>
            ) : (
              displayData.map((cat) => (
                <tr key={cat.categoryId} className="hover:bg-slate-50">
                  <td className="p-3 sm:p-4 font-semibold text-xs sm:text-base">{cat.name}</td>
                  <td className="p-3 sm:p-4 hidden sm:table-cell text-xs sm:text-base">{cat.description}</td>
                  <td className="p-3 sm:p-4">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold inline-block ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {cat.isActive ? 'Hoạt động' : 'Đã xóa'}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 flex justify-center gap-2 sm:gap-3">
                    {!showTrash ? (
                      // Tab Danh Sách: Hiện nút Sửa và Nút Xóa (Đẩy vào thùng rác)
                      <>
                        <button onClick={() => handleOpenModal(cat)} className="text-orange-500 hover:text-orange-700 p-1" title="Sửa"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(cat.categoryId)} className="text-red-500 hover:text-red-700 p-1" title="Xóa"><Trash2 size={18} /></button>
                      </>
                    ) : (
                      // Tab Thùng rác: Hiện nút Khôi phục
                      <Button 
                        variant="success"
                        size="sm"
                        icon={<ArchiveRestore size={16} />}
                        onClick={() => handleRestore(cat.categoryId)}
                      >
                        Khôi phục
                      </Button>
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
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"></textarea>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="submit" variant="primary">Lưu</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}