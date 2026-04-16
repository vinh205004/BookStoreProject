/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { DollarSign, BookOpen, ShoppingBag, Users, TrendingUp, TrendingDown, Calendar, Star, MessageSquare } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';

// Random colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658', '#a4de6c'];

type MonthlyRevenuePoint = {
  month: string;
  revenue: number;
  orders: number;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const escapeExcelCell = (value: string | number) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const exportTableToExcel = (filename: string, sheetTitle: string, headers: string[], rows: Array<Array<string | number>>) => {
  const tableRows = [
    `<tr>${headers.map(header => `<th>${escapeExcelCell(header)}</th>`).join('')}</tr>`,
    ...rows.map(row => `<tr>${row.map(cell => `<td>${escapeExcelCell(cell)}</td>`).join('')}</tr>`)
  ].join('');

  const html = `
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          table { border-collapse: collapse; font-family: Arial, sans-serif; }
          th, td { border: 1px solid #999; padding: 8px; }
          th { background: #f97316; color: #111; font-weight: bold; }
          caption { font-size: 18px; font-weight: bold; margin-bottom: 12px; text-align: left; }
        </style>
      </head>
      <body>
        <table>
          <caption>${escapeExcelCell(sheetTitle)}</caption>
          ${tableRows}
        </table>
      </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xls') ? filename : `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const normalizeMonthlyRevenue = (items: unknown): MonthlyRevenuePoint[] => {
  const rows = Array.isArray(items) ? items : [];

  return Array.from({ length: 12 }, (_, index) => {
    const monthNumber = index + 1;
    const found = rows.find((item: any) => {
      const label = String(item?.month ?? '');
      const parsedMonth = Number(label.replace(/\D/g, ''));
      return parsedMonth === monthNumber;
    }) as any;

    return {
      month: found?.month ?? `Thg ${monthNumber}`,
      revenue: Number(found?.revenue ?? 0),
      orders: Number(found?.orders ?? 0)
    };
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StatCard = ({ title, value, icon, color, trend }: any) => (
  <div className="bg-white h-[112px] p-4 rounded-none shadow-sm border border-slate-100 flex items-center gap-3 min-w-0">
    <div className={`p-3 rounded-none ${color} text-white flex-shrink-0`}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-slate-500 font-medium mb-1 line-clamp-2 leading-4">{title}</p>
      <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight truncate">{value}</h3>
    </div>
    {trend !== undefined && trend !== null && (
      <div className={`flex flex-col items-end flex-shrink-0 ${trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-slate-400'}`}>
        {trend > 0 ? <TrendingUp size={16} /> : trend < 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} className="opacity-0" />}
        <span className="text-xs font-semibold mt-0.5">{trend > 0 ? '+' : ''}{trend}%</span>
      </div>
    )}
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    currentMonthRevenue: 0,
    currentMonthOrders: 0,
    currentMonthActiveOrders: 0,
    currentMonthCancelledOrders: 0,
    totalUsers: 0,
    totalBooks: 0,
    revenueTrend: 0,
    ordersTrend: 0
  });

  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenuePoint[]>([]);
  const [categorySales, setCategorySales] = useState<{ name: string; value: number; books?: { title: string, quantity: number }[] }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<{ name: string; books: { title: string, quantity: number }[] } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [topSellingProducts, setTopSellingProducts] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [topRatedProducts, setTopRatedProducts] = useState<any[]>([]);
  const [expandedBookId, setExpandedBookId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyComment, setReplyComment] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyComment, setEditReplyComment] = useState('');
  const [submittingEditReply, setSubmittingEditReply] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/Dashboard', {
        params: {
          month: selectedMonth,
          year: selectedYear,
          chartYear: selectedYear
        }
      });
      
      // axios interceptor already returns response.data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { stats, monthlyRevenue, categorySales, topSellingProducts, topRatedProducts } = response as any;
      
      setStats(stats);
      setMonthlyRevenue(normalizeMonthlyRevenue(monthlyRevenue));
      setCategorySales(categorySales);
      setTopSellingProducts(topSellingProducts);
      setTopRatedProducts(topRatedProducts);
      setSelectedCategory(null); // Reset category detail when data changes
      
    } catch (error) {
      console.error("Error fetching dashboard data: ", error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [selectedMonth, selectedYear]);

  const handleReplySubmit = async (reviewId: string) => {
    if (!replyComment.trim()) {
      toast.warning('Vui lòng nhập nội dung phản hồi!');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token || token === 'null' || token === 'undefined') {
      toast.warning('Vui lòng đăng nhập để phản hồi!');
      return;
    }

    try {
      setSubmittingReply(true);
      await axiosClient.post(`/Reviews/${reviewId}/replies`, {
        content: replyComment
      });
      toast.success('Gửi phản hồi thành công!');
      setReplyComment('');
      setReplyingTo(null);

      // Reload dashboard data
      fetchDashboardData();
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Lỗi khi gửi phản hồi!';
      toast.error(msg);
      console.error('Lỗi khi gửi phản hồi:', error);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phản hồi này?')) return;

    try {
      await axiosClient.delete(`/Reviews/replies/${replyId}`);
      toast.success('Xóa phản hồi thành công!');
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Lỗi khi xóa phản hồi!');
      console.error('Lỗi Delete reply:', error);
    }
  };

  const handleEditReplySubmit = async (replyId: string) => {
    if (!editReplyComment.trim()) {
      toast.warning('Vui lòng nhập nội dung phản hồi!');
      return;
    }

    try {
      setSubmittingEditReply(true);
      await axiosClient.put(`/Reviews/replies/${replyId}`, {
        content: editReplyComment
      });
      toast.success('Cập nhật phản hồi thành công!');
      setEditingReplyId(null);
      setEditReplyComment('');
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Lỗi khi cập nhật phản hồi!');
      console.error('Lỗi Update reply:', error);
    } finally {
      setSubmittingEditReply(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (initialLoad) return <div className="p-8 text-center text-slate-500">Đang tải biểu đồ...</div>;

  const totalCategoryBooks = categorySales.reduce((sum, item) => sum + item.value, 0);
  const maxMonthlyRevenue = Math.max(...monthlyRevenue.map(item => item.revenue), 0);
  const hasMonthlyRevenue = maxMonthlyRevenue > 0;
  const currentDate = new Date();
  const setCurrentMonthFilter = () => {
    setSelectedMonth(currentDate.getMonth() + 1);
    setSelectedYear(currentDate.getFullYear());
  };
  const setPreviousMonthFilter = () => {
    const previousMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setSelectedMonth(previousMonthDate.getMonth() + 1);
    setSelectedYear(previousMonthDate.getFullYear());
  };
  const setCurrentYearFilter = () => {
    setSelectedYear(currentDate.getFullYear());
  };
  const handleExportRevenue = () => {
    exportTableToExcel(
      `doanh-thu-${selectedYear}.xls`,
      `Biểu đồ doanh thu năm ${selectedYear}`,
      ['Tháng', 'Doanh thu', 'Số đơn đã giao'],
      monthlyRevenue.map(item => [
        item.month,
        item.revenue,
        item.orders
      ])
    );
  };
  const handleExportCategorySales = () => {
    const rows = categorySales.flatMap(item => {
      const books = item.books && item.books.length > 0 ? item.books : [{ title: '', quantity: 0 }];

      return books.map(book => [
        item.name,
        item.value,
        book.title,
        book.quantity
      ]);
    });

    exportTableToExcel(
      `san-luong-danh-muc-${selectedMonth}-${selectedYear}.xls`,
      `Sản lượng bán theo danh mục ${selectedMonth}/${selectedYear}`,
      ['Danh mục', 'Tổng số cuốn', 'Sách', 'Số cuốn của sách'],
      rows
    );
  };

  return (
    <div className={`p-6 max-w-7xl mx-auto space-y-6 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-slate-800">HỆ THỐNG TIẾN THỌ</h1>
        <p className="text-sm text-slate-500 mt-1">Theo dõi doanh thu, đánh giá và thống kê bán hàng.</p>
      </div>

      <div className="space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex space-x-2 items-center bg-white border border-slate-200 p-2 rounded-none shadow-sm self-start">
            <Calendar size={18} className="text-slate-400" />
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 cursor-pointer pr-2"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
            <span className="text-slate-300">|</span>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 cursor-pointer"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={setCurrentMonthFilter} className="px-3 py-1.5 bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold hover:bg-orange-200">
              Tháng này
            </button>
            <button onClick={setPreviousMonthFilter} className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold hover:bg-slate-200">
              Tháng trước
            </button>
            <button onClick={setCurrentYearFilter} className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold hover:bg-slate-200">
              Năm nay
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title={`Doanh Thu T${selectedMonth}/${selectedYear}`} value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.currentMonthRevenue)} icon={<DollarSign size={20} />} color="bg-orange-400" trend={stats.revenueTrend} />
          <StatCard title={`Đơn Đã Giao T${selectedMonth}/${selectedYear}`} value={stats.currentMonthOrders} icon={<ShoppingBag size={20} />} color="bg-blue-400" trend={stats.ordersTrend} />
          <StatCard title="Đơn Đang Xử Lý" value={stats.currentMonthActiveOrders} icon={<ShoppingBag size={20} />} color="bg-purple-400" />
          <StatCard title="Đơn Đã Hủy" value={stats.currentMonthCancelledOrders} icon={<ShoppingBag size={20} />} color="bg-red-400" />
          <StatCard title="Tổng Doanh Thu" value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalRevenue)} icon={<DollarSign size={20} />} color="bg-orange-500" />
          <StatCard title="Tổng Đơn Hàng Hợp Lệ" value={stats.totalOrders} icon={<ShoppingBag size={20} />} color="bg-blue-500" />
          <StatCard title="Tổng Khách Hàng" value={stats.totalUsers} icon={<Users size={20} />} color="bg-green-500" />
          <StatCard title="Tổng Sản Phẩm" value={stats.totalBooks} icon={<BookOpen size={20} />} color="bg-purple-500" />
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DOANH THU THÁNG */}
        <div className="bg-white h-[470px] p-4 sm:p-6 rounded-none shadow-sm border border-slate-100 lg:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
            <h3 className="text-lg font-bold text-slate-800">BIỂU ĐỒ DOANH THU</h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-none">
                <span className="text-sm text-slate-500 font-medium">Theo năm đang chọn:</span>
                <span className="font-bold text-orange-600 text-sm">{selectedYear}</span>
              </div>
              <button
                type="button"
                onClick={handleExportRevenue}
                style={{ width: 140, height: 45 }}
                className="inline-flex flex-none items-center justify-center bg-orange-500 hover:bg-orange-600 text-black border border-orange-500 text-xs font-bold transition-colors"
              >
                Xuất Excel
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 w-full">
            {!hasMonthlyRevenue ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-400">
                <DollarSign size={48} className="mb-3 opacity-20" />
                <p className="italic">Chưa có doanh thu nào trong năm {selectedYear}</p>
              </div>
            ) : (
              <div className="h-full overflow-visible">
                <div className="grid h-full w-full grid-cols-12 gap-1 sm:gap-2 border-l border-b border-slate-200 px-2 sm:px-3 pt-4 pb-8">
                  {monthlyRevenue.map((item, index) => {
                    const height = Math.max((item.revenue / maxMonthlyRevenue) * 100, item.revenue > 0 ? 6 : 0);
                    const tooltipPosition = index === 0
                      ? 'left-0'
                      : index === monthlyRevenue.length - 1
                        ? 'right-0'
                        : 'left-1/2 -translate-x-1/2';

                    return (
                      <div key={item.month} className="group relative flex h-full min-w-0 flex-col items-center justify-end gap-2">
                        <div className={`pointer-events-none absolute top-2 z-10 hidden w-36 border border-slate-200 bg-white p-2 text-[11px] leading-4 shadow-lg group-hover:block sm:w-44 sm:text-xs ${tooltipPosition}`}>
                          <div className="font-bold text-slate-800">{item.month}/{selectedYear}</div>
                          <div className="mt-1 text-orange-600">{formatCurrency(item.revenue)}</div>
                          <div className="text-slate-500">{item.orders} đơn đã giao</div>
                        </div>
                        <div className="flex h-full w-full items-end justify-center">
                          <div
                            className="w-full max-w-8 sm:max-w-10 bg-orange-500 transition-all hover:bg-orange-600"
                            style={{ height: `${height}%` }}
                            title={`${item.month}: ${formatCurrency(item.revenue)} - ${item.orders} đơn`}
                          />
                        </div>
                        <span className="absolute -bottom-6 text-[10px] sm:text-xs font-medium text-slate-500">{item.month.replace('Thg ', 'T')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TỶ LỆ DANH MỤC */}
        <div className="bg-white h-[470px] p-4 sm:p-6 rounded-none shadow-sm border border-slate-100 flex flex-col relative">
          <div className="flex flex-col mb-6 gap-3">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <h4 className="text-lg font-bold text-slate-800">SẢN LƯỢNG BÁN THEO DANH MỤC {selectedMonth}/{selectedYear}</h4>
              <button
                type="button"
                onClick={handleExportCategorySales}
                disabled={categorySales.length === 0}
                style={{ width: 140, height: 45 }}
                className="self-start inline-flex flex-none items-center justify-center bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200 text-black border border-orange-500 text-xs font-bold transition-colors"
              >
                Xuất Excel
              </button>
            </div>
            {totalCategoryBooks > 0 && (
              <div>
                <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-none text-xs font-bold border border-blue-100">
                  Tổng: {totalCategoryBooks} cuốn
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-1 relative overflow-hidden">
            {/* VÙNG THEO DÕI NỘI DUNG HOẶC MODAL CHI TIẾT */}
            <div className={`transition-all duration-300 w-full h-full overflow-y-auto pr-2 ${selectedCategory ? 'opacity-0 pointer-events-none absolute top-0' : 'opacity-100 relative'}`}>
              {categorySales.length > 0 ? (
                <div className="space-y-4">
                  {categorySales.map((item, index) => {
                    const percentage = totalCategoryBooks > 0 ? ((item.value / totalCategoryBooks) * 100).toFixed(1) : 0;
                    return (
                      <div key={index} className="flex flex-col bg-slate-50 p-3 rounded-none border border-slate-100 gap-2">
                        <div className="flex justify-between items-center w-full">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-none" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <span className="font-semibold text-slate-700">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                              <span className="font-bold text-slate-800 text-sm">{item.value} <span className="text-xs text-slate-500 font-normal">cuốn</span> ({percentage}%)</span>
                            </div>
                            <button 
                              onClick={() => setSelectedCategory({ name: item.name, books: item.books || [] })}
                              className="text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded-none hover:bg-blue-200 transition font-bold whitespace-nowrap min-w-[72px]"
                            >
                              Chi tiết
                            </button>
                          </div>
                        </div>
                        {/* Thanh Process Bar hiển thị phần trăm */}
                        <div className="w-full bg-slate-200 rounded-none h-1.5 overflow-hidden">
                          <div className="h-1.5 rounded-none" style={{ width: `${percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-slate-400 italic">Không có dữ liệu trong tháng này</div>
              )}
            </div>

            {/* MODAL CHI TIẾT IN-PLACE */}
            <div className={`absolute top-0 left-0 w-full h-full bg-white transition-all duration-300 flex flex-col ${selectedCategory ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none -z-10 translate-x-4'}`}>
              {selectedCategory && (
                <>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedCategory(null)}
                        className="p-1 hover:bg-slate-100 rounded-none text-slate-400 hover:text-slate-600"
                        title="Quay lại"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                      </button>
                      <h4 className="font-bold text-slate-700">Chi tiết: <span className="text-blue-600">{selectedCategory.name}</span></h4>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-1">
                    <ul className="divide-y divide-slate-100 space-y-2">
                      {selectedCategory.books.map((b, idx) => (
                        <li key={idx} className="flex justify-between items-center py-2 bg-slate-50 px-3 rounded-none">
                          <span className="text-slate-600 font-medium text-sm line-clamp-2 pr-3">{idx + 1}. {b.title}</span>
                          <span className="bg-orange-100 text-orange-700 font-bold px-2 py-1 rounded-none text-xs whitespace-nowrap">
                            {b.quantity} cuốn
                          </span>
                        </li>
                      ))}
                      {selectedCategory.books.length === 0 && (
                        <li className="text-center text-slate-400 italic py-4">Không có sách</li>
                      )}
                    </ul>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* TOP LISTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TOP SELLING */}
        <div className="bg-white rounded-none shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Top 5 Sản Phẩm Bán Chạy {selectedMonth}/{selectedYear}</h3>
          </div>
          <div className="divide-y divide-slate-100 p-2">
            {topSellingProducts.length > 0 ? (
              topSellingProducts.map((p, index) => (
                <div key={p.id} className="flex items-center p-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors rounded-none group">
                  <div className={`w-8 h-8 rounded-none flex items-center justify-center font-bold text-sm mr-4 ${index === 0 ? 'bg-yellow-100 text-yellow-600' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-50 text-gray-400'} group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors`}>
                    #{index + 1}
                  </div>
                  <img src={p.img} alt={p.title} className="w-12 h-16 object-cover rounded-none bg-slate-200 mr-4" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">{p.title}</h4>
                    <p className="text-orange-500 font-bold text-sm">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-700">{p.sold} cuốn</div>
                    <div className="text-xs text-slate-500">Đã bán</div>
                  </div>
                </div>
              ))
            ) : (
               <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                 <BookOpen size={48} className="mb-3 opacity-20" />
                 <p className="italic">Không có sản phẩm nào được bán ở thời gian này</p>
               </div>
            )}
          </div>
        </div>

        {/* TOP RATED */}
        <div className="bg-white rounded-none shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Đánh Giá Nổi Bật {selectedMonth}/{selectedYear}</h3>
          </div>
          <div className="divide-y divide-slate-100 p-2">
            {topRatedProducts.length > 0 ? (
              topRatedProducts.map((p, index) => (
                <div key={p.id} className="flex flex-col p-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors rounded-none group cursor-pointer" onClick={() => setExpandedBookId(expandedBookId === p.id ? null : p.id)}>
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-none flex items-center justify-center font-bold text-sm mr-4 ${index === 0 ? 'bg-yellow-100 text-yellow-600' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-50 text-gray-400'} group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors`}>
                      #{index + 1}
                    </div>
                    <img src={p.img} alt={p.title} className="w-12 h-16 object-cover rounded-none bg-slate-200 mr-4" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">{p.title}</h4>
                      <div className="flex items-center text-yellow-500 mt-1">
                        <Star size={14} fill="currentColor" />
                        <span className="font-bold ml-1 text-sm">{p.rating}</span>
                        <span className="text-xs text-slate-500 ml-2">({p.reviews} đánh giá)</span>
                      </div>
                    </div>
                    <div className="ml-2 text-slate-400 group-hover:text-slate-600 flex-shrink-0 transition-transform duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={expandedBookId === p.id ? "rotate-180" : ""}><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                  
                  <div className={`grid transition-all duration-300 ease-in-out ${expandedBookId === p.id ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      {p.commentList && p.commentList.length > 0 ? (
                        <div className="pl-14 pr-2 pb-2">
                           <div className="bg-white rounded-none p-3 max-h-56 overflow-y-auto border border-slate-200 shadow-sm relative custom-scrollbar">
                             <h5 className="text-[10px] font-bold text-slate-500 mb-2.5 uppercase tracking-widest sticky -top-3 bg-white py-2 flex items-center border-b border-slate-100 z-10">
                               <svg className="w-3 h-3 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                               Đánh giá gần đây
                             </h5>
                             <ul className="space-y-3 pt-1">
                               {p.commentList.map((c: any, cIdx: number) => (
                                 <li key={cIdx} className="text-sm border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                                   <div className="flex justify-between items-start mb-1">
                                     <div className="flex flex-col">
                                       <span className="font-medium text-slate-800 text-[13px]">{c.fullName || 'Người dùng ẩn danh'}</span>
                                       {c.createdAt && <span className="text-[10px] text-slate-400 mt-0.5">{new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>}
                                     </div>
                                     <div className="flex items-center text-yellow-400 space-x-[1px] bg-slate-50 px-1.5 py-0.5 rounded-none">
                                       {Array.from({ length: 5 }).map((_, i) => (
                                         <Star key={i} size={9} fill={i < Math.round(c.rating || 0) ? 'currentColor' : 'none'} strokeWidth={i < Math.round(c.rating || 0) ? 0 : 1} className={i < Math.round(c.rating || 0) ? '' : 'text-slate-300'} />
                                       ))}
                                     </div>
                                   </div>
                                   {c.comment && c.comment.trim() ? (
                                      <p className="text-slate-600 text-[13px] leading-relaxed break-words whitespace-pre-wrap mt-1.5 bg-slate-50/50 p-2 rounded-none">{c.comment}</p>
                                   ) : (
                                      <p className="text-slate-400 italic text-xs mt-1.5">Chỉ đánh giá sao</p>
                                   )}

                                   {/* Replies block */}
                                   {c.replies && c.replies.length > 0 && (
                                     <div className="mt-3 ml-4 pl-3 border-l-2 border-slate-200 space-y-3">
                                        {c.replies.map((reply: any) => (
                                          <div key={reply.id} className="bg-slate-50 p-2.5 rounded-none text-xs relative group/reply">
                                             <div className="flex justify-between items-start">
                                                <span className={`font-semibold ${reply.isAdmin ? 'text-blue-600' : 'text-slate-700'}`}>
                                                  {reply.isAdmin ? 'Quản trị viên' : (reply.fullName || 'Người dùng')}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                   <span className="text-slate-400 text-[10px]">
                                                     {new Date(reply.createdAt).toLocaleDateString('vi-VN')}
                                                   </span>
                                                   {reply.isAdmin && (
                                                     <button
                                                       onClick={(e) => {
                                                         e.stopPropagation();
                                                         setEditingReplyId(reply.id);
                                                         setEditReplyComment(reply.content);
                                                       }}
                                                       className="text-blue-400 hover:text-blue-600 opacity-0 group-hover/reply:opacity-100 transition-opacity"
                                                       title="Sửa phản hồi"
                                                     >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                                     </button>
                                                   )}
                                                   <button
                                                     onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteReply(reply.id);
                                                     }}
                                                     className="text-red-400 hover:text-red-600 opacity-0 group-hover/reply:opacity-100 transition-opacity"
                                                     title="Xóa phản hồi"
                                                   >
                                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                                   </button>
                                                </div>
                                             </div>
                                             
                                             {editingReplyId === reply.id ? (
                                                <div className="mt-2 bg-white rounded-none border border-blue-200" onClick={e => e.stopPropagation()}>
                                                  <textarea
                                                     className="w-full text-xs border-0 focus:ring-0 p-2 min-h-[50px] resize-none"
                                                     value={editReplyComment}
                                                     onChange={(e) => setEditReplyComment(e.target.value)}
                                                     autoFocus
                                                  />
                                                  <div className="flex justify-end gap-2 p-1.5 bg-slate-50 border-t border-slate-100 rounded-none">
                                                     <button
                                                       onClick={() => {
                                                         setEditingReplyId(null);
                                                         setEditReplyComment('');
                                                       }}
                                                       className="px-2 py-1 text-slate-500 hover:bg-slate-200 rounded-none transition-colors"
                                                     >
                                                       Hủy
                                                     </button>
                                                     <button
                                                       onClick={() => handleEditReplySubmit(reply.id)}
                                                       disabled={submittingEditReply || !editReplyComment.trim()}
                                                       className="px-2 py-1 bg-blue-600 text-white rounded-none hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                                     >
                                                       {submittingEditReply ? 'Đang lưu...' : 'Lưu'}
                                                     </button>
                                                  </div>
                                                </div>
                                             ) : (
                                               <p className="text-slate-600 mt-1 whitespace-pre-wrap">{reply.content}</p>
                                             )}
                                          </div>
                                        ))}
                                     </div>
                                   )}

                                   {/* Reply Form */}
                                   <div className="mt-2 flex justify-end">
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setReplyingTo(replyingTo === c.id ? null : c.id);
                                          if (replyingTo !== c.id) setReplyComment('');
                                        }}
                                        className="text-blue-600 hover:underline text-xs flex items-center gap-1 font-medium"
                                      >
                                        <MessageSquare size={12} />
                                        {replyingTo === c.id ? 'Hủy' : 'Phản hồi'}
                                      </button>
                                   </div>
                                   
                                   {replyingTo === c.id && (
                                     <div className="mt-2 bg-blue-50/50 p-3 rounded-none border border-blue-100" onClick={e => e.stopPropagation()}>
                                       <textarea
                                          className="w-full text-sm border-slate-200 rounded-none focus:ring-blue-500 focus:border-blue-500 p-2 min-h-[60px]"
                                          placeholder="Nhập phản hồi của bạn..."
                                          value={replyComment}
                                          onChange={(e) => setReplyComment(e.target.value)}
                                       ></textarea>
                                       <div className="flex justify-end mt-2">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleReplySubmit(c.id);
                                            }}
                                            disabled={submittingReply || !replyComment.trim()}
                                            className="bg-blue-600 text-white px-4 py-1.5 rounded-none text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                          >
                                            {submittingReply ? 'Đang gửi...' : 'Gửi phản hồi'}
                                          </button>
                                       </div>
                                     </div>
                                   )}
                                 </li>
                               ))}
                             </ul>
                           </div>
                        </div>
                      ) : (
                        <div className="pl-14 pr-2 pb-2">
                           <div className="bg-slate-50 rounded-none p-3 text-center border border-slate-100">
                             <p className="text-slate-400 text-xs italic">Chưa có bình luận chi tiết</p>
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <Star size={48} className="mb-3 opacity-20" />
                  <p className="italic">Chưa có đánh giá nào trong tháng này</p>
                </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
