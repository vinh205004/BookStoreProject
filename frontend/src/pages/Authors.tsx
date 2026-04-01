import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ArchiveRestore, List, UserCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import type { Author } from '../types';
import Modal from '../components/ui/Modal';
import ImageUpload from '../components/ui/ImageUpload';

export default function Authors() {
  const [authors, setAuthors] = useState<Author[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);

  // STATE ĐỂ CHUYỂN TAB (False = Danh sách chính, True = Thùng rác)
  const [showTrash, setShowTrash] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [name, setName] = useState('');
  const [biography, setBiography] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await axiosClient.get('/Authors');
      setAuthors(data);
    } catch {
      toast.error('Lỗi khi tải danh sách tác giả!');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (author?: Author) => {
    if (author) {
      setEditingId(author.authorId);
      setName(author.name);
      setBiography(author.biography);
      setImageUrl(author.imageUrl);
    } else {
      setEditingId(null);
      setName('');
      setBiography('');
      setImageUrl('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axiosClient.put(`/Authors/${editingId}`, { name, biography, imageUrl, isActive: true });
        toast.success('Cập nhật tác giả thành công!');
      } else {
        await axiosClient.post('/Authors', { name, biography, imageUrl });
        toast.success('Thêm tác giả mới thành công!');
      }
      setIsModalOpen(false);
      fetchAuthors();
      setShowTrash(false); // Lưu xong tự động về tab Danh sách
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra!');
    }
  };

  // Chuyển vào thùng rác
  const handleDelete = async (id: number) => {
    if (window.confirm('Chuyển tác giả này vào thùng rác?')) {
      try {
        await axiosClient.delete(`/Authors/${id}`);
        toast.success('Đã chuyển vào thùng rác!');
        fetchAuthors();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Không thể xóa do có lỗi ràng buộc!');
      }
    }
  };

  // Khôi phục từ thùng rác
  const handleRestore = async (id: number) => {
    if (window.confirm('Khôi phục lại tác giả này?')) {
      try {
        await axiosClient.put(`/Authors/${id}/restore`);
        toast.success('Khôi phục thành công!');
        fetchAuthors();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
      } catch (error: any) {
        toast.error('Có lỗi khi khôi phục!');
      }
    }
  };

  // PHÂN LOẠI DỮ LIỆU
  const activeAuthors = authors.filter(a => a.isActive);
  const trashAuthors = authors.filter(a => !a.isActive);
  const displayData = showTrash ? trashAuthors : activeAuthors;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      
      {/* HEADER & NÚT CHUYỂN TAB */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <div className="flex gap-4">
          <button 
            onClick={() => setShowTrash(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${!showTrash ? 'bg-orange-100 text-orange-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <List size={20} /> Danh sách hiện tại ({activeAuthors.length})
          </button>
          
          <button 
            onClick={() => setShowTrash(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${showTrash ? 'bg-red-100 text-red-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Trash2 size={20} /> Thùng rác ({trashAuthors.length})
          </button>
        </div>

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
              <th className="p-4 font-semibold w-24">Hình ảnh</th>
              <th className="p-4 font-semibold">Tên tác giả</th>
              <th className="p-4 font-semibold">Số tác phẩm</th>
              <th className="p-4 font-semibold">Tiểu sử</th>
              <th className="p-4 font-semibold">Trạng thái</th>
              <th className="p-4 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {displayData.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">Trống.</td></tr>
            ) : (
              displayData.map((author) => (
                <tr key={author.authorId} className="hover:bg-slate-50">
                  <td className="p-4">
                    {author.imageUrl ? (
                      <img src={author.imageUrl} alt={author.name} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <UserCircle size={30} />
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-semibold">{author.name}</td>
                  <td className="p-4 font-medium text-blue-600">{author.bookCount || 0} cuốn</td>
                  <td className="p-4 truncate max-w-xs">{author.biography || <span className="text-slate-400 italic">Chưa cập nhật</span>}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${author.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {author.isActive ? 'Hoạt động' : 'Đã xóa'}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center gap-3">
                    {!showTrash ? (
                      <>
                        <button onClick={() => handleOpenModal(author)} className="text-orange-500 hover:text-orange-700 mt-2"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(author.authorId)} className="text-red-500 hover:text-red-700 mt-2"><Trash2 size={18} /></button>
                      </>
                    ) : (
                      <button 
                        onClick={() => handleRestore(author.authorId)} 
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-md text-sm font-medium transition-colors mt-2"
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Cập nhật tác giả' : 'Thêm tác giả mới'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên tác giả <span className="text-red-500">*</span></label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          
          {/* COMPONENT TẢI ẢNH */}
          <ImageUpload 
            imageUrl={imageUrl} 
            onUploadSuccess={(url) => setImageUrl(url)} 
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tiểu sử</label>
            <textarea value={biography} onChange={(e) => setBiography(e.target.value)} rows={4} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"></textarea>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg">Hủy</button>
            <button type="submit" className="px-4 py-2 text-black bg-orange-500 hover:bg-orange-600 rounded-lg" disabled={!name}>Lưu</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}