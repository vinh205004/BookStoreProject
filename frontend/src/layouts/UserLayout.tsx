import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Home, BookOpen } from 'lucide-react';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import SearchDropdown from '../components/SearchDropdown';
import CategoryMenu from '../components/CategoryMenu';

export default function UserLayout() {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  const updateCartCount = async () => {
    const token = localStorage.getItem('token');
    // Nếu không có token, đừng gọi API
    if (!token || token === 'undefined' || token === 'null') {
      setCartCount(0);
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await axiosClient.get('/cart');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const count = response.totalItems || response.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
      setCartCount(count);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Nếu 401 (token expired), logout
      if (error?.response?.status === 401) {
        localStorage.removeItem('token');
        setCartCount(0);
      } else {
        // Lỗi khác, set cart = 0 thôi
        setCartCount(0);
      }
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updateCartCount();
  }, []);

  // Listen for custom cart-updated event (CHỈ update nếu đã login)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return; // Đừng load cart nếu chưa login
    
    // Callback-based updates to avoid cascading renders
    const handleCartUpdate = () => {
      updateCartCount();
    };

    // Call once on mount
    handleCartUpdate();

    // Custom event from add-to-cart operations
    window.addEventListener('cart-updated', handleCartUpdate);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.info('Đã đăng xuất khỏi hệ thống!');
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* HEADER */}
      <header className="bg-orange-500 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-90 transition">
              <BookOpen size={28} />
              <span className="hidden sm:inline">Tiến Thọ BookStore</span>
            </Link>

            {/* Search Bar */}
            <SearchDropdown />

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to="/cart"
                className="p-2 hover:bg-orange-600 rounded-lg transition relative"
                title="Giỏ hàng"
              >
                <ShoppingCart size={24} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              <Link
                to="/profile"
                className="p-2 hover:bg-orange-600 rounded-lg transition"
                title="Tài khoản"
              >
                <User size={24} />
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 hover:bg-orange-600 rounded-lg transition"
                title="Đăng xuất"
              >
                <LogOut size={24} />
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          {/* Removed - use SearchDropdown instead */}
        </div>

        {/* Navigation Bar */}
        <nav className="border-t border-orange-600 bg-orange-600 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="flex items-center gap-4 sm:gap-8 h-12 overflow-visible">
              <Link
                to="/"
                className="flex items-center gap-2 text-white hover:bg-orange-700 px-3 py-2 rounded transition whitespace-nowrap"
              >
                <Home size={18} />
                <span className="hidden sm:inline">Trang chủ</span>
              </Link>
              <CategoryMenu />
              <Link
                to="/products"
                className="flex items-center gap-2 text-white hover:bg-orange-700 px-3 py-2 rounded transition whitespace-nowrap"
              >
                <BookOpen size={18} />
                <span className="hidden sm:inline">Tất cả sách</span>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-300 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* About */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Về Tiến Thọ</h3>
              <p className="text-sm">Cửa hàng sách trực tuyến chuyên cung cấp các đầu sách chất lượng với giá cạnh tranh.</p>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Danh Mục</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/products?category=fiction" className="hover:text-white transition">Tiểu thuyết</Link></li>
                <li><Link to="/products?category=education" className="hover:text-white transition">Giáo dục</Link></li>
                <li><Link to="/products?category=business" className="hover:text-white transition">Kinh doanh</Link></li>
                <li><Link to="/products?category=selfhelp" className="hover:text-white transition">Kỹ năng sống</Link></li>
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Hỗ Trợ</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/faq" className="hover:text-white transition">Câu hỏi thường gặp</Link></li>
                <li><Link to="/shipping" className="hover:text-white transition">Vận chuyển</Link></li>
                <li><Link to="/returns" className="hover:text-white transition">Chính sách hoàn trả</Link></li>
                <li><Link to="/contact" className="hover:text-white transition">Liên hệ</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Liên Hệ</h3>
              <ul className="space-y-2 text-sm">
                <li>Email: info@tienthobookstore.vn</li>
                <li>Điện thoại: (028) 1234 5678</li>
                <li>Địa chỉ: TP. Hồ Chí Minh</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-8 text-center text-sm">
            <p>&copy; 2026 Tiến Thọ BookStore. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
