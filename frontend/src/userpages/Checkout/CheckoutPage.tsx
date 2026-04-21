import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, FileText, MapPin, Phone, ShoppingCart, Wallet } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';
import LocationPickerMap from '../../components/LocationPickerMap';
import Breadcrumb from '../../components/Breadcrumb';
import OrangeButton from '../../components/OrangeButton';
import PageTitle from '../../components/PageTitle';

interface CartItem {
  cartItemId?: string;
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

interface CartResponse {
  items: CartItem[];
  totalPrice?: number;
  totalItems?: number;
}

interface Voucher {
  code: string;
  discountType: 'Direct' | 'Percentage';
  discountAmount: number;
  minOrderValue: number;
  applicableProductId?: string;
  applicableCategoryId?: string;
}

interface CheckoutState {
  selectedItems: string[];
  appliedVoucherCode?: string;
  appliedDiscount: number;
}

const readCheckoutState = (routeState: unknown): CheckoutState => {
  const state = (routeState || {}) as Partial<CheckoutState>;
  if (Array.isArray(state.selectedItems)) {
    return {
      selectedItems: state.selectedItems,
      appliedVoucherCode: state.appliedVoucherCode,
      appliedDiscount: Number(state.appliedDiscount || 0)
    };
  }

  try {
    const stored = JSON.parse(sessionStorage.getItem('checkoutState') || '{}') as Partial<CheckoutState>;
    return {
      selectedItems: Array.isArray(stored.selectedItems) ? stored.selectedItems : [],
      appliedVoucherCode: stored.appliedVoucherCode,
      appliedDiscount: Number(stored.appliedDiscount || 0)
    };
  } catch {
    return { selectedItems: [], appliedDiscount: 0 };
  }
};

const readCheckoutVoucherCode = () => {
  try {
    const stored = JSON.parse(sessionStorage.getItem('checkoutVoucherState') || '{}') as { voucherCode?: string };
    return stored.voucherCode || '';
  } catch {
    return '';
  }
};

const persistCheckoutVoucherCode = (code: string) => {
  if (code) {
    sessionStorage.setItem('checkoutVoucherState', JSON.stringify({ voucherCode: code }));
  } else {
    sessionStorage.removeItem('checkoutVoucherState');
  }
};

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'vnpay'>('cod');
  const [formData, setFormData] = useState({
    shippingAddress: '',
    phoneNumber: '',
    note: '',
  });
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [voucherCode, setVoucherCode] = useState(() => readCheckoutVoucherCode());
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  const getCheckoutState = useCallback(() => readCheckoutState(location.state), [location.state]);

  const restoreVoucherFromStorage = useCallback(async () => {
    if (appliedVoucher) {
      return;
    }

    const storedVoucherCode = readCheckoutVoucherCode();
    if (!storedVoucherCode) {
      return;
    }

    try {
      const voucher = (await axiosClient.get(`/Vouchers/public/${storedVoucherCode}`)) as Voucher;
      setVoucherCode(voucher.code);
      setAppliedVoucher(voucher);
    } catch {
      setVoucherCode('');
      setAppliedVoucher(null);
      setAppliedDiscount(0);
      persistCheckoutVoucherCode('');
    }
  }, [appliedVoucher]);

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      const cartData: CartResponse = await axiosClient.get('/cart');
      const selectedItemIds = getCheckoutState().selectedItems;
      const selectedCartItems = selectedItemIds.length > 0
        ? cartData.items.filter(item => selectedItemIds.includes(item.bookId))
        : cartData.items;
      const checkoutItems = selectedItemIds.length > 0 && selectedCartItems.length === 0
        ? cartData.items
        : selectedCartItems;

      setCart(checkoutItems);

