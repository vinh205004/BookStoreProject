import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ArchiveRestore, List, Building2 } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import type { Publisher } from '../types';
import Modal from '../components/ui/Modal';

export default function Publishers() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);
  const [showTrash, setShowTrash] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => { fetchPublishers(); }, []);

  const fetchPublishers = async () => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await axiosClient.get('/Publishers');
      setPublishers(data);
    } catch {
      toast.error('Lỗi khi tải danh sách Nhà xuất bản!');
    } finally {
      setLoading(false);
    }
  };

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
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra!');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Chuyển NXB này vào thùng rác?')) {
      try {
        await axiosClient.delete(`/Publishers/${id}`);
        toast.success('Đã chuyển vào thùng rác!');
        fetchPublishers();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
      } catch (error: any) {
        toast.error('Không thể xóa NXB này!');
      }
    }
  };

  const handleRestore = async (id: number) => {
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
  const displayData = showTrash ? trashPublishers : activePublishers;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <div className="flex gap-4">
          <button onClick={() => setShowTrash(false)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${!showTrash ? 'bg-orange-100 text-orange-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <List size={20} /> Đang hợp tác ({activePublishers.length})
          </button>
          <button onClick={() => setShowTrash(true)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${showTrash ? 'bg-red-100 text-red-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Trash2 size={20} /> Đã ngừng hợp tác ({trashPublishers.length})
          </button>
        </div>
        {!showTrash && (
          <button onClick={() => handleOpenModal()} className="bg-orange-500 hover:bg-orange-600 text-black px-4 py-2 rounded-lg font-medium flex items-center gap-2">
            <Plus size={20} /> Thêm NXB
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600 uppercase">
              <th className="p-4 font-semibold">Tên NXB</th>
              <th className="p-4 font-semibold">Thông tin liên hệ / Mô tả</th>
              <th className="p-4 font-semibold">Trạng thái</th>
              <th className="p-4 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {displayData.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">Chưa có dữ liệu.</td></tr>
            ) : (
              displayData.map((pub) => (
                <tr key={pub.publisherId} className="hover:bg-slate-50">
                  <td className="p-4 font-semibold flex items-center gap-2"><Building2 size={18} className="text-slate-400"/> {pub.name}</td>
                  <td className="p-4">{pub.description}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${pub.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {pub.isActive ? 'Hợp tác' : 'Ngừng'}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center gap-3">
                    {!showTrash ? (
                      <>
                        <button onClick={() => handleOpenModal(pub)} className="text-orange-500 hover:text-orange-700"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(pub.publisherId)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                      </>
                    ) : (
                      <button onClick={() => handleRestore(pub.publisherId)} className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-md text-sm font-medium transition-colors">
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Cập nhật Nhà Xuất Bản' : 'Thêm Nhà Xuất Bản mới'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên Nhà xuất bản <span className="text-red-500">*</span></label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả / Liên hệ</label>
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