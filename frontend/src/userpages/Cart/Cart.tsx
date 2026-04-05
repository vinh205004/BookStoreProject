import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';

interface CartItem {
  cartItemId?: string; // Added for API reference
  bookId: string;
  bookTitle: string;
  price: number;
  quantity: number;
  imageUrl: string;
  stock?: number;
}

interface Cart {
  items: CartItem[];
  totalPrice?: number;
  totalItems?: number;
}

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart>({ items: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cartData: any = await axiosClient.get('/cart');
      // axiosClient returns data directly, not wrapped in response
      setCart({
        items: cartData.items || [],
        totalPrice: cartData.totalPrice || 0,
        totalItems: cartData.totalItems || 0
      });
      setLoading(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Lỗi khi tải giỏ hàng!');
      // Set empty cart on error
      setCart({ items: [], totalPrice: 0, totalItems: 0 });
      setLoading(false);
    }
  };

  const removeItem = async (cartItemId: string | undefined) => {
    if (!cartItemId) {
      toast.error('Không thể xóa sản phẩm này');
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cartData: any = await axiosClient.delete(`/cart/items/${cartItemId}`);
      setCart({
        items: cartData.items || [],
        totalPrice: cartData.totalPrice || 0,
        totalItems: cartData.totalItems || 0
      });
      // Dispatch custom event to update badge
      window.dispatchEvent(new Event('cart-updated'));
      toast.info('Đã xóa sản phẩm khỏi giỏ hàng');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Lỗi khi xóa sản phẩm!';
      toast.error(errorMessage);
    }
  };

  const updateQuantity = async (cartItemId: string | undefined, newQuantity: number) => {
    if (!cartItemId) {
      toast.error('Không thể cập nhật sản phẩm này');
      return;
    }

    if (newQuantity < 1) {
      removeItem(cartItemId);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cartData: any = await axiosClient.put(`/cart/items/${cartItemId}`, {
        quantity: newQuantity
      });
      setCart({
        items: cartData.items || [],
        totalPrice: cartData.totalPrice || 0,
        totalItems: cartData.totalItems || 0
      });
      // Dispatch custom event to update badge
      window.dispatchEvent(new Event('cart-updated'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Lỗi khi cập nhật số lượng!';
      toast.error(errorMessage);
    }
  };

  const clearCart = async () => {
    if (window.confirm('Bạn chắc chắn muốn xóa tất cả sản phẩm?')) {
      try {
        await axiosClient.delete('/cart');
        setCart({ items: [] });
        // Dispatch custom event to update badge
        window.dispatchEvent(new Event('cart-updated'));
        toast.info('Đã xóa tất cả sản phẩm');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        const errorMessage = error?.response?.data?.error || 'Lỗi khi xóa giỏ hàng!';
        toast.error(errorMessage);
      }
    }
  };

  const totalPrice = cart.totalPrice || cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.totalItems || cart.items.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Giỏ hàng trống</h1>
          <p className="text-gray-600 mb-8">Bạn chưa thêm sản phẩm nào vào giỏ hàng</p>
          <a
            href="/products"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            Tiếp tục mua sắm
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Giỏ hàng</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {cart.items.map(item => (
              <div key={item.bookId} className="flex gap-4 bg-white p-4 rounded-lg shadow">
                {/* Image */}
                <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                  <img
                    src={item.imageUrl || '/placeholder.jpg'}
                    alt={item.bookTitle}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 line-clamp-2 mb-1">{item.bookTitle}</h3>
                  <p className="text-lg font-bold text-orange-500 mb-2">{item.price.toLocaleString()}₫</p>

                  {/* Quantity */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                      className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-sm transition"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.cartItemId, parseInt(e.target.value) || 1)}
                      className="w-12 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-sm transition"
                    >
                      +
                    </button>
                    <span className="text-sm text-gray-600 ml-2">
                      = {(item.price * item.quantity).toLocaleString()}₫
                    </span>
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => removeItem(item.cartItemId)}
                  className="text-red-500 hover:text-red-700 transition flex-shrink-0"
                  title="Xóa"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={clearCart}
            className="mt-4 text-red-500 hover:text-red-700 font-semibold transition"
          >
            Xóa tất cả
          </button>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow sticky top-20">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Tóm tắt đơn hàng</h2>

            <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">Số lượng sản phẩm:</span>
                <span className="font-semibold text-gray-800">{totalItems}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Thành tiền:</span>
                <span className="font-bold text-lg text-orange-500">{totalPrice.toLocaleString()}₫</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vận chuyển:</span>
                <span className="font-semibold text-gray-800">Miễn phí</span>
              </div>
            </div>

            <div className="flex justify-between mb-6">
              <span className="font-bold text-gray-800">Tổng cộng:</span>
              <span className="font-bold text-2xl text-orange-500">{totalPrice.toLocaleString()}₫</span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition mb-3"
            >
              Thanh toán
            </button>

            <button
              onClick={() => navigate('/products')}
              className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-lg transition"
            >
              <ArrowLeft size={20} />
              Tiếp tục mua
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
