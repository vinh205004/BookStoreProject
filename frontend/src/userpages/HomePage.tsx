import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';

interface Product {
  bookId: string;
  title: string;
  price: number;
  stock: number;
  authorName: string;
  categoryName: string;
  mainImageUrl: string;
}

interface Category {
  categoryId: string;
  name: string;
  isActive: boolean;
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatured();
    fetchCategories();
  }, []);

  const fetchFeatured = async () => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await axiosClient.get('/Books/featured?count=8');
      setFeatured(response);
    } catch {
      toast.error('Lỗi khi tải sản phẩm!');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await axiosClient.get('/Categories');
      setCategories(response.filter((c: Category) => c.isActive));
    } catch {
      console.error('Lỗi khi tải danh mục');
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Khám phá thế giới sách
              </h1>
              <p className="text-lg sm:text-xl mb-6 opacity-90">
                Tiến Thọ BookStore - Nơi cung cấp hàng vạn đầu sách hay với giá tốt nhất.
              </p>
              <div className="flex gap-4 flex-wrap">
                <a
                  href="/products"
                  className="bg-white text-orange-500 px-6 sm:px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition flex items-center gap-2"
                >
                  Mua sắm ngay
                  <ArrowRight size={20} />
                </a>
                <a
                  href="#featured"
                  className="border-2 border-white text-white px-6 sm:px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-orange-500 transition"
                >
                  Xem sản phẩm
                </a>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="aspect-square bg-white/10 rounded-lg overflow-hidden">
                <img
                  src="https://via.placeholder.com/500?text=Banner+Books"
                  alt="Books"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-gray-800">Danh Mục Sách</h2>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.length > 0 ? (
              categories.map(cat => (
                <a
                  key={cat.categoryId}
                  href={`/products?categoryId=${cat.categoryId}`}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition text-center"
                >
                  <div className="text-4xl mb-3">📖</div>
                  <h3 className="font-bold text-gray-800">{cat.name}</h3>
                </a>
              ))
            ) : (
              <p className="text-gray-500 col-span-full text-center">Đang tải danh mục...</p>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section id="featured" className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">Sản Phẩm Nổi Bật</h2>
            <a
              href="/products"
              className="text-orange-500 hover:text-orange-600 font-bold flex items-center gap-2 transition"
            >
              Xem tất cả
              <ArrowRight size={20} />
            </a>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Đang tải sản phẩm...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map(product => (
                <a
                  key={product.bookId}
                  href={`/product/${product.bookId}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition group"
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={product.mainImageUrl || '/placeholder.jpg'}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 line-clamp-2 mb-2 group-hover:text-orange-500 transition">
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-1">{product.authorName}</p>

                    <div className="flex items-end justify-between">
                      <span className="text-xl font-bold text-orange-500">{product.price.toLocaleString()}₫</span>
                      <span className={`text-xs px-2 py-1 rounded ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.stock > 0 ? 'Có hàng' : 'Hết'}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Đăng ký nhận tin tức</h2>
          <p className="text-lg mb-6 opacity-90">Nhận thông báo về sách mới, khuyến mãi và sự kiện độc quyền</p>
          <div className="flex gap-2 max-w-md mx-auto flex-col sm:flex-row">
            <input
              type="email"
              placeholder="Nhập email của bạn"
              className="flex-1 px-4 py-3 rounded text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-300"
            />
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded transition">
              Đăng ký
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