      if (checkoutItems.length === 0 && !readCheckoutVoucherCode()) {
        navigate('/cart');
      }
      setLoading(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Lỗi khi tải giỏ hàng!');
      navigate('/cart');
    }
  }, [getCheckoutState, navigate]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    restoreVoucherFromStorage();
  }, [restoreVoucherFromStorage]);

  useEffect(() => {
    const loadVouchers = async () => {
      try {
        const data = (await axiosClient.get('/Vouchers/active')) as Voucher[];
        setAvailableVouchers(data || []);
      } catch {
        setAvailableVouchers([]);
      }
    };

    loadVouchers();
  }, []);

  useEffect(() => {
    if (appliedVoucher || availableVouchers.length === 0) {
      return;
    }

    try {
      const stored = JSON.parse(sessionStorage.getItem('checkoutVoucherState') || '{}') as { voucherCode?: string };
      if (stored.voucherCode) {
        const voucher = availableVouchers.find(v => v.code === stored.voucherCode);
        if (voucher) {
          setVoucherCode(voucher.code);
          setAppliedVoucher(voucher);
        } else {
          restoreVoucherFromStorage();
        }
      }
    } catch {
      sessionStorage.removeItem('checkoutVoucherState');
    }
  }, [appliedVoucher, availableVouchers, restoreVoucherFromStorage]);

  useEffect(() => {
    const checkoutState = readCheckoutState(location.state);
    if (checkoutState.selectedItems.length > 0 || checkoutState.appliedVoucherCode) {
      sessionStorage.setItem('checkoutState', JSON.stringify(checkoutState));
    }
  }, [location.state]);

  useEffect(() => {
    const refreshCheckoutCart = () => {
      setSubmitting(false);
      loadCart();
      restoreVoucherFromStorage();
    };

    const handlePageShow = () => {
      refreshCheckoutCart();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshCheckoutCart();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', refreshCheckoutCart);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', refreshCheckoutCart);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadCart, restoreVoucherFromStorage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const getPrice = (item: CartItem) => item.discountedPrice ?? item.price;

  const totalPrice = cart.reduce((sum, item) => sum + getPrice(item) * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const appliedVoucherCode = appliedVoucher?.code;

  const handleApplyVoucher = async () => {
    if (!voucherCode) {
      toast.error('Vui lòng chọn mã giảm giá!');
      return;
    }

    try {
      const data = (await axiosClient.get(`/Vouchers/public/${voucherCode}`)) as Voucher;
      const orderTotal = cart.reduce((sum, item) => sum + getPrice(item) * item.quantity, 0);

      if (orderTotal < data.minOrderValue) {
        toast.error(`Đơn hàng chưa đạt mức tối thiểu (${data.minOrderValue.toLocaleString('vi-VN')}₫)!`);
        return;
      }

      let applicableTotal = 0;
      let hasAlreadyHardcodedVoucher = false;

      cart.forEach(item => {
        let isApplicable = true;
        if (item.discountVoucherCode === data.code) {
          isApplicable = false;
          hasAlreadyHardcodedVoucher = true;
        }

        if (isApplicable) {
          applicableTotal += getPrice(item) * item.quantity;
        }
      });

      if (applicableTotal === 0) {
        toast.error(hasAlreadyHardcodedVoucher
          ? 'Sản phẩm đã được admin áp mã này rồi, không thể dùng lại!'
          : 'Mã giảm giá này không áp dụng cho các sản phẩm đã chọn!');
        return;
      }

      setAppliedVoucher(data);
      persistCheckoutVoucherCode(data.code);
      toast.success('Áp dụng mã giảm giá thành công!');
    } catch (error) {
      const axiosError = error as any;
      setAppliedVoucher(null);
      setAppliedDiscount(0);
      persistCheckoutVoucherCode('');
      toast.error(axiosError.response?.data?.message || 'Mã giảm giá không hợp lệ!');
    }
  };

  useEffect(() => {
    if (!appliedVoucher || cart.length === 0) {
      setAppliedDiscount(0);
      return;
    }

    const orderTotal = cart.reduce((sum, item) => sum + getPrice(item) * item.quantity, 0);
    if (orderTotal < appliedVoucher.minOrderValue) {
      toast.info(`Voucher đã bị gỡ do đơn hàng chưa đạt mức tối thiểu (${appliedVoucher.minOrderValue.toLocaleString('vi-VN')}₫)`);
      setAppliedVoucher(null);
      setAppliedDiscount(0);
      persistCheckoutVoucherCode('');
      return;
    }

    let applicableTotal = 0;
    let hasAlreadyHardcodedVoucher = false;

    cart.forEach(item => {
      let isApplicable = true;
      if (item.discountVoucherCode === appliedVoucher.code) {
        isApplicable = false;
        hasAlreadyHardcodedVoucher = true;
      }

      if (isApplicable) {
        applicableTotal += getPrice(item) * item.quantity;
      }
    });

    if (applicableTotal === 0) {
      toast.info(hasAlreadyHardcodedVoucher
        ? 'Voucher đã bị gỡ vì các sản phẩm đã có mã admin.'
        : 'Voucher đã bị gỡ do thay đổi sản phẩm trong giỏ.');
      setAppliedVoucher(null);
      setAppliedDiscount(0);
      persistCheckoutVoucherCode('');
      return;
    }

    const discount = appliedVoucher.discountType === 'Percentage'
      ? applicableTotal * (appliedVoucher.discountAmount / 100)
      : Math.min(appliedVoucher.discountAmount, applicableTotal);

    setAppliedDiscount(discount);
  }, [appliedVoucher, cart]);

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
        voucherCode: appliedVoucherCode,
      };

      if (paymentMethod === 'vnpay') {
        sessionStorage.setItem('checkoutState', JSON.stringify({
          selectedItems: cart.map(item => item.bookId)
        }));
        if (appliedVoucherCode) {
          persistCheckoutVoucherCode(appliedVoucherCode);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = await axiosClient.post('/Payments/vnpay/create', { order: orderData });
        if (!response.paymentUrl) {
          throw new Error('Không tạo được liên kết thanh toán VNPAY.');
        }

        window.location.href = response.paymentUrl;
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await axiosClient.post('/Orders', orderData);
      
      // Remove only the purchased items from cart, not all items
      try {
        for (const item of cart) {
          if (item.cartItemId) {
            await axiosClient.delete(`/cart/items/${item.cartItemId}`);
          }
        }
      } catch (error) {
        console.error('Error removing items from cart:', error);
        // If deletion fails, still proceed
      }
      
      // Dispatch custom event to update badge
      window.dispatchEvent(new Event('cart-updated'));
      persistCheckoutVoucherCode('');
      
      toast.success('Đơn hàng đã được tạo thành công!');
      navigate(`/orders?orderId=${response.orderId}`);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosError = error as any;
      toast.error(axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || 'Lỗi khi tạo đơn hàng!');
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
        <Breadcrumb
          items={[
            { label: 'Trang chủ', to: '/' },
            { label: 'Giỏ hàng', to: '/cart' },
            { label: 'Thanh toán' }
          ]}
        />
        <PageTitle title="Thanh Toán" />
        <div className="text-center">
          <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Giỏ hàng trống</h1>
          <OrangeButton to="/products" className="rounded-lg px-6 py-2 normal-case">
            Quay lại mua sắm
          </OrangeButton>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', to: '/' },
          { label: 'Giỏ hàng', to: '/cart' },
          { label: 'Thanh toán' }
        ]}
      />
      <PageTitle title="Thanh Toán" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Thông tin giao hàng</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Địa chỉ giao hàng *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                  <textarea
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ giao hàng hoặc chọn từ bản đồ bên dưới"
                    rows={3}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              {/* Location Picker Map */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <LocationPickerMap 
                  onLocationSelect={(address) => setFormData(prev => ({ ...prev, shippingAddress: address }))} 
                />
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

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Phương thức thanh toán</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`border p-4 rounded-lg cursor-pointer transition ${paymentMethod === 'cod' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="sr-only"
                    />
                    <span className="flex items-center gap-2 font-bold text-gray-800">
                      <Wallet size={20} className="text-orange-500" />
                      Thanh toán khi nhận hàng
                    </span>
                    <span className="block text-sm text-gray-500 mt-1">Tạo đơn và thanh toán trực tiếp khi giao hàng.</span>
                  </label>

                  <label className={`border p-4 rounded-lg cursor-pointer transition ${paymentMethod === 'vnpay' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="vnpay"
                      checked={paymentMethod === 'vnpay'}
                      onChange={() => setPaymentMethod('vnpay')}
                      className="sr-only"
                    />
                    <span className="flex items-center gap-2 font-bold text-gray-800">
                      <CreditCard size={20} className="text-blue-500" />
                      VNPAY Sandbox
                    </span>
                    <span className="block text-sm text-gray-500 mt-1">Chuyển sang cổng thanh toán test của VNPAY.</span>
                  </label>
                </div>
              </div>
            </div>

            <OrangeButton type="submit" disabled={submitting} className="mt-6 w-full rounded-lg py-3 normal-case disabled:bg-gray-400">
              {submitting ? 'Đang xử lý...' : paymentMethod === 'vnpay' ? 'Thanh toán qua VNPAY' : 'Xác nhận đơn hàng'}
            </OrangeButton>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow sticky top-20">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Tóm tắt đơn hàng</h2>

            <div className="space-y-3 mb-6 pb-6 border-b border-gray-200 max-h-96 overflow-y-auto">
              {cart.map(item => (
                <div key={item.bookId} className="flex justify-between text-sm">
                  <span className="text-gray-600 leading-5 break-words">{item.bookTitle} x{item.quantity}</span>
                  <span className="font-semibold text-gray-800">{(getPrice(item) * item.quantity).toLocaleString()}₫</span>
                </div>
              ))}
            </div>

            <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng sản phẩm:</span>
                <span className="font-semibold text-gray-800">{totalItems}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tạm tính:</span>
                <span className="font-bold text-orange-500">{totalPrice.toLocaleString()}₫</span>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <label className="block text-sm font-bold text-gray-700 mb-2">Mã giảm giá</label>
                <div className="flex gap-2">
                  <select
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    disabled={!!appliedVoucher || availableVouchers.length === 0 || submitting}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{availableVouchers.length > 0 ? '-- Chọn mã giảm giá --' : 'Không có mã giảm giá nào'}</option>
                    {availableVouchers.map(v => (
                      <option key={v.code} value={v.code}>
                        [{v.code}] Giảm {v.discountType === 'Percentage' ? v.discountAmount + '%' : v.discountAmount.toLocaleString('vi-VN') + 'đ'} - Đơn từ {v.minOrderValue.toLocaleString('vi-VN')}đ
                      </option>
                    ))}
                  </select>
                  {!appliedVoucher ? (
                    <button
                      type="button"
                      onClick={handleApplyVoucher}
                      className="bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white font-bold px-4 py-2 rounded-lg whitespace-nowrap transition-colors"
                      disabled={!voucherCode || submitting}
                    >
                      Áp dụng
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedVoucher(null);
                        setAppliedDiscount(0);
                        setVoucherCode('');
                        persistCheckoutVoucherCode('');
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg whitespace-nowrap transition-colors"
                      disabled={submitting}
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </div>
              {appliedVoucherCode && appliedDiscount > 0 && (
                <div className="flex justify-between text-green-600 mt-2">
                  <span className="font-semibold">Giảm giá ({appliedVoucherCode}):</span>
                  <span className="font-bold">- {appliedDiscount.toLocaleString()}₫</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Vận chuyển:</span>
                <span className="font-semibold text-gray-800">Miễn phí</span>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="font-bold text-gray-800">Tổng cộng:</span>
              <span className="font-bold text-2xl text-orange-500">{Math.max(0, totalPrice - appliedDiscount).toLocaleString()}₫</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



