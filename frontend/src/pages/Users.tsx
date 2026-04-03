import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Edit, Lock, Unlock, Eye, Users as UsersIcon, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import { getCurrentUserId } from '../utils/tokenUtils';
import type { User } from '../types';
import Modal from '../components/ui/Modal';
import DetailModal from '../components/ui/DetailModal';
import Button from '../components/ui/Button';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState('Customer');

  // Lấy userId của user hiện tại từ JWT token
  const currentUserId = useMemo(() => getCurrentUserId(), []);

  const fetchUsers = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await axiosClient.get('/Users');
      setUsers(data);
    } catch {
      toast.error('Lỗi khi tải danh sách người dùng!');
    }
  }, []);

  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers(); 
  }, [fetchUsers]);

  const filteredUsers = users.filter((user) => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDetail = (user: User) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const handleOpenRoleModal = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsRoleModalOpen(true);
  };

  const handleToggleLock = async (user: User) => {
    try {
      await axiosClient.put(`/Users/${user.userId}/toggle-lock`);
      toast.success(user.isLocked ? 'Đã mở khóa tài khoản!' : 'Đã khóa tài khoản!');
      fetchUsers(); // Refresh lại danh sách
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Có lỗi khi cập nhật!');
    }
  };

  const handleChangeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await axiosClient.put(`/Users/${selectedUser.userId}/role`, { role: newRole });
      toast.success('Đã cập nhật quyền thành công!');
      setIsRoleModalOpen(false);
      fetchUsers(); // Refresh lại danh sách
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Có lỗi khi cập nhật quyền!');
    }
  };

  return (
    <div className="bg-white shadow-sm p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-100 pb-4 gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
          <UsersIcon className="text-orange-500 flex-shrink-0" size={24} /> Quản lý Tài khoản Người dùng
        </h2>
      </div>

      {/* TÌM KIẾM */}
      <div className="mb-6 flex gap-2">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên, email hoặc username..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-slate-300 px-4 py-2 pl-10 focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600 uppercase">
              <th className="p-4 font-semibold">Username</th>
              <th className="p-4 font-semibold">Tên đầy đủ</th>
              <th className="p-4 font-semibold">Email</th>
              <th className="p-4 font-semibold">Quyền</th>
              <th className="p-4 font-semibold">Trạng thái</th>
              <th className="p-4 font-semibold">Ngày tạo</th>
              <th className="p-4 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {filteredUsers.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">Không tìm thấy người dùng nào.</td></tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.userId} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-semibold text-slate-900">{user.username}</td>
                  <td className="p-4">{user.fullName}</td>
                  <td className="p-4 text-sm">{user.email}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      user.role === 'Admin' 
                        ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {user.role === 'Admin' ? '👑 Admin' : '👤 Khách hàng'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      user.isLocked
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      {user.isLocked ? '🔒 Khóa' : '🔓 Bình thường'}
                    </span>
                  </td>
                  <td className="p-4 text-sm">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="p-4 flex justify-center gap-2">
                    <button 
                      onClick={() => handleOpenDetail(user)}
                      className="flex items-center gap-1 text-orange-600 hover:text-orange-800 font-medium"
                      title="Xem chi tiết"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => handleOpenRoleModal(user)}
                      disabled={user.userId === currentUserId}
                      className={`flex items-center gap-1 font-medium ${
                        user.userId === currentUserId
                          ? 'text-slate-400 cursor-not-allowed'
                          : 'text-blue-600 hover:text-blue-800'
                      }`}
                      title={user.userId === currentUserId ? 'Không thể thay đổi quyền của chính mình' : 'Thay đổi quyền'}
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleToggleLock(user)}
                      disabled={user.userId === currentUserId}
                      className={`flex items-center gap-1 font-medium ${
                        user.userId === currentUserId ? 'cursor-not-allowed' : ''
                      }`}
                      title={
                        user.userId === currentUserId 
                          ? 'Không thể khóa/mở khóa tài khoản của chính mình'
                          : (user.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản')
                      }
                    >
                      {user.isLocked ? (
                        <Unlock size={18} className={user.userId === currentUserId ? 'text-slate-400' : 'text-red-600 hover:text-red-800'} />
                      ) : (
                        <Lock size={18} className={user.userId === currentUserId ? 'text-slate-400' : 'text-green-600 hover:text-green-800'} />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL XEM CHI TIẾT */}
      <DetailModal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        title={`Chi tiết tài khoản: ${selectedUser?.username}`}
        sections={selectedUser ? [
          {
            title: 'Thông tin cá nhân',
            bgColor: 'orange',
            items: [
              { label: 'Username', value:selectedUser.username },
              { label: 'Tên đầy đủ', value: selectedUser.fullName || 'Chưa cập nhật' },
              { label: 'Email', value: selectedUser.email },
              { label: 'Số điện thoại', value: selectedUser.phoneNumber || 'Chưa cập nhật' },
              { label: 'Địa chỉ', value: selectedUser.address || 'Chưa cập nhật' }
            ]
          },
          {
            title: 'Thông tin hệ thống',
            items: [
              { label: 'Quyền', value: selectedUser.role },
              { label: 'Trạng thái', value: <span className={selectedUser.isLocked ? 'text-red-600' : 'text-green-600'}>{selectedUser.isLocked ? 'Đã khóa' : 'Bình thường'}</span> },
              { label: 'Ngày tạo', value: new Date(selectedUser.createdAt).toLocaleString('vi-VN') }
            ]
          }
        ] : []}
      />

      {/* MODAL THAY ĐỔI QUYỀN */}
      <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title={`Thay đổi quyền: ${selectedUser?.username}`}>
        {selectedUser && (
          <form onSubmit={handleChangeRole} className="flex flex-col gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600 mb-2">Quyền hiện tại: <span className="font-bold text-slate-900">{selectedUser.role}</span></p>
              <label className="block text-sm font-bold text-slate-800 mb-2">Cấp quyền mới</label>
              <select 
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-orange-500 outline-none bg-white font-medium"
              >
                <option value="Customer">👤 Khách hàng</option>
                <option value="Admin">👑 Quản trị viên</option>
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="secondary"
                onClick={() => setIsRoleModalOpen(false)}
              >
                Hủy
              </Button>
              <Button 
                type="submit"
                variant="primary"
                disabled={newRole === selectedUser.role}
              >
                Lưu thay đổi
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
