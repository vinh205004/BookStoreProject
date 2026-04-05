import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, ArchiveRestore, List, Building2, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import type { Publisher } from '../types';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

export default function Publishers() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTrash, setShowTrash] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const fetchPublishers = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await axiosClient.get('/Publishers');
      setPublishers(data);
    } catch {
      toast.error('Lỗi khi tải danh sách nhà xuất bản!');
    }
  }, []);

  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPublishers(); 
  }, [fetchPublishers]);

  const handleOpenModal = (pub?: Publisher) => {
    if (pub) {
      setEditingId(pub.publisherId);
      setName(pub.name);
      setDescription(pub.description);
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
        await axiosClient.put(`/Publishers/${editingId}`, { name, description, isActive: true });
        toast.success('Cập nhật thành công!');
      } else {
        await axiosClient.post('/Publishers', { name, description });
        toast.success('Thêm mới thành công!');
      }
      setIsModalOpen(false);
      fetchPublishers();
      setShowTrash(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || error?.message || 'Có lỗi xảy ra!';
      toast.error(errorMsg);
      console.error('Publisher submit error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Chuyển NXB này vào thùng rác?')) {
      try {
        await axiosClient.delete(`/Publishers/${id}`);
        toast.success('Đã chuyển vào thùng rác!');
        fetchPublishers();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        const errorMsg = error?.response?.data?.error || error?.message || 'Không thể xóa NXB này!';
        toast.error(errorMsg);
        console.error('Publisher delete error:', error);
      }
    }
  };

  const handleRestore = async (id: string) => {
    if (window.confirm('Khôi phục lại NXB này?')) {
      try {
        await axiosClient.put(`/Publishers/${id}/restore`);
        toast.success('Khôi phục thành công!');
        fetchPublishers();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
      } catch (error: any) {
        toast.error('Có lỗi khi khôi phục!');
      }
    }
  };

  const activePublishers = publishers.filter(p => p.isActive);
  const trashPublishers = publishers.filter(p => !p.isActive);
  
  // TÌM KIẾM
  const filteredActive = activePublishers.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTrash = trashPublishers.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const displayData = showTrash ? filteredTrash : filteredActive;

  return (
    <div className="bg-white shadow-sm p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-100 pb-4 gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
          <Building2 className="text-orange-500 flex-shrink-0" size={24} /> Quản lý Nhà xuất bản
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
            className="w-full border border-slate-300 px-4 py-2 pl-10 focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-100 pb-4 gap-3">
        <div className="flex gap-2 sm:gap-4 overflow-x-auto w-full sm:w-auto">
          <button onClick={() => setShowTrash(false)} className={`flex items-center gap-2 px-3 sm:px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${!showTrash ? 'bg-orange-100 text-orange-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <List size={20} /> Đang hợp tác ({activePublishers.length})
          </button>
          <button onClick={() => setShowTrash(true)} className={`flex items-center gap-2 px-3 sm:px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${showTrash ? 'bg-red-100 text-red-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Trash2 size={20} /> Đã ngừng hợp tác ({trashPublishers.length})
          </button>
        </div>
        {!showTrash && (
          <Button icon={<Plus size={20} />} onClick={() => handleOpenModal()}>Thêm NXB</Button>
        )}
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs sm:text-sm text-slate-600 uppercase">
              <th className="p-3 sm:p-4 font-semibold">Tên NXB</th>
              <th className="p-3 sm:p-4 font-semibold hidden sm:table-cell">Thông tin liên hệ / Mô tả</th>
              <th className="p-3 sm:p-4 font-semibold">Trạng thái</th>
              <th className="p-3 sm:p-4 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {displayData.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">Chưa có dữ liệu.</td></tr>
            ) : (
              displayData.map((pub) => (
                <tr key={pub.publisherId} className="hover:bg-slate-50">
                  <td className="p-3 sm:p-4 font-semibold flex items-center gap-2 text-xs sm:text-base"><Building2 size={18} className="text-slate-400 flex-shrink-0"/> {pub.name}</td>
                  <td className="p-3 sm:p-4 hidden sm:table-cell text-xs sm:text-base">{pub.description}</td>
                  <td className="p-3 sm:p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${pub.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {pub.isActive ? 'Hợp tác' : 'Ngừng'}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 flex justify-center gap-2 sm:gap-3">
                    {!showTrash ? (
                      <>
                        <button onClick={() => handleOpenModal(pub)} className="text-orange-500 hover:text-orange-700"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(pub.publisherId)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                      </>
                    ) : (
                      <Button variant="success" size="sm" icon={<ArchiveRestore size={16} />} onClick={() => handleRestore(pub.publisherId)}>Khôi phục</Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Cập nhật Nhà Xuất Bản' : 'Thêm Nhà Xuất Bản mới'}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên Nhà xuất bản <span className="text-red-500">*</span></label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả / Liên hệ</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"></textarea>
          </div>
          <div className="col-span-1 sm:col-span-2 flex justify-end gap-3 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="submit" variant="primary">Lưu</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}