import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ChevronDown, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';

interface OrderItem {
  bookId: string;
  bookTitle: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
}

interface Order {
  orderId: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  shippingAddress: string;
  phoneNumber: string;
  note: string;
  items: OrderItem[];
}

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await axiosClient.get('/Orders/user');
      setOrders(response);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Lỗi khi tải đơn hàng!');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'Processing':
        return 'bg-blue-100 text-blue-700';
      case 'Shipped':
        return 'bg-purple-100 text-purple-700';
      case 'Delivered':
        return 'bg-green-100 text-green-700';
      case 'Cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'Chờ xử lý';
      case 'Processing':
        return 'Đang xử lý';
      case 'Shipped':
        return 'Đang giao';
      case 'Delivered':
        return 'Đã giao';
      case 'Cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-gray-500">Đang tải...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <Package size={64} className="mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Chưa có đơn hàng</h1>
          <p className="text-gray-600 mb-8">Bạn chưa có đơn hàng nào trong hệ thống</p>
          <a href="/products" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg">
            Tiếp tục mua sắm
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Đơn hàng của tôi</h1>
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">Quay lại</span>
        </button>
      </div>

      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.orderId} className="bg-white rounded-lg shadow overflow-hidden">
            {/* Order Header */}
            <button
              onClick={() => setExpandedOrder(expandedOrder === order.orderId ? null : order.orderId)}
              className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <div className="flex-1 text-left">
                <div className="flex items-center gap-4 mb-2 flex-wrap">
                  <h3 className="font-bold text-gray-800">Đơn #{order.orderId}</h3>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {new Date(order.orderDate).toLocaleDateString('vi-VN')} • {order.items.length} sản phẩm
                </p>
              </div>

              <div className="text-right hidden sm:block mr-4">
                <p className="font-bold text-orange-500 text-lg">{order.totalAmount.toLocaleString()}₫</p>
              </div>

              <ChevronDown
                size={24}
                className={`text-gray-400 transition-transform ${
                  expandedOrder === order.orderId ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Order Details */}
            {expandedOrder === order.orderId && (
              <div className="border-t border-gray-200 px-4 sm:px-6 py-4 bg-gray-50">
                {/* Items */}
                <div className="mb-6">
                  <h4 className="font-bold text-gray-800 mb-3">Chi tiết sản phẩm</h4>
                  <div className="space-y-3">
                    {order.items.map(item => (
                      <div key={item.bookId} className="flex gap-4 bg-white p-3 rounded">
                        <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                          <img
                            src={item.imageUrl || '/placeholder.jpg'}
                            alt={item.bookTitle}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 line-clamp-2">{item.bookTitle}</p>
                          <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                          <p className="text-orange-500 font-bold">{(item.unitPrice * item.quantity).toLocaleString()}₫</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Info */}
                <div className="mb-6 p-3 bg-white rounded">
                  <h4 className="font-bold text-gray-800 mb-3">Địa chỉ giao hàng</h4>
                  <p className="text-gray-700 mb-2">{order.shippingAddress}</p>
                  <p className="text-sm text-gray-600">Điện thoại: {order.phoneNumber}</p>
                  {order.note && <p className="text-sm text-gray-600 mt-2">Ghi chú: {order.note}</p>}
                </div>

                {/* Order Summary */}
                <div className="mb-6 p-3 bg-white rounded">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Tổng sản phẩm:</span>
                    <span className="font-semibold text-gray-800">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Vận chuyển:</span>
                    <span className="font-semibold text-gray-800">Miễn phí</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="font-bold text-gray-800">Tổng cộng:</span>
                    <span className="font-bold text-orange-500 text-lg">{order.totalAmount.toLocaleString()}₫</span>
                  </div>
                </div>

                {/* Order Timestamp */}
                <p className="text-xs text-gray-500 text-right">
                  Tạo lúc: {new Date(order.orderDate).toLocaleString('vi-VN')}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
