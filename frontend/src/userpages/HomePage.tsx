import { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination } from 'swiper/modules';
import HomeProductCard from '../components/HomeProductCard';
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
  reviewCount?: number;
  soldQuantity?: number;
  discountVoucherCode?: string;
  categoryId?: string;
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
  const [loading, setLoading] = useState(true);
  const [topRated, setTopRated] = useState<Product[]>([]);
  const [topSelling, setTopSelling] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);

  const discountedRef = useRef<HTMLDivElement>(null);
  const topRatedRef = useRef<HTMLDivElement>(null);
  const topSellingRef = useRef<HTMLDivElement>(null);
  const sectionTitleClassName =
    "block w-full bg-orange-500 px-5 py-3 text-2xl sm:text-3xl lg:text-4xl font-bold uppercase italic text-white shadow-sm animate-[homeTitleBlink_1.8s_ease-in-out_infinite]";

  useEffect(() => {
    fetchBanners();
    fetchDiscounted();
    fetchTopRated();
    fetchTopSelling();
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
      const response: any = await axiosClient.get('/Books/discounted');
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await axiosClient.get('/Books/top-selling?count=10');
      setTopSelling(response);
    } catch {
      console.error('Lỗi khi tải top selling');
    }
  };

  return (
    <div>
      <style>{`
        @keyframes homeTitleBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.68; }
        }
      `}</style>
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

      {/* Sản phẩm giảm giá */}
      <section id="discounted" className="py-12 sm:py-16 lg:py-20 bg-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 space-y-4">
            <h2 className={sectionTitleClassName}>Sản phẩm giảm giá</h2>
            <a href="/products?discount=true" className="text-orange-500 hover:text-orange-600 font-bold flex items-center gap-2 transition">
              Xem tất cả sản phẩm giảm giá
              <ArrowRight size={20} />
            </a>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Đang tải sản phẩm...</p>
            </div>
          ) : (
            <div
              ref={discountedRef}
              className="flex overflow-x-auto gap-4 snap-x snap-mandatory pb-4 scroll-smooth"
              style={{ scrollBehavior: 'smooth', touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
            >
              {discounted.map(product => (
                <HomeProductCard
                  key={product.bookId}
                  bookId={product.bookId}
                  title={product.title}
                  price={product.price}
                  stock={product.stock}
                  authorName={product.authorName}
                  mainImageUrl={product.mainImageUrl}
                  discountBadge={product.discountBadge}
                  discountedPrice={product.discountedPrice}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  soldQuantity={product.soldQuantity}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sản phẩm đánh giá cao */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className={sectionTitleClassName}>Top 10 Sách Đánh Giá Cao Nhất</h2>
          </div>

          {!topRated || topRated.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Đang tải sản phẩm...</p>
            </div>
          ) : (
            <div
              ref={topRatedRef}
              className="flex overflow-x-auto gap-4 snap-x snap-mandatory pb-4 scroll-smooth"
              style={{ scrollBehavior: 'smooth', touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
            >
              {topRated.map(product => (
                <HomeProductCard
                  key={product.bookId}
                  bookId={product.bookId}
                  title={product.title}
                  price={product.price}
                  stock={product.stock}
                  authorName={product.authorName}
                  mainImageUrl={product.mainImageUrl}
                  discountBadge={product.discountBadge}
                  discountedPrice={product.discountedPrice}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  soldQuantity={product.soldQuantity}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sản phẩm bán chạy */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className={sectionTitleClassName}>Top 10 Sách Bán Chạy Nhất</h2>
          </div>

          {!topSelling || topSelling.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Đang tải sản phẩm...</p>
            </div>
          ) : (
            <div
              ref={topSellingRef}
              className="flex overflow-x-auto gap-4 snap-x snap-mandatory pb-4 scroll-smooth"
              style={{ scrollBehavior: 'smooth', touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
            >
              {topSelling.map(product => (
                <HomeProductCard
                  key={product.bookId}
                  bookId={product.bookId}
                  title={product.title}
                  price={product.price}
                  stock={product.stock}
                  authorName={product.authorName}
                  mainImageUrl={product.mainImageUrl}
                  discountBadge={product.discountBadge}
                  discountedPrice={product.discountedPrice}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  soldQuantity={product.soldQuantity}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      

    </div>
  );
}
