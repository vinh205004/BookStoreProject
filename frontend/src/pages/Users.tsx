import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Edit, Lock, Unlock, Eye, Users as UsersIcon, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import { getCurrentUserId } from '../utils/tokenUtils';
import type { User } from '../types';
import Modal from '../components/ui/Modal';
import DetailModal from '../components/ui/DetailModal';
import Button from '../components/ui/Button';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 10;

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState('Customer');

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

  const normalizedSearch = searchQuery.toLowerCase();
  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(normalizedSearch) ||
    user.fullName.toLowerCase().includes(normalizedSearch) ||
    user.email.toLowerCase().includes(normalizedSearch)
  );
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filteredUsers.length]);

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
      fetchUsers();
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
      fetchUsers();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Có lỗi khi cập nhật quyền!');
    }
  };

  return (
    <div className="bg-white shadow-sm p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-100 pb-4 gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
          <UsersIcon className="text-orange-500 flex-shrink-0" size={24} /> Quản lý tài khoản người dùng
        </h2>
      </div>

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

      <div className="overflow-hidden">
        <table className="w-full table-fixed text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase">
              <th className="p-2 sm:p-3 font-semibold w-[18%]">Username</th>
              <th className="p-2 sm:p-3 font-semibold w-[22%]">Họ tên</th>
              <th className="p-2 sm:p-3 font-semibold hidden lg:table-cell w-[24%]">Email</th>
              <th className="p-2 sm:p-3 font-semibold w-[92px]">Quyền</th>
              <th className="p-2 sm:p-3 font-semibold w-[112px]">Trạng thái</th>
              <th className="p-2 sm:p-3 font-semibold hidden xl:table-cell w-[104px]">Ngày tạo</th>
              <th className="p-2 sm:p-3 font-semibold text-center w-[92px]">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  Không tìm thấy người dùng nào.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr key={user.userId} className="hover:bg-slate-50 transition-colors">
                  <td className="p-2 sm:p-3 font-semibold text-slate-900 text-xs sm:text-sm">
                    <div className="truncate" title={user.username}>{user.username}</div>
                  </td>
                  <td className="p-2 sm:p-3 text-xs sm:text-sm">
                    <div className="truncate" title={user.fullName}>{user.fullName || '-'}</div>
                  </td>
                  <td className="p-2 sm:p-3 hidden lg:table-cell text-xs sm:text-sm">
                    <div className="truncate" title={user.email}>{user.email}</div>
                  </td>
                  <td className="p-2 sm:p-3">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-bold border ${
                      user.role === 'Admin'
                        ? 'bg-purple-100 text-purple-700 border-purple-200'
                        : 'bg-blue-100 text-blue-700 border-blue-200'
                    }`}>
                      {user.role === 'Admin' ? 'Admin' : 'Khách'}
                    </span>
                  </td>
                  <td className="p-2 sm:p-3">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-bold border ${
                      user.isLocked
                        ? 'bg-red-100 text-red-700 border-red-200'
                        : 'bg-green-100 text-green-700 border-green-200'
                    }`}>
                      {user.isLocked ? 'Đã khóa' : 'Bình thường'}
                    </span>
                  </td>
                  <td className="p-2 sm:p-3 hidden xl:table-cell text-xs sm:text-sm">
                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="p-2 sm:p-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleOpenDetail(user)}
                        className="text-orange-600 hover:text-orange-800 font-medium"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleOpenRoleModal(user)}
                        disabled={user.userId === currentUserId}
                        className={`font-medium ${
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
                        className={user.userId === currentUserId ? 'cursor-not-allowed' : ''}
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
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Chi tiết tài khoản: ${selectedUser?.username}`}
        sections={selectedUser ? [
          {
            title: 'Thông tin cá nhân',
            bgColor: 'orange',
            items: [
              { label: 'Username', value: selectedUser.username },
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

      <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title={`Thay đổi quyền: ${selectedUser?.username}`}>
        {selectedUser && (
          <form onSubmit={handleChangeRole} className="flex flex-col gap-4">
            <div className="bg-slate-50 p-4 border border-slate-200">
              <p className="text-sm text-slate-600 mb-2">Quyền hiện tại: <span className="font-bold text-slate-900">{selectedUser.role}</span></p>
              <label className="block text-sm font-bold text-slate-800 mb-2">Cấp quyền mới</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-orange-500 outline-none bg-white font-medium"
              >
                <option value="Customer">Khách hàng</option>
                <option value="Admin">Quản trị viên</option>
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
