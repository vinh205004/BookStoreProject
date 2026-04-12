import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

interface Product {
  bookId: string;
  title: string;
  price: number;
  stock: number;
  authorName: string;
  categoryName: string;
  mainImageUrl: string;
  hasDiscount?: boolean;
  discountBadge?: string;
  discountedPrice?: number;
  rating?: number;
  discountVoucherCode?: string;
  categoryId?: string;
}

interface Category {
  categoryId: string;
  name: string;
  isActive: boolean;
}

interface Banner {
  bannerId: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  linkUrl: string;
}

export default function HomePage() {
  const [discounted, setDiscounted] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [topRated, setTopRated] = useState<Product[]>([]);
  const [topSelling, setTopSelling] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    fetchBanners();
    fetchDiscounted();
    fetchTopRated();
    fetchTopSelling();
    fetchCategories();
  }, []);

  const fetchBanners = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await axiosClient.get('/Banners?onlyActive=true');
      setBanners(response);
    } catch {
      console.error('Lỗi khi tải banner');
    }
  };

  const fetchDiscounted = async () => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await axiosClient.get('/Books/discounted?count=10');
      setDiscounted(response);
    } catch {
      toast.error('Lỗi khi tải sản phẩm!');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopRated = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await axiosClient.get('/Books/top-rated?count=10');
      setTopRated(response);
    } catch {
      console.error('Lỗi khi tải top rated');
    }
  };

  const fetchTopSelling = async () => {
    try {
      const date = new Date();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await axiosClient.get('/Books/top-selling?month=' + (date.getMonth() + 1) + '&year=' + date.getFullYear() + '&count=10');
      setTopSelling(response);
    } catch {
      console.error('Lỗi khi tải top selling');
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

  const renderStars = (rating?: number) => {
    if (rating === undefined || rating === null) return null;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(
            <span key={i} className={"text-sm " + (i <= rating ? 'text-yellow-400' : 'text-gray-300')}>
                ★
            </span>
        );
    }
    return <div className="flex mt-1">{stars}</div>;
  };

  return (
    <div>
      {/* Banner Section */}
      <section className="relative bg-orange-500 overflow-hidden">
        {banners.length > 0 ? (
          <Swiper
            modules={[Autoplay, EffectFade, Pagination]}
            effect="fade"
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            loop={true}
            className="w-full"
          >
            {banners.map((banner) => (
              <SwiperSlide key={banner.bannerId}>
                {({ isActive }) => (
                  <div className={"relative w-full py-16 sm:py-20 lg:py-24 transition-opacity duration-700 " + (isActive ? 'opacity-100' : 'opacity-0')}>
                    <div className="absolute inset-0">
                      <img 
                        src={banner.imageUrl} 
                        alt={banner.title} 
                        className="w-full h-full object-cover opacity-30 blur-[2px]" 
                      />
                      <div className="absolute inset-0 bg-orange-500/30 mix-blend-multiply"></div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                        <div>
                          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight drop-shadow-md text-white">
                            {banner.title}
                          </h1>
                          <p className="text-lg sm:text-xl mb-6 opacity-90 drop-shadow-md text-white">
                            {banner.subtitle || 'Tiến Thọ BookStore - Nơi cung cấp sách hay giá tốt nhất.'}
                          </p>
                          <div className="flex gap-4 flex-wrap">
                            <a
                              href={banner.linkUrl || "/products"}
                              className="bg-white text-orange-600 px-6 sm:px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition flex items-center gap-2 shadow-lg"
                            >
                              Khám phá ngay
                              <ArrowRight size={20} />
                            </a>
                          </div>
                        </div>
                        <div className="hidden lg:block relative">
                          <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 transform rotate-1 hover:rotate-0 hover:scale-105 transition-transform duration-500 bg-white">
                            <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 text-center">
             <div className="text-white font-bold opacity-80">Đang tải banner...</div>
          </div>
        )}
      </section>

      {/* Categories Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-gray-800">Danh Mục Sách</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.length > 0 ? (
              categories.map(cat => (
                <a key={cat.categoryId} href={"/products?categoryId=" + cat.categoryId} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition text-center">
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

      {/* Discounted Products */}
      <section id="discounted" className="py-12 sm:py-16 lg:py-20 bg-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">10 Sản Phẩm Giảm Giá</h2>
            <a href="/products" className="text-orange-500 hover:text-orange-600 font-bold flex items-center gap-2 transition">
              Xem tất cả
              <ArrowRight size={20} />
            </a>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Đang tải sản phẩm...</p>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-6 hide-scrollbar snap-x snap-mandatory pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {discounted.map(product => (
                <a
                  key={product.bookId}
                  href={"/product/" + product.bookId}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition group flex-none w-64 relative block snap-start shrink-0 flex flex-col"
                >
                  {product.discountBadge && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-10 shadow-sm pointer-events-none">
                      {product.discountBadge}
                    </div>
                  )}

                  <div className="aspect-square bg-gray-100 overflow-hidden rounded-t-lg">
                    <img src={product.mainImageUrl || '/placeholder.jpg'} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  </div>

                  <div className="p-4 flex flex-col flex-1 justify-between gap-2">
                    <div>
                        <h3 className="font-bold text-gray-800 line-clamp-2 mb-1 group-hover:text-orange-500 transition">
                        {product.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-1 line-clamp-1">{product.authorName}</p>
                        {renderStars(product.rating)}
                    </div>
                    <div className="flex flex-col mt-auto">
                      {product.discountedPrice ? (
                        <div className="flex flex-col">
                          <span className="text-xl font-bold text-orange-500">{product.discountedPrice.toLocaleString()}₫</span>
                          <span className="text-sm line-through text-gray-400">{product.price.toLocaleString()}₫</span>
                        </div>
                      ) : (
                        <span className="text-xl font-bold text-orange-500">{product.price.toLocaleString()}₫</span>
                      )}
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <span></span>
                      <span className={"text-xs px-2 py-1 rounded " + (product.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                        {product.stock > 0 ? "Có hàng" : "Hết"}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top Rated Products */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">Top 10 Sách Đánh Giá Cao Nhất</h2>
          </div>

          {!topRated || topRated.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Đang tải sản phẩm...</p>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-6 hide-scrollbar snap-x snap-mandatory pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {topRated.map(product => (
                <a
                  key={product.bookId}
                  href={"/product/" + product.bookId}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition group flex-none w-64 snap-start relative border border-gray-100 flex flex-col"
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden rounded-t-lg">
                    <img src={product.mainImageUrl || '/placeholder.jpg'} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  </div>

                  <div className="p-4 flex flex-col flex-1 justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-800 line-clamp-2 mb-1 group-hover:text-orange-500 transition">
                        {product.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1 line-clamp-1">{product.authorName}</p>
                      {renderStars(product.rating)}
                    </div>

                    <div className="flex flex-col mt-auto">
                      {product.discountedPrice ? (
                        <div className="flex flex-col">
                          <span className="text-xl font-bold text-orange-500">{product.discountedPrice.toLocaleString()}₫</span>
                          <span className="text-sm line-through text-gray-400">{product.price.toLocaleString()}₫</span>
                        </div>
                      ) : (
                        <span className="text-xl font-bold text-orange-500">{product.price.toLocaleString()}₫</span>
                      )}
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <span></span>
                      <span className={"text-xs px-2 py-1 rounded " + (product.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                        {product.stock > 0 ? "Có hàng" : "Hết"}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top Selling Products */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">Top 10 Sách Bán Chạy Nhất Tháng</h2>
          </div>

          {!topSelling || topSelling.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Đang tải sản phẩm...</p>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-6 hide-scrollbar snap-x snap-mandatory pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {topSelling.map(product => (
                <a
                  key={product.bookId}
                  href={"/product/" + product.bookId}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition group flex-none w-64 snap-start relative border border-gray-100 flex flex-col"
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden rounded-t-lg">
                    <img src={product.mainImageUrl || '/placeholder.jpg'} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  </div>

                  <div className="p-4 flex flex-col flex-1 justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-800 line-clamp-2 mb-1 group-hover:text-orange-500 transition">
                        {product.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1 line-clamp-1">{product.authorName}</p>
                      {renderStars(product.rating)}
                    </div>

                    <div className="flex flex-col mt-auto">
                      {product.discountedPrice ? (
                        <div className="flex flex-col">
                          <span className="text-xl font-bold text-orange-500">{product.discountedPrice.toLocaleString()}₫</span>
                          <span className="text-sm line-through text-gray-400">{product.price.toLocaleString()}₫</span>
                        </div>
                      ) : (
                        <span className="text-xl font-bold text-orange-500">{product.price.toLocaleString()}₫</span>
                      )}
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <span></span>
                      <span className={"text-xs px-2 py-1 rounded " + (product.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                        {product.stock > 0 ? "Có hàng" : "Hết"}
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
            <input type="email" placeholder="Nhập email của bạn" className="flex-1 px-4 py-3 rounded text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-300" />
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded transition">
              Đăng ký
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
