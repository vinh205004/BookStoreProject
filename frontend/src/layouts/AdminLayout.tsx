import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Layers, Users, ShoppingCart, Ticket, LogOut, UserPen, Building2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Khai báo mảng menu để tự động render, sau này thêm bớt cực dễ
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
      
      {/* CỘT SIDEBAR BÊN TRÁI */}
      <aside className="w-64 bg-orange-500 text-black flex flex-col shadow-xl z-20">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-orange-600">
          <h1 className="text-xl font-bold tracking-wider text-black">TIẾN THỌ ADMIN</h1>
        </div>
        
        {/* Menu Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            // Kiểm tra xem URL hiện tại có khớp với đường dẫn của menu không
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-orange-600 text-black shadow-md font-semibold' 
                    : 'text-black hover:bg-orange-600 hover:text-black font-medium'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Nút Đăng xuất nằm dưới đáy */}
        <div className="p-4 border-t border-orange-600">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-500 hover:text-white transition-colors font-medium"
          >
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* KHU VỰC NỘI DUNG CHÍNH BÊN PHẢI */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8 z-10">
          <h2 className="text-xl font-semibold text-slate-800">
            {/* Tự động lấy tên trang dựa trên URL hiện tại */}
            {menuItems.find(m => m.path === location.pathname)?.name || 'Quản trị hệ thống'}
          </h2>
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
              A
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-700 leading-tight">Admin Tiến Thọ</span>
              <span className="text-xs text-green-600 font-medium">Đang hoạt động</span>
            </div>
          </div>
        </header>

        {/* Khu vực render các trang con (Categories, Books...) */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

    </div>
  );
}