import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, ArchiveRestore, List, TicketPercent, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import type { Voucher } from '../types';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

export default function Vouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTrash, setShowTrash] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // State cho Form
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'Direct' | 'Percentage'>('Direct');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [minOrderValue, setMinOrderValue] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [expirationDate, setExpirationDate] = useState('');

  const fetchVouchers = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await axiosClient.get('/Vouchers');
      setVouchers(data);
    } catch {
      toast.error('Lỗi khi tải danh sách voucher!');
    }
  }, []);

  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVouchers(); 
  }, [fetchVouchers]);

  const handleOpenModal = (v?: Voucher) => {
    if (v) {
      setEditingId(v.voucherId);
      setCode(v.code);
      setDiscountType(v.discountType as 'Direct' | 'Percentage');
      setDiscountAmount(v.discountAmount);
      setMinOrderValue(v.minOrderValue);
      setQuantity(v.quantity);
      const dateObj = new Date(v.expirationDate);
      // Chỉnh offset timezone VN
      dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
      setExpirationDate(dateObj.toISOString().slice(0, 16));
    } else {
      setEditingId(null);
      setCode('');
      setDiscountType('Direct');
      setDiscountAmount(0);
      setMinOrderValue(0);
      setQuantity(10); // Mặc định 10 mã
      setExpirationDate('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expirationDate) {
      toast.warning('Vui lòng chọn ngày hết hạn!');
      return;
    }

    try {
      const voucherData = { 
        code: code.toUpperCase(), // Ép mã tự động in hoa
        discountType,
        discountAmount, 
        minOrderValue, 
        quantity, 
        expirationDate: new Date(expirationDate).toISOString()
      };

      if (editingId) {
        await axiosClient.put(`/Vouchers/${editingId}`, { ...voucherData, isActive: true });
        toast.success('Cập nhật Voucher thành công!');
      } else {
        await axiosClient.post('/Vouchers', voucherData);
        toast.success('Tạo Voucher mới thành công!');
      }
      setIsModalOpen(false);
      fetchVouchers();
      setShowTrash(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra!');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Khóa Voucher này (Người dùng sẽ không thể nhập được nữa)?')) {
      try {
        await axiosClient.delete(`/Vouchers/${id}`);
        toast.success('Đã khóa Voucher!');
        fetchVouchers();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
      } catch (error: any) {
        toast.error('Không thể khóa Voucher!');
      }
    }
  };

  const handleRestore = async (id: string) => {
    if (window.confirm('Mở khóa lại Voucher này?')) {
      try {
        await axiosClient.put(`/Vouchers/${id}/restore`);
        toast.success('Mở khóa thành công!');
        fetchVouchers();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
      } catch (error: any) {
        toast.error('Có lỗi khi mở khóa!');
      }
    }
  };

  const activeVouchers = vouchers.filter(v => v.isActive);
  const trashVouchers = vouchers.filter(v => !v.isActive);
  
  // TÌM KIẾM
  const filteredActive = activeVouchers.filter(v => 
    v.code.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTrash = trashVouchers.filter(v => 
    v.code.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const displayData = showTrash ? filteredTrash : filteredActive;

  return (
    <div className="bg-white shadow-sm p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-100 pb-4 gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
          <TicketPercent className="text-orange-500 flex-shrink-0" size={24} /> Quản lý Voucher
        </h2>
      </div>

      {/* TÌM KIẾM */}
      <div className="mb-6 flex gap-2">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo mã voucher..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-slate-300 px-4 py-2 pl-10 focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-100 pb-4 gap-3">
        <div className="flex gap-2 sm:gap-4 overflow-x-auto w-full sm:w-auto">
          <button onClick={() => setShowTrash(false)} className={`flex items-center gap-2 px-3 sm:px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${!showTrash ? 'bg-orange-100 text-orange-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <List size={20} /> Mã đang phát hành ({activeVouchers.length})
          </button>
          <button onClick={() => setShowTrash(true)} className={`flex items-center gap-2 px-3 sm:px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${showTrash ? 'bg-red-100 text-red-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Trash2 size={20} /> Mã đã khóa ({trashVouchers.length})
          </button>
        </div>
        {!showTrash && (
          <Button icon={<Plus size={20} />} onClick={() => handleOpenModal()}>Tạo Voucher</Button>
        )}
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs sm:text-sm text-slate-600 uppercase">
              <th className="p-3 sm:p-4 font-semibold">Mã Code</th>
              <th className="p-3 sm:p-4 font-semibold">Mức giảm</th>
              <th className="p-3 sm:p-4 font-semibold hidden sm:table-cell">Điều kiện đơn</th>
              <th className="p-3 sm:p-4 font-semibold">Đã dùng</th>
              <th className="p-3 sm:p-4 font-semibold hidden sm:table-cell">Hạn sử dụng</th>
              <th className="p-3 sm:p-4 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {displayData.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">Chưa có mã giảm giá nào.</td></tr>
            ) : (
              displayData.map((v) => {
                // Kiểm tra xem mã đã quá hạn chưa
                const isExpired = new Date(v.expirationDate) < new Date();
                
                return (
                  <tr key={v.voucherId} className="hover:bg-slate-50">
                    <td className="p-3 sm:p-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-orange-200 bg-orange-50 text-orange-700 font-bold font-mono text-xs sm:text-sm tracking-wider">
                        <TicketPercent size={16} /> {v.code}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 font-bold text-red-500 text-xs sm:text-base">
                      {v.discountType === 'Percentage' 
                        ? `-${v.discountAmount}%` 
                        : `-${v.discountAmount.toLocaleString('vi-VN')} đ`}
                    </td>
                    <td className="p-3 sm:p-4 text-xs sm:text-base hidden sm:table-cell">Từ {v.minOrderValue.toLocaleString('vi-VN')} đ</td>
                    <td className="p-3 sm:p-4">
                      <span className="font-semibold">{v.usedCount}</span> / {v.quantity}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{new Date(v.expirationDate).toLocaleString('vi-VN')}</span>
                        {isExpired && v.isActive && <span className="text-xs text-red-500 font-bold">Đã hết hạn</span>}
                      </div>
                    </td>
                    <td className="p-4 flex justify-center gap-3">
                      {!showTrash ? (
                        <>
                          <button onClick={() => handleOpenModal(v)} className="text-orange-500 hover:text-orange-700 mt-2"><Edit size={18} /></button>
                          <button onClick={() => handleDelete(v.voucherId)} className="text-red-500 hover:text-red-700 mt-2"><Trash2 size={18} /></button>
                        </>
                      ) : (
                        <Button variant="success" size="sm" icon={<ArchiveRestore size={16} />} onClick={() => handleRestore(v.voucherId)}>Mở khóa</Button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal kích thước lớn vì có nhiều trường */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Cập nhật Voucher' : 'Tạo Voucher mới'}>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Mã Code (Khách hàng sẽ nhập) <span className="text-red-500">*</span></label>
            <input type="text" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} 
              className="w-full border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none font-mono font-bold text-orange-700" 
              placeholder="VD: TIENTHO50K" />
          </div>
          
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Loại giảm giá <span className="text-red-500">*</span></label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="discountType" value="Direct" 
                  checked={discountType === 'Direct'} 
                  onChange={(e) => setDiscountType(e.target.value as 'Direct' | 'Percentage')}
                  className="w-4 h-4" />
                <span className="text-sm">Giảm trực tiếp (VNĐ)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="discountType" value="Percentage" 
                  checked={discountType === 'Percentage'} 
                  onChange={(e) => setDiscountType(e.target.value as 'Direct' | 'Percentage')}
                  className="w-4 h-4" />
                <span className="text-sm">Giảm phần trăm (%)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {discountType === 'Percentage' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VNĐ)'} <span className="text-red-500">*</span>
            </label>
            <input type="number" required value={discountAmount} onChange={(e) => setDiscountAmount(Number(e.target.value))} 
              className="w-full border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" 
              min={0} 
              max={discountType === 'Percentage' ? 100 : undefined}
              placeholder={discountType === 'Percentage' ? 'VD: 10 (=10%)' : 'VD: 50000'} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Đơn tối thiểu áp dụng (VNĐ) <span className="text-red-500">*</span></label>
            <input type="number" required value={minOrderValue} onChange={(e) => setMinOrderValue(Number(e.target.value))} 
              className="w-full border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" min={0} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tổng số lượng mã phát hành <span className="text-red-500">*</span></label>
            <input type="number" required value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} 
              className="w-full border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" min={1} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ngày giờ hết hạn <span className="text-red-500">*</span></label>
            <input type="datetime-local" required value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} 
              className="w-full border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>

          <div className="col-span-2 flex justify-end gap-3 mt-4 border-t pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="submit" variant="primary">Lưu Voucher</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}