import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const token = localStorage.getItem('token');
  
  // Chặn token null, undefined, hoặc chuỗi toàn dấu cách
  if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
    return <Navigate to="/login" replace />;
  }

  // Nếu token hợp lệ, trả về Outlet (nested route)
  // Routing logic (Admin vs Customer) để trong từng route definition
  return <Outlet />;
}