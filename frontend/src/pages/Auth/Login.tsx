import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';
import { decodeToken } from '../../utils/tokenUtils';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await axiosClient.post('/Auth/login', {
        username,
        password,
      });

      const token = response.token;
      
      // Decode token để lấy role
      const payload = decodeToken(token);
      const role = payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

      // Lưu token
      localStorage.setItem('token', token);

      toast.success('Đăng nhập thành công!');

      // Route dựa vào role
      if (role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosError = error as any;
      toast.error(axiosError.response?.data?.error || 'Đăng nhập thất bại. Kiểm tra lại thông tin!');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterRedirect = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-600">TIẾN THỌ BOOKSTORE</h1>
          <p className="text-gray-600 mt-2">Quản lý bán sách trực tuyến</p>
        </div>

        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Đăng Nhập</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Nhập tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Thí dụ admin: admin_tientho / Pass: 123456</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-medium py-2 px-4 rounded-md transition-colors ${
              loading ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Chưa có tài khoản?{' '}
            <button
              onClick={handleRegisterRedirect}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Đăng ký
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
