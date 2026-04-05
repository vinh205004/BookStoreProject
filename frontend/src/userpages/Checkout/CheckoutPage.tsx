import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Phone, MapPin, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';

interface CartItem {
  cartItemId?: string;
  bookId: string;
  bookTitle: string;
  price: number;
  quantity: number;
  imageUrl: string;
  stock?: number;
}

interface CartResponse {
  items: CartItem[];
  totalPrice?: number;
  totalItems?: number;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    shippingAddress: '',
    phoneNumber: '',
    note: '',
  });

  useEffect(() => {
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const loadCart = async () => {
    try {
      const cartData: CartResponse = await axiosClient.get('/cart');
      setCart(cartData.items);

      if (cartData.items.length === 0) {
        navigate('/cart');
      }
      setLoading(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Lỗi khi tải giỏ hàng!');
      navigate('/cart');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.shippingAddress.trim()) {
      toast.error('Vui lòng nhập địa chỉ giao hàng!');
      return;
    }

    if (!formData.phoneNumber.trim()) {
      toast.error('Vui lòng nhập số điện thoại!');
      return;
    }

    setSubmitting(true);

    try {
      const orderData = {
        shippingAddress: formData.shippingAddress,
        phoneNumber: formData.phoneNumber,
        note: formData.note,
        items: cart.map(item => ({
          bookId: item.bookId,
          quantity: item.quantity,
        })),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await axiosClient.post('/Orders', orderData);
      
      // Clear cart using API
      try {
        await axiosClient.delete('/cart');
      } catch {
        // If delete fails, just dispatch event
      }
      
      // Dispatch custom event to update badge
      window.dispatchEvent(new Event('cart-updated'));
      
      toast.success('Đơn hàng đã được tạo thành công!');
      navigate(`/order-success/${response.orderId}`);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosError = error as any;
      toast.error(axiosError.response?.data?.message || 'Lỗi khi tạo đơn hàng!');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-center text-gray-500">Đang tải...</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Giỏ hàng trống</h1>
          <a href="/products" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg">
            Quay lại mua sắm
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Thanh toán</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Thông tin giao hàng</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Địa chỉ giao hàng *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <textarea
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ giao hàng"
                    rows={3}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Ghi chú (tùy chọn)</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    placeholder="Ghi chú thêm về đơn hàng"
                    rows={3}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-6 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition"
            >
              {submitting ? 'Đang xử lý...' : 'Xác nhận đơn hàng'}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow sticky top-20">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Tóm tắt đơn hàng</h2>

            <div className="space-y-3 mb-6 pb-6 border-b border-gray-200 max-h-96 overflow-y-auto">
              {cart.map(item => (
                <div key={item.bookId} className="flex justify-between text-sm">
                  <span className="text-gray-600 line-clamp-1">{item.bookTitle} x{item.quantity}</span>
                  <span className="font-semibold text-gray-800">{(item.price * item.quantity).toLocaleString()}₫</span>
                </div>
              ))}
            </div>

            <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng sản phẩm:</span>
                <span className="font-semibold text-gray-800">{totalItems}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Thành tiền:</span>
                <span className="font-bold text-orange-500">{totalPrice.toLocaleString()}₫</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vận chuyển:</span>
                <span className="font-semibold text-gray-800">Miễn phí</span>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="font-bold text-gray-800">Tổng cộng:</span>
              <span className="font-bold text-2xl text-orange-500">{totalPrice.toLocaleString()}₫</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
