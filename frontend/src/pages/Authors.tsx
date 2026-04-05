import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, ArchiveRestore, List, UserCircle, Search, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import type { Author } from '../types';
import Modal from '../components/ui/Modal';
import DetailModal from '../components/ui/DetailModal';
import Button from '../components/ui/Button';
import ImageUpload from '../components/ui/ImageUpload';

export default function Authors() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // STATE ĐỂ CHUYỂN TAB (False = Danh sách chính, True = Thùng rác)
  const [showTrash, setShowTrash] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const [name, setName] = useState('');
  const [biography, setBiography] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const fetchAuthors = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await axiosClient.get('/Authors');
      setAuthors(data);
    } catch {
      toast.error('Lỗi khi tải danh sách tác giả!');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAuthors();
  }, [fetchAuthors]);

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

  const handleOpenDetail = (author: Author) => {
    setSelectedAuthor(author);
    setIsDetailModalOpen(true);
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
      const errorMsg = error?.response?.data?.error || error?.message || 'Có lỗi xảy ra!';
      toast.error(errorMsg);
      console.error('Author submit error:', error);
    }
  };

  // Chuyển vào thùng rác
  const handleDelete = async (id: string) => {
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
  const handleRestore = async (id: string) => {
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
  
  // TÌM KIẾM
  const filteredActive = activeAuthors.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.biography.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTrash = trashAuthors.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.biography.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const displayData = showTrash ? filteredTrash : filteredActive;

  return (
    <div className="bg-white shadow-sm p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-100 pb-4 gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
          <UserCircle className="text-orange-500 flex-shrink-0" size={24} /> Quản lý Tác giả
        </h2>
      </div>

      {/* TÌM KIẾM */}
      <div className="mb-6 flex gap-2">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên hoặc tiểu sử..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-slate-300 px-4 py-2 pl-10 focus:ring-2 focus:ring-orange-500 outline-none"
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
            <List size={20} /> Danh sách hiện tại ({activeAuthors.length})
          </button>
          
          <button 
            onClick={() => setShowTrash(true)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${showTrash ? 'bg-red-100 text-red-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Trash2 size={20} /> Thùng rác ({trashAuthors.length})
          </button>
        </div>

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
              <th className="p-3 sm:p-4 font-semibold w-24">Hình ảnh</th>
              <th className="p-3 sm:p-4 font-semibold">Tên tác giả</th>
              <th className="p-3 sm:p-4 font-semibold">Số tác phẩm</th>
              <th className="p-3 sm:p-4 font-semibold hidden sm:table-cell">Tiểu sử</th>
              <th className="p-3 sm:p-4 font-semibold">Trạng thái</th>
              <th className="p-3 sm:p-4 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {displayData.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500">Trống.</td></tr>
            ) : (
              displayData.map((author) => (
                <tr key={author.authorId} className="hover:bg-slate-50">
                  <td className="p-3 sm:p-4">
                    {author.imageUrl ? (
                      <img src={author.imageUrl} alt={author.name} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <UserCircle size={30} />
                      </div>
                    )}
                  </td>
                  <td className="p-3 sm:p-4 font-semibold text-xs sm:text-base">{author.name}</td>
                  <td className="p-3 sm:p-4 font-medium text-blue-600 text-xs sm:text-base">{author.bookCount || 0} cuốn</td>
                  <td className="p-3 sm:p-4 truncate max-w-xs hidden sm:table-cell text-xs sm:text-base">{author.biography || <span className="text-slate-400 italic">Chưa cập nhật</span>}</td>
                  <td className="p-3 sm:p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${author.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {author.isActive ? 'Hoạt động' : 'Đã xóa'}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 flex justify-center gap-2 sm:gap-3">
                    {!showTrash ? (
                      <>
                        <button onClick={() => handleOpenDetail(author)} className="text-orange-500 hover:text-orange-700 p-1"><Eye size={18} /></button>
                        <button onClick={() => handleOpenModal(author)} className="text-orange-500 hover:text-orange-700 p-1"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(author.authorId)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18} /></button>
                      </>
                    ) : (
                      <Button 
                        variant="success"
                        size="sm"
                        icon={<ArchiveRestore size={16} />}
                        onClick={() => handleRestore(author.authorId)}
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Cập nhật tác giả' : 'Thêm tác giả mới'}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên tác giả <span className="text-red-500">*</span></label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          
          {/* COMPONENT TẢI ẢNH */}
          <div className="col-span-1 sm:col-span-2">
            <ImageUpload 
              imageUrl={imageUrl} 
              onUploadSuccess={(url) => setImageUrl(url)} 
            />
          </div>

          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Tiểu sử</label>
            <textarea value={biography} onChange={(e) => setBiography(e.target.value)} rows={4} className="w-full border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"></textarea>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="submit" variant="primary" disabled={!name}>Lưu</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL XEM CHI TIẾT TÁC GIẢ */}
      <DetailModal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        title={`Chi tiết tác giả: ${selectedAuthor?.name}`}
        sections={selectedAuthor ? [
          {
            title: 'Thông tin cơ bản',
            bgColor: 'orange',
            items: [
              { label: 'Tên tác giả', value: selectedAuthor.name },
              { label: 'Số tác phẩm',  value: `${selectedAuthor.bookCount || 0} cuốn` }
            ]
          },
          {
            title: 'Tiểu sử',
            bgColor: 'blue',
            items: [
              { label: '', value: selectedAuthor.biography || 'Chưa cập nhật' }
            ]
          }
        ] : []}
      />
    </div>
  );
}