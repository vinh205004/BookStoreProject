/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  discountedPrice?: number;
  discountBadge?: string;
  discountVoucherCode?: string;
  categoryId?: string;
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
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [books, setBooks] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);

  useEffect(() => {
    const loadInitData = async () => {
      try {
        const data: any = await axiosClient.get('/Books');
        setBooks(data || []);
      } catch {
        console.error('Failed to load books for cart');
      }

      try {
        const data: any = await axiosClient.get('/Vouchers/active');
        setAvailableVouchers(data || []);
      } catch (e) {
        console.log('Failed to fetch active vouchers', e);
      }
    };
    loadInitData();
  }, []);

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


  const getPrice = (item: CartItem) => {
    return item.discountedPrice ?? item.price;
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode) {
      toast.error('Vui lòng nhập mã giảm giá!');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 sản phẩm!');
      return;
    }
    
    try {
      const data = (await axiosClient.get(`/Vouchers/public/${voucherCode}`)) as any;
      
      // Check xem có sản phẩm nào áp được voucher không
      const selectedCartItems = cart.items.filter(item => selectedItems.includes(item.bookId));
      const hasApplicable = selectedCartItems.some(item => item.discountVoucherCode !== data.code);
      
      if (!hasApplicable) {
        // Tất cả sản phẩm đều ko áp được (đều có hardcoded voucher này hoặc ko match điều kiện)
        const allHaveHardcodedVoucher = selectedCartItems.every(item => item.discountVoucherCode === data.code);
        if (allHaveHardcodedVoucher) {
          toast.error('Sản phẩm đã được admin áp mã này rồi, không thể dùng lại!');
        } else {
          toast.error('Mã giảm giá này không áp dụng cho các sản phẩm được chọn!');
        }
        return;
      }
      
      setAppliedVoucher(data);
      toast.success('Áp dụng mã giảm giá thành công!');
    } catch (error: any) {
      setAppliedVoucher(null);
      setDiscountAmount(0);
      toast.error(error.response?.data?.message || 'Mã giảm giá không hợp lệ!');
    }
  };

  useEffect(() => {
    if (!appliedVoucher || !cart.items.length) {
      setDiscountAmount(0);
      return;
    }

    const selectedCartItems = cart.items.filter(item => selectedItems.includes(item.bookId));
    let applicableTotal = 0;
    let hasAlreadyHardcodedVoucher = false;
    const orderTotal = selectedCartItems.reduce((sum, item) => sum + getPrice(item) * item.quantity, 0);

    if (orderTotal < appliedVoucher.minOrderValue) {
      toast.error(`Đơn hàng (${selectedCartItems.length} sản phẩm) chưa đạt mức tối thiểu (${appliedVoucher.minOrderValue.toLocaleString('vi-VN')}₫)!`);
      setAppliedVoucher(null);
      setDiscountAmount(0);
      return;
    }

    selectedCartItems.forEach(item => {
      let isApplicable = true;

      // Chỉ check double-dip: sản phẩm đã có voucher này cứng rồi
      if (item.discountVoucherCode === appliedVoucher.code) {
        isApplicable = false;
        hasAlreadyHardcodedVoucher = true;
      }

      if (isApplicable) {
        applicableTotal += getPrice(item) * item.quantity;
      }
    });

    let discount = 0;
    if (appliedVoucher.discountType === 'Percentage') {
      discount = applicableTotal * (appliedVoucher.discountAmount / 100);
    } else {
      discount = Math.min(appliedVoucher.discountAmount, applicableTotal);
    }
    
    // Nếu không có item nào áp được voucher này
    if (applicableTotal === 0) {
      if (hasAlreadyHardcodedVoucher) {
        toast.error('Sản phẩm đã được admin áp mã này rồi, không thể dùng lại!');
      } else {
        toast.error('Mã giảm giá này không áp dụng cho các sản phẩm được chọn!');
      }
      setAppliedVoucher(null);
      setDiscountAmount(0);
      return;
    }
    
    setDiscountAmount(discount);
  }, [appliedVoucher, cart.items, books, selectedItems]);

  const selectedCartItemsForTotal = cart.items.filter(item => selectedItems.includes(item.bookId));
  const totalPrice = selectedCartItemsForTotal.reduce((sum, item) => sum + getPrice(item) * item.quantity, 0);
  const totalItems = selectedCartItemsForTotal.reduce((sum, item) => sum + item.quantity, 0);

  const toggleSelectItem = (bookId: string) => {
    setSelectedItems(prev => 
      prev.includes(bookId) ? prev.filter(id => id !== bookId) : [...prev, bookId]
    );
  };
  
  const toggleSelectAll = () => {
    if (selectedItems.length === cart.items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cart.items.map(item => item.bookId));
    }
  };

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
            {cart.items.length > 0 && (
              <div className="flex items-center gap-2 mb-4 bg-white p-4 rounded-lg shadow">
                <input 
                  type="checkbox" 
                  checked={selectedItems.length === cart.items.length && cart.items.length > 0}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 text-orange-500 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                />
                <label className="font-semibold text-gray-700 cursor-pointer" onClick={toggleSelectAll}>Chọn tất cả các sản phẩm</label>
              </div>
            )}
            {cart.items.map(item => (
              <div key={item.bookId} className="flex gap-4 bg-white p-4 rounded-lg shadow items-center">
                <input 
                  type="checkbox"
                  checked={selectedItems.includes(item.bookId)}
                  onChange={() => toggleSelectItem(item.bookId)}
                  className="w-5 h-5 text-orange-500 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                />
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
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold text-gray-800 line-clamp-2">{item.bookTitle}</h3>
                    {item.discountBadge && (
                      <div className="ml-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                        {item.discountBadge}
                      </div>
                    )}
                  </div>
                  <div className="mb-2">
                    <span className="text-lg font-bold text-orange-500">{getPrice(item).toLocaleString()}đ</span>
                    {item.discountedPrice && (
                      <span className="text-sm text-gray-500 line-through ml-2">{item.price?.toLocaleString()}đ</span>
                    )}
                  </div>

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
                      = {(getPrice(item) * item.quantity).toLocaleString()}₫
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

            <div className="flex justify-between mb-4">
              <span className="font-bold text-gray-800">Tạm tính:</span>
              <span className="font-bold text-gray-800">{totalPrice.toLocaleString()}₫</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600 mb-4">
                <span className="font-semibold">Giảm giá {appliedVoucher ? `(${appliedVoucher.code})` : ''}:</span>
                <span className="font-bold">- {discountAmount.toLocaleString()}₫</span>
              </div>
            )}
            
            <div className="mb-6 border-b pb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Mã giảm giá</label>
              <div className="flex gap-2">
                <select
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  disabled={!!appliedVoucher || availableVouchers.length === 0}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">{availableVouchers.length > 0 ? '-- Chọn mã giảm giá --' : 'Không có mã giảm giá nào'}</option>
                  {availableVouchers.map(v => (
                    <option key={v.code} value={v.code}>
                      [{v.code}] Giảm {v.discountType === 'Percentage' ? v.discountAmount + '%' : v.discountAmount.toLocaleString() + 'đ'} - Đơn từ {v.minOrderValue.toLocaleString()}đ {v.applicableProductId ? '(Hỗ trợ sản phẩm định sẵn)' : ''}
                    </option>
                  ))}
                </select>
                {!appliedVoucher ? (
                  <button 
                    type="button"
                    onClick={handleApplyVoucher} 
                    className="bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white font-bold px-4 py-2 rounded-lg whitespace-nowrap transition-colors"
                    disabled={!voucherCode || selectedItems.length === 0}
                  >
                    Áp dụng
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={() => { setAppliedVoucher(null); setVoucherCode(''); }} 
                    className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg whitespace-nowrap transition-colors"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-between mb-6">
              <span className="font-bold text-xl text-gray-800">Tổng cộng:</span>
              <span className="font-bold text-2xl text-orange-500">{Math.max(0, totalPrice - discountAmount).toLocaleString()}₫</span>
            </div>

            <button
              onClick={() => navigate('/checkout', { state: { appliedVoucherCode: appliedVoucher ? voucherCode : undefined, appliedDiscount: discountAmount, selectedItems } })}
              disabled={selectedItems.length === 0 || loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition mb-3"
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
