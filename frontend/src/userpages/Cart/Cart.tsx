/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';
import { getGuestCart, removeFromGuestCart, updateGuestCartQuantity, clearGuestCart } from '../../utils/cartUtils';
import Breadcrumb from '../../components/Breadcrumb';
import OrangeButton from '../../components/OrangeButton';
import PageTitle from '../../components/PageTitle';
import Pagination from '../../components/Pagination';
import CompactBookSidebar from '../../components/CompactBookSidebar';

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

interface SidebarBook {
  bookId: string;
  title: string;
  price: number;
  discountedPrice?: number;
  soldQuantity?: number;
  imageUrls?: string[];
  mainImageUrl?: string;
}

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart>({ items: [] });
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [topSellingBooks, setTopSellingBooks] = useState<SidebarBook[]>([]);
  const itemsPerPage = 6;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadCart();
    loadTopSellingBooks();
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

  const loadTopSellingBooks = async () => {
    try {
      const response: SidebarBook[] = await axiosClient.get('/Books/top-selling?count=5');
      setTopSellingBooks(response || []);
    } catch {
      setTopSellingBooks([]);
    }
  };

  const removeItem = async (cartItemId: string | undefined, bookId?: string) => {
    if (!cartItemId && !bookId) {
      toast.error('Không thể xóa sản phẩm này');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      if (bookId) removeFromGuestCart(bookId);
      const guestItems = getGuestCart();
      setCart({
        items: guestItems,
        totalPrice: guestItems.reduce((sum: number, item: any) => sum + ((item.discountedPrice ?? item.price) * item.quantity), 0),
        totalItems: guestItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
      });
      window.dispatchEvent(new Event('cart-updated'));
      toast.info('Đã xóa sản phẩm khỏi giỏ hàng');
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

  const updateQuantity = async (cartItemId: string | undefined, bookId: string | undefined, newQuantity: number) => {
    if (!cartItemId && !bookId) {
      toast.error('Không thể cập nhật sản phẩm này');
      return;
    }

    if (newQuantity < 1) {
      removeItem(cartItemId, bookId);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      if (bookId) {
        const result = updateGuestCartQuantity(bookId, newQuantity);
        if (!result.success) {
          toast.error(result.message || 'Số lượng không hợp lệ');
          return;
        }
        
        const guestItems = getGuestCart();
        setCart({
          items: guestItems,
          totalPrice: guestItems.reduce((sum: number, item: any) => sum + ((item.discountedPrice ?? item.price) * item.quantity), 0),
          totalItems: guestItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
        });
        window.dispatchEvent(new Event('cart-updated'));
        return;
      }
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
      const token = localStorage.getItem('token');
      if (!token || token === 'undefined' || token === 'null') {
        clearGuestCart();
        setCart({ items: [], totalPrice: 0, totalItems: 0 });
        window.dispatchEvent(new Event('cart-updated'));
        toast.info('Đã xóa tất cả sản phẩm');
        return;
      }

      try {
        await axiosClient.delete('/cart');
        setCart({ items: [], totalPrice: 0, totalItems: 0 });
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

  const selectedCartItemsForTotal = cart.items.filter(item => selectedItems.includes(item.bookId));
  const totalPrice = selectedCartItemsForTotal.reduce((sum, item) => sum + getPrice(item) * item.quantity, 0);
  const totalItems = selectedCartItemsForTotal.reduce((sum, item) => sum + item.quantity, 0);
  const totalPages = Math.max(1, Math.ceil(cart.items.length / itemsPerPage));
  const paginatedItems = cart.items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
        <Breadcrumb
          items={[
            { label: 'Trang chủ', to: '/' },
            { label: 'Giỏ hàng' }
          ]}
        />
        <PageTitle title="Giỏ Hàng" />
        <div className="text-center">
          <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Giỏ hàng trống</h1>
          <p className="text-gray-600 mb-8">Bạn chưa thêm sản phẩm nào vào giỏ hàng</p>
          <OrangeButton to="/products" className="rounded-lg px-6 py-2 normal-case">
            Tiếp tục mua sắm
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
          { label: 'Giỏ hàng' }
        ]}
      />
      <PageTitle title="Giỏ Hàng" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          {cart.items.length > 0 && (
            <div className="mb-4 flex items-center gap-2 bg-white p-4 rounded-lg shadow">
              <input 
                type="checkbox" 
                checked={selectedItems.length === cart.items.length && cart.items.length > 0}
                onChange={toggleSelectAll}
                className="w-5 h-5 text-orange-500 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
              />
              <label className="font-semibold text-gray-700 cursor-pointer" onClick={toggleSelectAll}>Chọn tất cả các sản phẩm</label>
            </div>
          )}

          <div className={`space-y-4 ${paginatedItems.length > 3 ? 'max-h-[34rem] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
            {paginatedItems.map(item => (
              <div key={item.bookId} className="flex gap-4 bg-white p-4 rounded-lg shadow items-center">
                <input 
                  type="checkbox"
                  checked={selectedItems.includes(item.bookId)}
                  onChange={() => toggleSelectItem(item.bookId)}
                  className="w-5 h-5 text-orange-500 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                />
                {/* Image */}
                <div className="w-20 h-20 flex-shrink-0 bg-white rounded overflow-hidden border border-gray-200 p-1">
                  <img
                    src={item.imageUrl || '/placeholder.jpg'}
                    alt={item.bookTitle}
                    className="w-full h-full object-contain"
                    onError={(event) => {
                      event.currentTarget.src = '/placeholder.jpg';
                    }}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold text-gray-800 leading-5 break-words">{item.bookTitle}</h3>
                    {item.discountBadge && (
                      <div className="ml-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                        {item.discountBadge}
                      </div>
                    )}
                  </div>
                  <div className="mb-2">
                    <span className="text-lg font-bold text-orange-500">{getPrice(item).toLocaleString()}đ</span>
                    {item.discountedPrice && item.discountedPrice < item.price && (
                      <span className="text-sm text-gray-500 line-through ml-2">{item.price?.toLocaleString()}đ</span>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.cartItemId, item.bookId, item.quantity - 1)}
                      className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-sm transition"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.cartItemId, item.bookId, parseInt(e.target.value) || 1)}
                      className="w-12 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      onClick={() => updateQuantity(item.cartItemId, item.bookId, item.quantity + 1)}
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
                  onClick={() => removeItem(item.cartItemId, item.bookId)}
                  className="text-red-500 hover:text-red-700 transition flex-shrink-0"
                  title="Xóa"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

          <button
            onClick={clearCart}
            className="mt-4 text-red-500 hover:text-red-700 font-semibold transition"
          >
            Xóa tất cả
          </button>

          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h2 className="mb-4 text-xl font-bold uppercase italic text-orange-500">Tóm tắt giỏ hàng</h2>

            <div className="mb-6 space-y-3 border-b border-gray-200 pb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Số lượng sản phẩm:</span>
                <span className="font-semibold text-gray-800">{totalItems}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Thành tiền:</span>
                <span className="text-lg font-bold text-orange-500">{totalPrice.toLocaleString()}₫</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vận chuyển:</span>
                <span className="font-semibold text-gray-800">Miễn phí</span>
              </div>
            </div>

            <div className="mb-4 flex justify-between">
              <span className="font-bold text-gray-800">Tạm tính:</span>
              <span className="font-bold text-gray-800">{totalPrice.toLocaleString()}₫</span>
            </div>

            <div className="mb-6 flex justify-between">
              <span className="text-xl font-bold text-gray-800">Tổng cộng:</span>
              <span className="text-2xl font-bold text-orange-500">{totalPrice.toLocaleString()}₫</span>
            </div>

            <OrangeButton
              onClick={() => {
                const checkoutState = {
                  selectedItems
                };
                sessionStorage.setItem('checkoutState', JSON.stringify(checkoutState));
                sessionStorage.removeItem('checkoutVoucherState');
                navigate('/checkout', { state: checkoutState });
              }}
              disabled={selectedItems.length === 0 || loading}
              className="mb-3 w-full rounded-lg py-3 normal-case disabled:bg-gray-400"
            >
              Thanh toán
            </OrangeButton>

            <button
              onClick={() => navigate('/products')}
              className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-lg transition"
            >
              <ArrowLeft size={20} />
              Tiếp tục mua
            </button>
          </div>
        </div>

        <CompactBookSidebar
          title="Sách bán chạy"
          books={topSellingBooks}
          emptyText="Chưa có sách bán chạy."
          className="hidden lg:block"
        />
      </div>
    </div>
  );
}


