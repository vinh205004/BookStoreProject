/* eslint-disable react-hooks/set-state-in-effect */
import Select from 'react-select';
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, ArchiveRestore, List, BookOpenText, Search, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import type { Book, Category, Author, Publisher } from '../types';
import Modal from '../components/ui/Modal';
import DetailModal from '../components/ui/DetailModal';
import Button from '../components/ui/Button';
import MultiImageUpload from '../components/ui/MultiImageUpload';
import Pagination from '../components/Pagination';
import SortableHeader, { type SortDirection } from '../components/SortableHeader';

const ITEMS_PER_PAGE = 10;
type BookSortKey = 'price' | 'stock';

const roundDimension = (value: number) => Math.round(value * 10) / 10;
const parseDimensionInput = (value: string) => roundDimension(Number(value) || 0);
const formatDimension = (value?: number) => value ? roundDimension(value).toLocaleString('vi-VN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1
}) : 'Chưa cập nhật';

export default function Books() {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterAuthorId, setFilterAuthorId] = useState('');
  const [filterPublisherId, setFilterPublisherId] = useState('');
  const [discountFilter, setDiscountFilter] = useState<'all' | 'discounted' | 'none'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<BookSortKey>('stock');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // DATA CHO DROPDOWN
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]); // Data dropdown NXB
  const [description, setDescription] = useState(''); // Ô mô tả
  const [publisherId, setPublisherId] = useState<string>(''); // Ô NXB

  // STATE CHUYỂN TAB (False = Đang kinh doanh, True = Đã ngừng bán)
  const [showTrash, setShowTrash] = useState(false);

  // STATE MODAL & FORM
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [authorId, setAuthorId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState('Trưởng thành (18+)');
  const [length, setLength] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [lengthUnit, setLengthUnit] = useState('cm');
  const [pageCount, setPageCount] = useState<number>(0);
  const [discountedPrice, setDiscountedPrice] = useState<number | undefined>();
  const [discountBadge, setDiscountBadge] = useState<string>('');

  const fetchBooks = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await axiosClient.get('/Books');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const booksWithTypes: Book[] = data.map((b: any) => ({
        ...b,
        price: parseFloat(String(b.price)),
        stock: parseInt(String(b.stock)),
        discountedPrice: b.discountedPrice ? parseFloat(String(b.discountedPrice)) : undefined,
        length: b.length ? parseFloat(String(b.length)) : undefined,
        width: b.width ? parseFloat(String(b.width)) : undefined,
        pageCount: b.pageCount ? parseInt(String(b.pageCount)) : undefined
      }));
      console.log('Books fetched:', booksWithTypes);
      console.log('Books with discounts:', booksWithTypes.filter(b => b.discountedPrice));
      setBooks(booksWithTypes);
    } catch {
      toast.error('Lỗi khi tải danh sách sách!');
    }
  }, []);

  const fetchCategoriesAndAuthors = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBooks();
    fetchCategoriesAndAuthors();
  }, [fetchBooks, fetchCategoriesAndAuthors]);

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
      setTargetAudience(book.targetAudience || 'Trưởng thành (18+)');
      setLength(book.length || 0);
      setWidth(book.width || 0);
      setLengthUnit(book.lengthUnit || 'cm');
      setPageCount(book.pageCount || 0);
      setDiscountedPrice(book.discountedPrice);
      setDiscountBadge(book.discountBadge || '');
    } else {
      setEditingId(null);
      setTitle('');
      setPrice(0);
      setStock(0);
      setAuthorId(authors.length > 0 ? authors[0].authorId : '');
      setCategoryId(categories.length > 0 ? categories[0].categoryId : '');
      setImageUrls([]);
      setDescription('');
      setPublisherId(publishers.length > 0 ? publishers[0].publisherId : '');
      setTargetAudience('Trưởng thành (18+)');
      setLength(0);
      setWidth(0);
      setLengthUnit('cm');
      setPageCount(0);
      setDiscountedPrice(undefined);
      setDiscountBadge('');
    }
    setIsModalOpen(true);
  };

  const handleOpenDetail = (book: Book) => {
    setSelectedBook(book);
    setIsDetailModalOpen(true);
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
      const bookData = { 
        title, 
        description, 
        price, 
        stock, 
        authorId, 
        categoryId, 
        publisherId, 
        imageUrls, 
        isHidden: false,
        targetAudience,
        length: length ? roundDimension(length) : undefined,
        width: width ? roundDimension(width) : undefined,
        lengthUnit,
        pageCount: pageCount || undefined,
        discountedPrice: discountedPrice || undefined,
        discountBadge: discountBadge || undefined
      };

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
      const errorMsg = error?.response?.data?.error || 
                      error?.message || 
                      'Có lỗi xảy ra khi lưu sách!';
      toast.error(errorMsg);
      console.error('Book submit error:', error);
    }
  };

  // ẨN SÁCH (Đưa vào thùng rác)
  const handleDelete = async (id: string) => {
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
  const handleRestore = async (id: string) => {
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
  const authorFilterOptions = [{ value: '', label: 'Tất cả tác giả' }, ...authorOptions];
  const categoryFilterOptions = [{ value: '', label: 'Tất cả danh mục' }, ...categoryOptions];
  const publisherFilterOptions = [{ value: '', label: 'Tất cả nhà xuất bản' }, ...publisherOptions];
  // PHÂN LỌA DỮ LIỆU SÁCH
  const activeBooks = books.filter(b => !b.isHidden);
  const trashBooks = books.filter(b => b.isHidden);
  
  // TÌM KIẾM & LỌC
  const filterBooks = (source: Book[]) => source.filter(b => {
    const normalizedSearch = searchQuery.toLowerCase();
    const matchesSearch =
      b.title.toLowerCase().includes(normalizedSearch) ||
      b.authorName.toLowerCase().includes(normalizedSearch) ||
      b.categoryName.toLowerCase().includes(normalizedSearch) ||
      b.publisherName.toLowerCase().includes(normalizedSearch);
    const matchesCategory = !filterCategoryId || b.categoryId === filterCategoryId;
    const matchesAuthor = !filterAuthorId || b.authorId === filterAuthorId;
    const matchesPublisher = !filterPublisherId || b.publisherId === filterPublisherId;
    const hasHardcodedDiscount = (
      b.discountedPrice !== undefined &&
      b.discountedPrice !== null &&
      b.discountedPrice < b.price
    ) || Boolean(b.discountBadge || b.discountVoucherCode);
    const matchesDiscount =
      discountFilter === 'all' ||
      (discountFilter === 'discounted' && hasHardcodedDiscount) ||
      (discountFilter === 'none' && !hasHardcodedDiscount);

    return matchesSearch && matchesCategory && matchesAuthor && matchesPublisher && matchesDiscount;
  });
  const filteredActive = filterBooks(activeBooks);
  const filteredTrash = filterBooks(trashBooks);
  
  const displayData = showTrash ? filteredTrash : filteredActive;
  const sortedData = [...displayData].sort((a, b) => {
    const aValue = sortKey === 'price' ? a.price : a.stock;
    const bValue = sortKey === 'price' ? b.price : b.stock;
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });
  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const paginatedData = sortedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSort = (key: BookSortKey) => {
    setSortKey(key);
    setSortDirection(current => sortKey === key && current === 'desc' ? 'asc' : 'desc');
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategoryId, filterAuthorId, filterPublisherId, discountFilter, showTrash, displayData.length]);

  return (
    <div className="bg-white shadow-sm p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-100 pb-4 gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
          <BookOpenText className="text-orange-500 flex-shrink-0" size={24} /> Quản lý Sách
        </h2>
      </div>

      {/* TÌM KIẾM */}
      <div className="mb-6 grid grid-cols-1 xl:grid-cols-[1fr_230px_230px_230px] gap-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên sách, tác giả, danh mục, NXB..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-slate-300 px-4 py-2 pl-10 focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
        <Select
          options={categoryFilterOptions}
          value={categoryFilterOptions.find(opt => opt.value === filterCategoryId) || categoryFilterOptions[0]}
          onChange={(selectedOption) => setFilterCategoryId(selectedOption?.value || '')}
          placeholder="Lọc theo danh mục"
          isClearable={false}
          className="react-select-container"
          classNamePrefix="react-select"
        />
        <Select
          options={authorFilterOptions}
          value={authorFilterOptions.find(opt => opt.value === filterAuthorId) || authorFilterOptions[0]}
          onChange={(selectedOption) => setFilterAuthorId(selectedOption?.value || '')}
          placeholder="Lọc theo tác giả"
          isClearable={false}
          className="react-select-container"
          classNamePrefix="react-select"
        />
        <Select
          options={publisherFilterOptions}
          value={publisherFilterOptions.find(opt => opt.value === filterPublisherId) || publisherFilterOptions[0]}
          onChange={(selectedOption) => setFilterPublisherId(selectedOption?.value || '')}
          placeholder="Lọc theo nhà xuất bản"
          isClearable={false}
          className="react-select-container"
          classNamePrefix="react-select"
        />
      </div>

      {/* HEADER & TABS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-100 pb-4 gap-3">
        <div className="flex gap-2 sm:gap-4 overflow-x-auto w-full sm:w-auto">
          <button 
            onClick={() => setShowTrash(false)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${!showTrash ? 'bg-orange-100 text-orange-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <List size={20} /> Đang kinh doanh ({filteredActive.length})
          </button>
          
          <button 
            onClick={() => setShowTrash(true)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${showTrash ? 'bg-red-100 text-red-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Trash2 size={20} /> Đã ngừng bán ({filteredTrash.length})
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select
            value={discountFilter}
            onChange={(e) => setDiscountFilter(e.target.value as 'all' | 'discounted' | 'none')}
            className="w-full sm:w-48 border border-orange-500 px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none bg-orange-500 hover:bg-orange-600 text-black font-medium text-sm transition-colors"
          >
            <option value="all">Tất cả</option>
            <option value="discounted">Đang áp giảm giá</option>
            <option value="none">Chưa áp giảm giá</option>
          </select>

          {!showTrash && (
            <Button icon={<Plus size={20} />} onClick={() => handleOpenModal()}>
              Thêm sách
            </Button>
          )}
        </div>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs sm:text-sm text-slate-600 uppercase">
              <th className="p-3 sm:p-4 font-semibold w-20">Ảnh bìa</th>
              <th className="p-3 sm:p-4 font-semibold">Tên sách</th>
              <th className="p-3 sm:p-4 font-semibold hidden sm:table-cell">Tác giả</th>
              <th className="p-3 sm:p-4 font-semibold hidden sm:table-cell">Danh mục</th>
              <SortableHeader active={sortKey === 'price'} direction={sortDirection} onClick={() => handleSort('price')}>Giá</SortableHeader>
              <SortableHeader active={sortKey === 'stock'} direction={sortDirection} onClick={() => handleSort('stock')}>Kho</SortableHeader>
              <th className="p-3 sm:p-4 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {displayData.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">Trống.</td></tr>
            ) : (
              paginatedData.map((book) => (
                <tr key={book.bookId} className="hover:bg-slate-50">
                  <td className="p-3 sm:p-4">
                    {book.imageUrls && book.imageUrls.length > 0 ? (
                      <img src={book.imageUrls[0]} alt={book.title} className="w-14 h-20 rounded-none object-cover shadow border border-slate-200" />
                    ) : (
                      <div className="w-14 h-20 rounded-none bg-slate-100 flex items-center justify-center text-slate-400">
                        <BookOpenText size={30} />
                      </div>
                    )}
                  </td>
                  <td className="p-3 sm:p-4 font-semibold text-slate-900 truncate max-w-xs text-xs sm:text-base">{book.title}</td>
                  <td className="p-3 sm:p-4 hidden sm:table-cell text-xs sm:text-base">{book.authorName}</td>
                  <td className="p-3 sm:p-4 hidden sm:table-cell text-xs sm:text-base">{book.categoryName}</td>
                  <td className="p-3 sm:p-4 text-xs sm:text-base">
                    <div className="flex flex-col gap-1">
                      {book.discountedPrice !== undefined && book.discountedPrice !== null && book.discountedPrice < book.price ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-orange-500">{Number(book.discountedPrice).toLocaleString('vi-VN')} đ</span>
                            {book.discountBadge && (
                              <span className="inline-block bg-red-500 text-white px-2 py-0.5 text-xs font-bold rounded-none">{book.discountBadge}</span>
                            )}
                            {book.discountVoucherCode && (
                              <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 text-xs font-semibold rounded-none">{book.discountVoucherCode}</span>
                            )}
                          </div>
                          <span className="text-gray-400 line-through text-xs">{Number(book.price).toLocaleString('vi-VN')} đ</span>
                        </>
                      ) : (
                        <span className="font-bold text-slate-800">{Number(book.price).toLocaleString('vi-VN')} đ</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 sm:p-4 text-xs sm:text-base">{book.stock} cuốn</td>
                  <td className="p-3 sm:p-4 flex justify-center gap-2 sm:gap-3">
                    {!showTrash ? (
                      <>
                        <button onClick={() => handleOpenDetail(book)} className="text-orange-500 hover:text-orange-700 p-1"><Eye size={18} /></button>
                        <button onClick={() => handleOpenModal(book)} className="text-orange-500 hover:text-orange-700 p-1"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(book.bookId)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18} /></button>
                      </>
                    ) : (
                      <Button 
                        variant="success"
                        size="sm"
                        icon={<ArchiveRestore size={16} />}
                        onClick={() => handleRestore(book.bookId)}
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

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* MODAL THÊM/SỬA SÁCH */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Cập nhật thông tin sách' : 'Thêm sách mới vào kho'}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên cuốn sách <span className="text-red-500">*</span></label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Giá bán (VNĐ) <span className="text-red-500">*</span></label>
            <input type="number" required value={price} onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" min={0}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng trong kho <span className="text-red-500">*</span></label>
            <input type="number" required value={stock} onChange={(e) => setStock(Number(e.target.value))}
              className="w-full border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" min={0}/>
          </div>

          {/* SỬ DỤNG REACT-SELECT CHO 3 DROPDOWN */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tác giả <span className="text-red-500">*</span></label>
            <Select 
              options={authorOptions}
              placeholder="Gõ để tìm tác giả..."
              value={authorOptions.find(opt => opt.value === authorId) || null}
              onChange={(selectedOption) => setAuthorId(selectedOption?.value || '')}
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
              onChange={(selectedOption) => setCategoryId(selectedOption?.value || '')}
              isClearable
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nhà xuất bản <span className="text-red-500">*</span></label>
            <Select 
              options={publisherOptions}
              placeholder="Gõ để tìm nhà xuất bản..."
              value={publisherOptions.find(opt => opt.value === publisherId) || null}
              onChange={(selectedOption) => setPublisherId(selectedOption?.value || '')}
              isClearable
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Đối tượng</label>
            <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none">
              <option>Nhi đồng (6-10 tuổi)</option>
              <option>Vị thành niên (10-17 tuổi)</option>
              <option>Trưởng thành (18+)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Số trang</label>
            <input type="number" value={pageCount} onChange={(e) => setPageCount(Number(e.target.value))}
              className="w-full border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" min={0}/>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Khuôn khổ</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-slate-600 mb-1 block">Dài</label>
                <input type="number" value={length} onChange={(e) => setLength(parseDimensionInput(e.target.value))}
                  className="w-full border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" min={0} step={0.1}/>
              </div>
              <div>
                <label className="text-xs text-slate-600 mb-1 block">Rộng</label>
                <input type="number" value={width} onChange={(e) => setWidth(parseDimensionInput(e.target.value))}
                  className="w-full border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" min={0} step={0.1}/>
              </div>
              <div>
                <label className="text-xs text-slate-600 mb-1 block">Đơn vị</label>
                <select value={lengthUnit} onChange={(e) => setLengthUnit(e.target.value)}
                  className="w-full border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none">
                  <option>mm</option>
                  <option>cm</option>
                  <option>dm</option>
                </select>
              </div>
            </div>
          </div>

{/* Ô nhập Mô tả sách (TextArea rộng 2 cột) */}
<div className="col-span-2">
  <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả nội dung sách</label>
  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
    placeholder="Nhập tóm tắt nội dung cuốn sách..."
    className="w-full border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
</div>

          {/* COMPONENT UP NHIỀU ẢNH */}
          <div className="col-span-2 mt-2 border-t border-slate-200 pt-4">
            <MultiImageUpload 
              currentImages={imageUrls} 
              onUploadSuccess={(urls) => setImageUrls(urls)} 
            />
          </div>
          
          <div className="col-span-2 flex justify-end gap-3 mt-4 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="submit" variant="primary">
              {editingId ? 'Lưu thay đổi' : 'Thêm sách mới'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL XEM CHI TIẾT SÁCH */}
      <DetailModal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        title={`Chi tiết sách: ${selectedBook?.title}`}
        sections={selectedBook ? [
          {
            title: 'Thông tin cơ bản',
            bgColor: 'orange',
            items: [
              { label: 'Tên sách', value: selectedBook.title },
              { label: 'Tác giả', value: selectedBook.authorName },
              { label: 'Danh mục', value: selectedBook.categoryName },
              { label: 'Nhà xuất bản', value: selectedBook.publisherName }
            ]
          },
          {
            title: 'Thông tin bán hàng',
            items: [
              { label: 'Giá', value: `${selectedBook.price.toLocaleString('vi-VN')} đ` },
              { label: 'Kho hàng', value: `${selectedBook.stock} cuốn` },
              ...(selectedBook.discountedPrice !== undefined && selectedBook.discountedPrice > 0 ? [
                { label: 'Giá giảm', value: `${selectedBook.discountedPrice.toLocaleString('vi-VN')} đ` },
                { label: 'Badge', value: selectedBook.discountBadge || '-' },
                { label: 'Voucher', value: selectedBook.discountVoucherCode || '-' }
              ] : [])
            ]
          },
          {
            title: 'Khuôn khổ & Nội dung',
            bgColor: 'blue',
            items: [
              { label: 'Đối tượng', value: selectedBook.targetAudience || 'Chưa cập nhật' },
              { label: 'Dài', value: selectedBook.length ? `${formatDimension(selectedBook.length)} ${selectedBook.lengthUnit}` : 'Chưa cập nhật' },
              { label: 'Rộng', value: selectedBook.width ? `${formatDimension(selectedBook.width)} ${selectedBook.lengthUnit}` : 'Chưa cập nhật' },
              { label: 'Số trang', value: selectedBook.pageCount ? `${selectedBook.pageCount} trang` : 'Chưa cập nhật' }
            ]
          },
          {
            title: 'Mô tả',
            bgColor: 'blue',
            items: [
              { label: '', value: selectedBook.description || 'Chưa có mô tả' }
            ]
          }
        ] : []}
      />
    </div>
  );
}
