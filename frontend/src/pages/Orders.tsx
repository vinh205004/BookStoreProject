import React, { useState, useEffect } from 'react';
import { Eye, ShoppingBag, Truck, CheckCircle, XCircle, Clock, Package, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import type { Order } from '../types';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

// Cấu hình màu và Text cho từng trạng thái
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
  'Pending': { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <Clock size={16} /> },
  'Processing': { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Package size={16} /> },
  'Shipped': { label: 'Đang giao hàng', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Truck size={16} /> },
  'Delivered': { label: 'Giao thành công', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle size={16} /> },
  'Cancelled': { label: 'Đã hủy', color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle size={16} /> },
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  // eslint-disable-next-line react-hooks/immutability
  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await axiosClient.get('/Orders');
      setOrders(data);
    } catch {
      toast.error('Lỗi khi tải danh sách đơn hàng!');
    }
  };

  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      await axiosClient.put(`/Orders/${selectedOrder.orderId}/status`, { status: newStatus });
      toast.success('Cập nhật trạng thái đơn hàng thành công!');
      setIsModalOpen(false);
      fetchOrders();
    } catch {
      toast.error('Lỗi cập nhật trạng thái đơn hàng!');
    }
  };

  const filteredOrders = orders.filter((order) => 
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.orderId.toString().includes(searchQuery) ||
    order.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white shadow-sm border border-slate-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-100 pb-4 gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
          <ShoppingBag className="text-orange-500 flex-shrink-0" /> Quản lý Đơn hàng
        </h2>
      </div>
      {/* TÌM KIẾM */}
      <div className="mb-6 flex gap-2">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên khách hàng, mã đơn, hoặc trạng thái..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-slate-300 px-4 py-2 pl-10 focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
      </div>
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs sm:text-sm text-slate-600 uppercase">
              <th className="p-3 sm:p-4 font-semibold">Mã Đơn</th>
              <th className="p-3 sm:p-4 font-semibold hidden sm:table-cell">Khách hàng</th>
              <th className="p-3 sm:p-4 font-semibold hidden sm:table-cell">Ngày đặt</th>
              <th className="p-3 sm:p-4 font-semibold">Tổng tiền</th>
              <th className="p-3 sm:p-4 font-semibold">Trạng thái</th>
              <th className="p-3 sm:p-4 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {filteredOrders.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500">{orders.length === 0 ? 'Chưa có đơn hàng nào trong hệ thống.' : 'Không tìm thấy đơn hàng phù hợp.'}</td></tr>
            ) : (
              filteredOrders.map((order) => {
                const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG['Pending'];
                return (
                  <tr key={order.orderId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 sm:p-4 font-bold text-orange-600 text-xs sm:text-base">#ORD-{order.orderId}</td>
                    <td className="p-3 sm:p-4 hidden sm:table-cell text-xs sm:text-base">
                      <div className="font-semibold text-slate-800">{order.customerName}</div>
                      <div className="text-xs sm:text-sm text-slate-500">{order.customerPhone}</div>
                    </td>
                    <td className="p-3 sm:p-4 hidden sm:table-cell text-xs sm:text-base">{new Date(order.orderDate).toLocaleString('vi-VN')}</td>
                    <td className="p-3 sm:p-4 font-bold text-red-500 text-xs sm:text-base">{order.totalAmount.toLocaleString('vi-VN')} đ</td>
                    <td className="p-3 sm:p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                        {statusInfo.icon} {statusInfo.label}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 flex justify-center">
                      <button 
                        onClick={() => handleOpenDetail(order)} 
                        className="flex items-center gap-1 bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1.5 rounded-lg transition-colors text-xs sm:text-sm font-medium"
                      >
                        <Eye size={16} /> Chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Chi tiết đơn hàng #ORD-${selectedOrder?.orderId}`}>
        {selectedOrder && (
          <form onSubmit={handleUpdateStatus} className="flex flex-col gap-6">
            
            {/* THÔNG TIN KHÁCH HÀNG */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase">Thông tin giao hàng</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Khách hàng:</span> <span className="font-semibold">{selectedOrder.customerName}</span></div>
                <div><span className="text-slate-500">Điện thoại:</span> <span className="font-semibold">{selectedOrder.customerPhone}</span></div>
                <div className="col-span-2"><span className="text-slate-500">Địa chỉ:</span> <span className="font-semibold">{selectedOrder.shippingAddress}</span></div>
                <div className="col-span-2"><span className="text-slate-500">Ngày đặt:</span> <span className="font-semibold">{new Date(selectedOrder.orderDate).toLocaleString('vi-VN')}</span></div>
              </div>
            </div>

            {/* DANH SÁCH SẢN PHẨM */}
            <div>
              <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase">Sản phẩm đã đặt</h4>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                {selectedOrder.orderItems.map((item) => (
                  <div key={item.orderItemId} className="flex items-center gap-4 p-3">
                    <img src={item.imageUrl || 'https://via.placeholder.com/50'} alt={item.bookTitle} className="w-12 h-16 object-cover rounded border border-slate-200" />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800 line-clamp-1">{item.bookTitle}</div>
                      <div className="text-sm text-slate-500">SL: {item.quantity} x {item.unitPrice.toLocaleString('vi-VN')} đ</div>
                    </div>
                    <div className="font-bold text-slate-800">
                      {(item.quantity * item.unitPrice).toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-right">
                <span className="text-slate-500">Tổng thanh toán:</span>
                <span className="text-xl font-bold text-red-500 ml-3">{selectedOrder.totalAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {/* CẬP NHẬT TRẠNG THÁI */}
            <div className="border-t border-slate-200 pt-4">
              <label className="block text-sm font-bold text-slate-800 mb-2">Cập nhật trạng thái đơn hàng</label>
              <select 
                value={newStatus} 
                onChange={(e) => setNewStatus(e.target.value)}
                disabled={selectedOrder.status === 'Cancelled' || selectedOrder.status === 'Delivered'}
                className="w-full border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-orange-500 outline-none bg-white font-medium"
              >
                <option value="Pending">⏳ Chờ xác nhận</option>
                <option value="Processing">📦 Đang xử lý</option>
                <option value="Shipped">🚚 Đang giao hàng</option>
                <option value="Delivered">✅ Giao thành công</option>
                <option value="Cancelled">❌ Hủy đơn hàng</option>
              </select>
              {(selectedOrder.status === 'Cancelled' || selectedOrder.status === 'Delivered') && (
                <p className="text-xs text-red-500 mt-1 italic">Đơn hàng đã hoàn tất hoặc bị hủy, không thể thay đổi trạng thái.</p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Đóng</Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={selectedOrder.status === 'Cancelled' || selectedOrder.status === 'Delivered' || newStatus === selectedOrder.status}
              >
                Lưu thay đổi
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}