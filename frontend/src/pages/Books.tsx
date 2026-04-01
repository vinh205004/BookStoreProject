import Select from 'react-select';
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ArchiveRestore, List, BookOpenText } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import type { Book, Category, Author, Publisher } from '../types';
import Modal from '../components/ui/Modal';
import MultiImageUpload from '../components/ui/MultiImageUpload';

export default function Books() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);

  // DATA CHO DROPDOWN
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [publishers, setPublishers] = useState<Publisher[]>([]); // Data dropdown NXB
  const [description, setDescription] = useState(''); // Ô mô tả
  const [publisherId, setPublisherId] = useState<number>(0); // Ô NXB

  // STATE CHUYỂN TAB (False = Đang kinh doanh, True = Đã ngừng bán)
  const [showTrash, setShowTrash] = useState(false);

  // STATE MODAL & FORM
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [authorId, setAuthorId] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<number>(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    fetchBooks();
    fetchCategoriesAndAuthors();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await axiosClient.get('/Books');
      setBooks(data);
    } catch {
      toast.error('Lỗi khi tải danh sách sách!');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesAndAuthors = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [cats, auths, pubs]: any = await Promise.all([
        axiosClient.get('/Categories'),
        axiosClient.get('/Authors'),
        axiosClient.get('/Publishers')
      ]);
      setCategories(cats);
      setAuthors(auths);
      setPublishers(pubs);
    } catch {
      toast.error('Có lỗi xảy ra khi tải danh mục, tác giả hoặc nhà xuất bản!');
    }
  };

  const handleOpenModal = (book?: Book) => {
    if (book) {
      setEditingId(book.bookId);
      setTitle(book.title);
      setPrice(book.price);
      setStock(book.stock);
      setAuthorId(book.authorId);
      setCategoryId(book.categoryId);
      setImageUrls(book.imageUrls || []);
      setDescription(book.description || '');
      setPublisherId(book.publisherId);
    } else {
      setEditingId(null);
      setTitle('');
      setPrice(0);
      setStock(0);
      setAuthorId(authors.length > 0 ? authors[0].authorId : 0);
      setCategoryId(categories.length > 0 ? categories[0].categoryId : 0);
      setImageUrls([]);
      setDescription('');
      setPublisherId(publishers.length > 0 ? publishers[0].publisherId : 0);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authorId || !categoryId) {
      toast.warning('Vui lòng chọn Tác giả và Danh mục!');
      return;
    }
    if (imageUrls.length === 0) {
      toast.warning('Vui lòng tải lên ít nhất 1 ảnh cho sách!');
      return;
    }

    try {
      const bookData = { title, description, price, stock, authorId, categoryId, publisherId, imageUrls, isHidden: false };

      if (editingId) {
        await axiosClient.put(`/Books/${editingId}`, bookData);
        toast.success('Cập nhật sách thành công!');
      } else {
        await axiosClient.post('/Books', bookData);
        toast.success('Thêm sách mới thành công!');
      }
      setIsModalOpen(false);
      fetchBooks();
      setShowTrash(false); // Trở về tab chính sau khi lưu
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra!');
    }
  };

  // ẨN SÁCH (Đưa vào thùng rác)
  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn ngừng bán cuốn sách này?')) {
      try {
        await axiosClient.delete(`/Books/${id}`);
        toast.success('Đã đưa sách vào danh sách ngừng bán!');
        fetchBooks();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Không thể thao tác!');
      }
    }
  };

  // KHÔI PHỤC SÁCH
  const handleRestore = async (id: number) => {
    if (window.confirm('Khôi phục lại cuốn sách này để tiếp tục kinh doanh?')) {
      try {
        await axiosClient.put(`/Books/${id}/restore`);
        toast.success('Khôi phục sách thành công!');
        fetchBooks();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
      } catch (error: any) {
        toast.error('Có lỗi khi khôi phục!');
      }
    }
  };
  // MAP DATA CHO DROPDOWN TÌM KIẾM
  const authorOptions = authors.filter(a => a.isActive).map(a => ({ value: a.authorId, label: a.name }));
  const categoryOptions = categories.filter(c => c.isActive).map(c => ({ value: c.categoryId, label: c.name }));
  const publisherOptions = publishers.filter(p => p.isActive).map(p => ({ value: p.publisherId, label: p.name }));
  // PHÂN LỌA DỮ LIỆU SÁCH
  const activeBooks = books.filter(b => !b.isHidden);
  const trashBooks = books.filter(b => b.isHidden);
  const displayData = showTrash ? trashBooks : activeBooks;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      
      {/* HEADER & TABS */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <div className="flex gap-4">
          <button 
            onClick={() => setShowTrash(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${!showTrash ? 'bg-orange-100 text-orange-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <List size={20} /> Đang kinh doanh ({activeBooks.length})
          </button>
          
          <button 
            onClick={() => setShowTrash(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${showTrash ? 'bg-red-100 text-red-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Trash2 size={20} /> Đã ngừng bán ({trashBooks.length})
          </button>
        </div>

        {!showTrash && (
          <button onClick={() => handleOpenModal()} className="bg-orange-500 hover:bg-orange-600 text-black px-4 py-2 rounded-lg font-medium flex items-center gap-2">
            <Plus size={20} /> Thêm sách mới
          </button>
        )}
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600 uppercase">
              <th className="p-4 font-semibold w-20">Ảnh bìa</th>
              <th className="p-4 font-semibold">Tên sách</th>
              <th className="p-4 font-semibold">Tác giả</th>
              <th className="p-4 font-semibold">Danh mục</th>
              <th className="p-4 font-semibold">Giá</th>
              <th className="p-4 font-semibold">Kho</th>
              <th className="p-4 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
            ) : displayData.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">Trống.</td></tr>
            ) : (
              displayData.map((book) => (
                <tr key={book.bookId} className="hover:bg-slate-50">
                  <td className="p-4">
                    {book.imageUrls && book.imageUrls.length > 0 ? (
                      <img src={book.imageUrls[0]} alt={book.title} className="w-14 h-20 rounded object-cover shadow border border-slate-200" />
                    ) : (
                      <div className="w-14 h-20 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                        <BookOpenText size={30} />
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-semibold text-slate-900 truncate max-w-xs">{book.title}</td>
                  <td className="p-4">{book.authorName}</td>
                  <td className="p-4">{book.categoryName}</td>
                  <td className="p-4 font-bold text-slate-800">{book.price.toLocaleString('vi-VN')} đ</td>
                  <td className="p-4">{book.stock} cuốn</td>
                  <td className="p-4 flex justify-center gap-3">
                    {!showTrash ? (
                      <>
                        <button onClick={() => handleOpenModal(book)} className="text-orange-500 hover:text-orange-700 mt-5"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(book.bookId)} className="text-red-500 hover:text-red-700 mt-5"><Trash2 size={18} /></button>
                      </>
                    ) : (
                      <button 
                        onClick={() => handleRestore(book.bookId)} 
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-md text-sm font-medium transition-colors mt-5"
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

      {/* MODAL THÊM/SỬA SÁCH */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Cập nhật thông tin sách' : 'Thêm sách mới vào kho'}>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên cuốn sách <span className="text-red-500">*</span></label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Giá bán (VNĐ) <span className="text-red-500">*</span></label>
            <input type="number" required value={price} onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" min={0}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng trong kho <span className="text-red-500">*</span></label>
            <input type="number" required value={stock} onChange={(e) => setStock(Number(e.target.value))}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" min={0}/>
          </div>

          {/* SỬ DỤNG REACT-SELECT CHO 3 DROPDOWN */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tác giả <span className="text-red-500">*</span></label>
            <Select 
              options={authorOptions}
              placeholder="Gõ để tìm tác giả..."
              value={authorOptions.find(opt => opt.value === authorId) || null}
              onChange={(selectedOption) => setAuthorId(selectedOption?.value || 0)}
              isClearable
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục <span className="text-red-500">*</span></label>
            <Select 
              options={categoryOptions}
              placeholder="Gõ để tìm danh mục..."
              value={categoryOptions.find(opt => opt.value === categoryId) || null}
              onChange={(selectedOption) => setCategoryId(selectedOption?.value || 0)}
              isClearable
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nhà xuất bản <span className="text-red-500">*</span></label>
            <Select 
              options={publisherOptions}
              placeholder="Gõ để tìm nhà xuất bản..."
              value={publisherOptions.find(opt => opt.value === publisherId) || null}
              onChange={(selectedOption) => setPublisherId(selectedOption?.value || 0)}
              isClearable
            />
          </div>

{/* Ô nhập Mô tả sách (TextArea rộng 2 cột) */}
<div className="col-span-2">
  <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả nội dung sách</label>
  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
    placeholder="Nhập tóm tắt nội dung cuốn sách..."
    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
</div>

          {/* COMPONENT UP NHIỀU ẢNH */}
          <div className="col-span-2 mt-2 border-t border-slate-200 pt-4">
            <MultiImageUpload 
              currentImages={imageUrls} 
              onUploadSuccess={(urls) => setImageUrls(urls)} 
            />
          </div>
          
          <div className="col-span-2 flex justify-end gap-3 mt-4 border-t border-slate-200 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg">Hủy</button>
            <button type="submit" className="px-5 py-2.5 text-black bg-orange-500 hover:bg-orange-600 rounded-lg font-bold">
              {editingId ? 'Lưu thay đổi' : 'Thêm sách mới'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}