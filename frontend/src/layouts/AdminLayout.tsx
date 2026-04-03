import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Layers, Users, ShoppingCart, Ticket, LogOut, UserPen, Building2, Clock, Menu, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const menuItems = [
    { path: '/admin', name: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
    { path: '/admin/categories', name: 'Danh mục', icon: <Layers size={20} /> },
    { path: '/admin/authors', name: 'Tác giả', icon: <UserPen size={20} /> },
    { path: '/admin/publishers', name: 'Nhà xuất bản', icon: <Building2 size={20} /> },
    { path: '/admin/books', name: 'Sách', icon: <BookOpen size={20} /> },
    { path: '/admin/vouchers', name: 'Voucher', icon: <Ticket size={20} /> },
    { path: '/admin/orders', name: 'Đơn hàng', icon: <ShoppingCart size={20} /> },
    { path: '/admin/users', name: 'Khách hàng', icon: <Users size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token'); // Xóa vé
    toast.info('Đã đăng xuất khỏi hệ thống!');
    navigate('/login'); // Đá về trang đăng nhập
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      
      {/* Overlay khi sidebar mở (chỉ trên mobile) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* CỘT SIDEBAR BÊN TRÁI */}
      <aside className={`bg-orange-500 text-black flex flex-col shadow-xl z-20 border-r border-orange-600 fixed lg:static h-full transition-all duration-300 overflow-hidden ${
        sidebarOpen 
          ? 'w-64 translate-x-0' 
          : 'w-64 -translate-x-full lg:translate-x-0 lg:w-0'
      }`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-orange-600 px-3 lg:px-4">
          <h1 className="text-lg lg:text-xl font-bold tracking-wider text-black">TIẾN THỌ ADMIN</h1>
        </div>
        
        {/* Menu Navigation */}
        <nav className="flex-1 px-2 lg:px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            // Kiểm tra xem URL hiện tại có khớp với đường dẫn của menu không
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-2 lg:px-4 py-3 transition-all duration-200 rounded ${
                  isActive 
                    ? 'bg-orange-600 text-black shadow-md font-semibold' 
                    : 'text-black hover:bg-orange-600 hover:text-black font-medium'
                }`}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Nút Đăng xuất nằm dưới đáy */}
        <div className="p-2 lg:p-4 border-t border-orange-600">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-2 lg:px-4 py-3 w-full text-red-600 hover:bg-red-500 hover:text-white transition-colors font-medium rounded"
          >
            <LogOut size={20} />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* KHU VỰC NỘI DUNG CHÍNH BÊN PHẢI */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 gap-4">
          
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Toggle button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              title={sidebarOpen ? 'Đóng sidebar' : 'Mở sidebar'}
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200 flex-shrink-0">
                A
              </div>
              <div className="flex flex-col min-w-0 hidden sm:block">
                <span className="text-xs sm:text-sm font-bold text-slate-700 leading-tight truncate">Admin Tiến Thọ</span>
                <span className="text-xs text-green-600 font-medium">Đang hoạt động</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 text-slate-600 text-xs sm:text-sm flex-shrink-0">
            <Clock size={16} className="text-orange-500 hidden sm:inline" />
            <span className="font-medium hidden sm:inline">{currentDateTime.toLocaleString('vi-VN')}</span>
            <span className="font-medium sm:hidden">{currentDateTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </header>

        {/* Khu vực render các trang con (Categories, Books...) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

    </div>
  );
}