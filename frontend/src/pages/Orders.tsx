import React, { useState, useEffect } from 'react';
import { Eye, ShoppingBag, Truck, CheckCircle, XCircle, Clock, Package, Search, Copy, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import type { Order } from '../types';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Pagination from '../components/Pagination';
import SortableHeader, { type SortDirection } from '../components/SortableHeader';

const ITEMS_PER_PAGE = 10;
type OrderSortKey = 'orderDate' | 'totalAmount';
type StatusFilter = 'All' | 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
const STATUS_ORDER = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

// Cấu hình màu và Text cho từng trạng thái
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
  'Pending': { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <Clock size={16} /> },
  'Processing': { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Package size={16} /> },
  'Shipped': { label: 'Đang giao hàng', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Truck size={16} /> },
  'Delivered': { label: 'Giao thành công', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle size={16} /> },
  'Cancelled': { label: 'Đã hủy', color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle size={16} /> },
};

const getPaymentMethodLabel = (method?: string) => {
  return method === 'VNPAY' ? 'VNPAY' : 'COD';
};

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<OrderSortKey>('orderDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  // eslint-disable-next-line react-hooks/immutability
  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    const handleRealtimeOrdersUpdated = () => {
      fetchOrders();
    };

    window.addEventListener('admin-orders-updated', handleRealtimeOrdersUpdated);
    return () => window.removeEventListener('admin-orders-updated', handleRealtimeOrdersUpdated);
  }, []);

  const fetchOrders = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await axiosClient.get('/Orders');
      setOrders(data);
    } catch {
      toast.error('Lỗi khi tải danh sách đơn hàng!');
    }
  };

  const handleOpenDetail = async (order: Order) => {
    try {
      // Fetch đầy đủ thông tin chi tiết đơn hàng báo gồm OrderItems
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await axiosClient.get(`/Orders/${order.orderId}`);
      setSelectedOrder(data);
      setNewStatus(data.status);
      setIsModalOpen(true);
    } catch {
      toast.error('Lỗi khi tải chi tiết đơn hàng!');
    }
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

  const searchFilteredOrders = orders.filter((order) => 
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.orderId.toString().includes(searchQuery) ||
    order.status.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredOrders = statusFilter === 'All'
    ? searchFilteredOrders
    : searchFilteredOrders.filter(order => order.status === statusFilter);
  const statusStats = STATUS_ORDER.map((status) => {
    const statusOrders = searchFilteredOrders.filter(order => order.status === status);
    return {
      status,
      count: statusOrders.length,
      totalAmount: statusOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      config: STATUS_CONFIG[status],
    };
  });
  const allOrdersTotalAmount = searchFilteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const aValue = sortKey === 'orderDate' ? new Date(a.orderDate).getTime() : a.totalAmount;
    const bValue = sortKey === 'orderDate' ? new Date(b.orderDate).getTime() : b.totalAmount;
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });
  const totalPages = Math.ceil(sortedOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = sortedOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSort = (key: OrderSortKey) => {
    setSortKey(key);
    setSortDirection(current => sortKey === key && current === 'desc' ? 'asc' : 'desc');
    setCurrentPage(1);
  };

  const handleCopyOrderId = async (orderId: string) => {
    try {
      await navigator.clipboard.writeText(orderId);
      toast.success('Đã copy mã đơn hàng!');
    } catch {
      toast.error('Không thể copy mã đơn hàng!');
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await axiosClient.get(`/Orders/${orderId}/invoice`, { responseType: 'blob' });
      const payload = response instanceof Blob ? response : response?.data;
      const blob = payload instanceof Blob ? payload : new Blob([payload], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hoa-don-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Khong the tai hoa don!');
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, filteredOrders.length]);

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
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('All')}
          className={`border p-3 text-left transition hover:shadow-sm ${statusFilter === 'All' ? 'border-slate-700 bg-slate-100 ring-2 ring-slate-200' : 'border-slate-200 bg-slate-50'}`}
        >
          <div className="text-xs font-bold uppercase text-slate-500">Tất cả</div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <span className="text-xl font-bold text-slate-800">{searchFilteredOrders.length}</span>
            <span className="text-sm font-bold text-slate-700 text-right">{formatCurrency(allOrdersTotalAmount)}</span>
          </div>
        </button>
        {statusStats.map(({ status, count, totalAmount, config }) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status as StatusFilter)}
            className={`border p-3 text-left transition hover:shadow-sm ${config.color} ${statusFilter === status ? 'ring-2 ring-orange-300 border-orange-400' : ''}`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase">
              {config.icon}
              <span className="truncate">{config.label}</span>
            </div>
            <div className="mt-2 flex items-end justify-between gap-3">
              <span className="text-xl font-bold">{count}</span>
              <span className="text-sm font-bold text-right">{formatCurrency(totalAmount)}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs sm:text-sm text-slate-600 uppercase">
              <th className="p-3 sm:p-4 font-semibold w-40">Mã Đơn</th>
              <th className="p-3 sm:p-4 font-semibold hidden sm:table-cell">Khách hàng</th>
              <SortableHeader active={sortKey === 'orderDate'} direction={sortDirection} onClick={() => handleSort('orderDate')} className="hidden sm:table-cell">Ngày đặt</SortableHeader>
              <SortableHeader active={sortKey === 'totalAmount'} direction={sortDirection} onClick={() => handleSort('totalAmount')}>Tổng tiền</SortableHeader>
              <th className="p-3 sm:p-4 font-semibold hidden sm:table-cell">Thanh toán</th>
              <th className="p-3 sm:p-4 font-semibold">Trạng thái</th>
              <th className="p-3 sm:p-4 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {filteredOrders.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">{orders.length === 0 ? 'Chưa có đơn hàng nào trong hệ thống.' : 'Không tìm thấy đơn hàng phù hợp.'}</td></tr>
            ) : (
              paginatedOrders.map((order) => {
                const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG['Pending'];
                return (
                  <tr key={order.orderId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 sm:p-4 text-xs sm:text-base">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="min-w-0 max-w-28 truncate font-bold text-orange-600" title={`#ORD-${order.orderId}`}>
                          #ORD-{order.orderId}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyOrderId(order.orderId)}
                          className="flex-shrink-0 text-slate-400 hover:text-orange-600 transition-colors"
                          title="Copy mã đơn"
                        >
                          <Copy size={15} />
                        </button>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 hidden sm:table-cell text-xs sm:text-base">
                      <div className="font-semibold text-slate-800">{order.customerName}</div>
                      <div className="text-xs sm:text-sm text-slate-500">{order.customerPhone}</div>
                    </td>
                    <td className="p-3 sm:p-4 hidden sm:table-cell text-xs sm:text-base">{new Date(order.orderDate).toLocaleString('vi-VN')}</td>
                    <td className="p-3 sm:p-4 font-bold text-red-500 text-xs sm:text-base">{order.totalAmount.toLocaleString('vi-VN')} đ</td>
                    <td className="p-3 sm:p-4 hidden sm:table-cell text-xs sm:text-base">
                      <span className={`px-2 py-1 text-xs font-bold border ${order.paymentMethod === 'VNPAY' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                        {getPaymentMethodLabel(order.paymentMethod)}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-bold border ${statusInfo.color}`}>
                        {statusInfo.icon} {statusInfo.label}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex justify-center gap-2">
                        {order.status !== 'Cancelled' && (
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(order.orderId)}
                            className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-none transition-colors text-xs sm:text-sm font-medium"
                          >
                            <Download size={16} /> PDF
                          </button>
                        )}
                      <button 
                        onClick={() => handleOpenDetail(order)} 
                        className="flex items-center gap-1 bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1.5 rounded-none transition-colors text-xs sm:text-sm font-medium"
                      >
                        <Eye size={16} /> Chi tiết
                      </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Chi tiết đơn hàng #ORD-${selectedOrder?.orderId}`}>
        {selectedOrder && (
          <form onSubmit={handleUpdateStatus} className="flex flex-col gap-6">
            
            {/* THÔNG TIN KHÁCH HÀNG */}
            <div className="bg-slate-50 p-4 rounded-none border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase">Thông tin giao hàng</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Khách hàng:</span> <span className="font-semibold">{selectedOrder.customerName}</span></div>
                <div><span className="text-slate-500">Điện thoại:</span> <span className="font-semibold">{selectedOrder.customerPhone}</span></div>
                <div className="col-span-2"><span className="text-slate-500">Địa chỉ:</span> <span className="font-semibold">{selectedOrder.shippingAddress}</span></div>
                <div className="col-span-2"><span className="text-slate-500">Ngày đặt:</span> <span className="font-semibold">{new Date(selectedOrder.orderDate).toLocaleString('vi-VN')}</span></div>
                <div className="col-span-2"><span className="text-slate-500">Thanh toán:</span> <span className="font-semibold">{getPaymentMethodLabel(selectedOrder.paymentMethod)}</span></div>
                {selectedOrder.appliedVoucherCode && (
                  <div className="col-span-2">
                    <span className="text-slate-500">Voucher đã áp:</span>{' '}
                    <span className="inline-flex px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 text-xs font-bold">
                      {selectedOrder.appliedVoucherCode}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* DANH SÁCH SẢN PHẨM */}
            <div>
              <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase">Sản phẩm đã đặt</h4>
              <div className="border border-slate-200 rounded-none divide-y divide-slate-100">
                {selectedOrder.orderItems.map((item) => (
                  <div key={item.orderItemId} className="flex items-center gap-4 p-3 hover:bg-slate-50 transition-colors">
                    <img src={item.imageUrl || 'https://via.placeholder.com/50'} alt={item.bookTitle} className="w-12 h-16 object-cover rounded-none border border-slate-200" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 line-clamp-2" title={item.bookTitle}>{item.bookTitle}</div>
                      {item.hardcodedVoucherCode && (
                        <div className="mt-1 inline-flex px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 text-xs font-bold">
                          Áp cứng: {item.hardcodedVoucherCode}
                        </div>
                      )}
                      <div className="text-sm text-slate-500 mt-1">
                        SL: {item.quantity} x{' '}
                        {item.originalPrice && item.originalPrice > item.unitPrice ? (
                          <>
                            <span className="line-through text-slate-400 mr-1">{item.originalPrice.toLocaleString('vi-VN')} đ</span>
                            <span className="font-semibold text-red-500">{item.unitPrice.toLocaleString('vi-VN')} đ</span>
                          </>
                        ) : (
                          <span>{item.unitPrice.toLocaleString('vi-VN')} đ</span>
                        )}
                      </div>
                    </div>
                    <div className="font-bold text-orange-600 whitespace-nowrap">
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

