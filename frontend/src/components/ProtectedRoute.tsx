import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const token = localStorage.getItem('token');
  
  //console.log("=== KIỂM TRA BẢO VỆ ===");
  //console.log("Giá trị Token hiện tại:", token);

  // Chặn token null, undefined, hoặc chuỗi toàn dấu cách
  if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
    console.log("=> Bắt được vé giả! Đá về Login ngay!");
    return <Navigate to="/login" replace />;
  }

  console.log("=> Vé chuẩn, mở cửa cho vào Admin!");
  return <Outlet />;
}