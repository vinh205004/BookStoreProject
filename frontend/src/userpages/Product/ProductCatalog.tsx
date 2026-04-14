/* eslint-disable prefer-const */
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Star, ShoppingCart, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';

import { addToGuestCart } from '../../utils/cartUtils';
import React from 'react';

interface Product {
  bookId: string;
  title: string;
  price: number;
  stock: number;
  authorName: string;
  categoryName: string;
  publisherName: string;
  targetAudience: string;
  pageCount: number;
  mainImageUrl: string;
  rating?: number;
  reviewCount?: number;
  soldQuantity?: number;
  discountBadge?: string;
  discountedPrice?: number;
  discountVoucherCode?: string;
  categoryId?: string;
}

interface Category {
  categoryId: string;
  name: string;
  isActive: boolean;
}

interface Author {
  authorId: string;
  name: string;
  isActive: boolean;
}

export default function ProductCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [sortOption, setSortOption] = useState<string>('default');
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [publishers, setPublishers] = useState<any[]>([]);
  const [audiences, setAudiences] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    categoryId: searchParams.get('categoryId') || '',
    authorId: searchParams.get('authorId') || '',
    publisherId: searchParams.get('publisherId') || '',
    targetAudience: searchParams.get('targetAudience') || '',
    minPrice: parseFloat(searchParams.get('minPrice') || '0') || 0,
    maxPrice: parseFloat(searchParams.get('maxPrice') || '999999') || 999999,
    hasDiscount: searchParams.get('discount') === 'true',
  });

  // Cập nhật filters khi URL params thay đổi
  useEffect(() => {
    setFilters({
      search: searchParams.get('search') || '',
      categoryId: searchParams.get('categoryId') || '',
      authorId: searchParams.get('authorId') || '',
      publisherId: searchParams.get('publisherId') || '',
      targetAudience: searchParams.get('targetAudience') || '',
      minPrice: parseFloat(searchParams.get('minPrice') || '0') || 0,
      maxPrice: parseFloat(searchParams.get('maxPrice') || '999999') || 999999,
      hasDiscount: searchParams.get('discount') === 'true',
    });
  }, [searchParams]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const debounceTimer = useRef<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          searchQuery: filters.search,
          ...(filters.categoryId && { categoryId: filters.categoryId }),
          ...(filters.authorId && { authorId: filters.authorId }),
          ...(filters.publisherId && { publisherId: filters.publisherId }),
          ...(filters.targetAudience && { targetAudience: filters.targetAudience }),
          ...(filters.minPrice > 0 && { minPrice: filters.minPrice.toString() }),
          ...(filters.maxPrice < 999999 && { maxPrice: filters.maxPrice.toString() }),
          ...(filters.hasDiscount && { discount: 'true' }),
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = await axiosClient.get(`/Books/search?${params}`);
        console.log('API Request URL:', `/Books/search?${params}`);
        setProducts(response);
      } catch {
        toast.error('Lỗi khi tải sản phẩm!');
      } finally {
        setLoading(false);
      }
    };

    // Clear previous timeout
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timeout for debouncing
    debounceTimer.current = setTimeout(() => {
      loadData();
    }, 300);

    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [filters.search, filters.categoryId, filters.authorId, filters.publisherId, filters.targetAudience, filters.minPrice, filters.maxPrice, filters.hasDiscount]);

  useEffect(() => {
    const loadFiltersData = async () => {
      const loadCategories = async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const response: any = await axiosClient.get('/Categories');
          setCategories(response.filter((c: Category) => c.isActive));
        } catch {
          console.error('Lỗi khi tải danh mục');
        }
      };

      const loadAuthors = async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const response: any = await axiosClient.get('/Authors');
          setAuthors(response.filter((a: Author) => a.isActive));
        } catch {
          console.error('Lỗi khi tải tác giả');
        }
      };

      const loadPublishers = async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const response: any = await axiosClient.get('/Publishers');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setPublishers(response.filter((p: any) => p.isActive));
        } catch {
          console.error('Lỗi khi tải nhà xuất bản');
        }
      };

      const loadAudiences = async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const response: any = await axiosClient.get('/Books/target-audiences');
          setAudiences(response || []);
        } catch {
          console.error('Lỗi khi tải đối tượng độc giả');
        }
      };

      await Promise.all([loadCategories(), loadAuthors(), loadPublishers(), loadAudiences()]);
    };

    loadFiltersData();
  }, []);

  const handleFilterChange = (key: string, value: string | number | boolean) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    const params = new URLSearchParams({
      ...(newFilters.search && { search: newFilters.search }),
      ...(newFilters.categoryId && { categoryId: newFilters.categoryId }),
      ...(newFilters.authorId && { authorId: newFilters.authorId }),
      ...(newFilters.publisherId && { publisherId: newFilters.publisherId }),
      ...(newFilters.targetAudience && { targetAudience: newFilters.targetAudience }),
      ...(newFilters.minPrice > 0 && { minPrice: newFilters.minPrice.toString() }),
      ...(newFilters.maxPrice < 999999 && { maxPrice: newFilters.maxPrice.toString() }),
      ...(newFilters.hasDiscount && { discount: 'true' }),
    });

    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      categoryId: '',
      authorId: '',
      publisherId: '',
      targetAudience: '',
      minPrice: 0,
      maxPrice: 999999,
      hasDiscount: false,
    });
    setSearchParams({});
  };

  const handleAddToCart = async (product: Product) => {
    if (product.stock <= 0) {
      toast.warning('Sản phẩm hết hàng!');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      const result = addToGuestCart(product, 1);
      if (result.success) {
        window.dispatchEvent(new Event('cart-updated'));
        toast.success('Đã thêm vào giỏ hàng!');
      } else {
        toast.error(result.message || 'Lỗi khi thêm vào giỏ hàng!');
      }
      return;
    }

    try {
      // Call backend API to add to cart with quantity = 1
      console.log('Adding to cart:', { bookId: product.bookId, quantity: 1 });
      await axiosClient.post('/cart/items', {
        bookId: product.bookId,
        quantity: 1
      });

      // Dispatch custom event to update badge
      window.dispatchEvent(new Event('cart-updated'));
      toast.success('Đã thêm vào giỏ hàng!');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Add to cart error:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Lỗi khi thêm vào giỏ hàng!';
      toast.error(errorMessage);
    }
  };

  const sortedProducts = React.useMemo(() => {
    let result = [...products];
    switch (sortOption) {
      case 'priceAsc':
        result.sort((a, b) => (a.discountedPrice || a.price) - (b.discountedPrice || b.price));
        break;
      case 'priceDesc':
        result.sort((a, b) => (b.discountedPrice || b.price) - (a.discountedPrice || a.price));
        break;
      case 'soldDesc':
        result.sort((a, b) => (b.soldQuantity || 0) - (a.soldQuantity || 0));
        break;
      case 'ratingDesc':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        break;
    }
    return result;
  }, [products, sortOption]);

  // Calculate paginated products
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.categoryId, filters.authorId, filters.publisherId, filters.targetAudience, filters.minPrice, filters.maxPrice, filters.hasDiscount]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Sản Phẩm</h1>

      <div className="flex gap-6">
        {/* Filters - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24 self-start max-h-[calc(100vh-6rem)] overflow-y-auto z-10 custom-scrollbar">
          <div className={`bg-white p-6 shadow transition-opacity duration-300 ${loading ? 'opacity-70' : 'opacity-100'}`}>
            <div className="flex items-center justify-between sm:hidden mb-4">
              <h2 className="font-bold">Bộ lọc</h2>
              <button onClick={() => setShowFilters(!showFilters)}>
                <Filter size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Tìm kiếm</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Tên sách..."
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Categories */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Danh mục</label>
              <select
                value={filters.categoryId}
                onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Tất cả</option>
                {categories.map(cat => (
                  <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Authors */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Tác giả</label>
              <select
                value={filters.authorId}
                onChange={(e) => handleFilterChange('authorId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Tất cả</option>
                {authors.map(author => (
                  <option key={author.authorId} value={author.authorId}>{author.name}</option>
                ))}
              </select>
            </div>

            {/* Publishers */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Nhà xuất bản</label>
              <select
                value={filters.publisherId}
                onChange={(e) => handleFilterChange('publisherId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Tất cả</option>
                {publishers.map(publisher => (
                  <option key={publisher.publisherId} value={publisher.publisherId}>{publisher.name}</option>
                ))}
              </select>
            </div>

            {/* Target Audience */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Đối tượng độc giả</label>
              <select
                value={filters.targetAudience}
                onChange={(e) => handleFilterChange('targetAudience', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Tất cả</option>
                {audiences.map(audience => (
                  <option key={audience} value={audience}>{audience}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Giá</label>
              <div className="space-y-2">
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', parseFloat(e.target.value))}
                  placeholder="Từ"
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', parseFloat(e.target.value))}
                  placeholder="Đến"
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Discount Filter */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Lọc</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasDiscount}
                  onChange={(e) => handleFilterChange('hasDiscount', e.target.checked)}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-sm text-gray-700">Sản phẩm giảm giá</span>
              </label>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleResetFilters}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 font-semibold transition\"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1 relative">
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-gray-700 font-medium">
            <div>Hiển thị {products.length} sản phẩm</div>
            <div className="flex items-center gap-2">
              <label htmlFor="sortOption" className="text-sm">Sắp xếp:</label>
              <select
                id="sortOption"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-orange-500"
              >
                <option value="default">Mới nhất</option>
                <option value="priceAsc">Giá thấp đến cao</option>
                <option value="priceDesc">Giá cao đến thấp</option>
                <option value="soldDesc">Bán chạy nhất</option>
                <option value="ratingDesc">Đánh giá cao nhất</option>
              </select>
            </div>
          </div>
          
          {products.length === 0 && !loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm</p>
            </div>
          ) : (
            <div className={`transition-all duration-500 ${loading ? 'opacity-50 scale-100' : 'opacity-100'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {paginatedProducts.map(product => (
                <div key={product.bookId} className="bg-white shadow-md overflow-hidden hover:shadow-lg transition flex flex-col h-full border-2 border-orange-500">
                  {/* Image */}
                  <div className="aspect-square bg-gray-100 overflow-hidden relative flex-shrink-0 border-2 border-orange-500">
                    <img
                      src={product.mainImageUrl || '/placeholder.jpg'}
                      alt={product.title}
                      className="w-full h-full object-cover hover:scale-105 transition"
                    />
                    {product.discountBadge && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs font-bold">
                        {product.discountBadge}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-2 flex flex-col flex-1">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h3 className="font-bold text-sm text-gray-800 line-clamp-1 flex-1">{product.title}</h3>
                      <span className="text-xs text-gray-600 flex-shrink-0">-</span>
                      <p className="text-xs text-gray-600 line-clamp-1 flex-1">{product.authorName}</p>
                    </div>

                    <div className="flex items-center gap-1 mb-2">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} className={i < Math.ceil(product.rating || 0) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-600">({product.reviewCount ?? 0})</span>
                    </div>

                    <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                      <div className="flex flex-col">
                        {product.discountedPrice ? (
                          <>
                            <span className="text-sm font-bold text-orange-500">{product.discountedPrice.toLocaleString()}₫</span>
                            <span className="text-xs line-through text-gray-400 font-normal">{product.price.toLocaleString()}₫</span>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-orange-500">{product.price.toLocaleString()}₫</span>
                        )}
                      </div>
                      <span className={`text-xs px-1 py-0.5 ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.stock > 0 ? `Còn ${product.stock}` : 'Hết hàng'}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 mb-2">
                      {product.soldQuantity ?? 0} đã bán
                    </div>

                    <div className="flex gap-1 mt-auto">
                      <a
                        href={`/product/${product.bookId}`}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-1 text-center transition text-xs font-semibold"
                      >
                        Chi tiết
                      </a>
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock <= 0}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white py-1 flex items-center justify-center gap-1 transition text-xs font-semibold"
                      >
                        <ShoppingCart size={14} />
                        <span className="hidden sm:inline">Thêm</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && !loading && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Trước
                </button>

                {Array.from({ length: totalPages }, (_, i) => {
                  const pageNum = i + 1;
                  // Show first page, last page, current page, and pages around current
                  const shouldShow = pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1;
                  
                  if (!shouldShow && pageNum !== 2 && pageNum !== totalPages - 1) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 transition ${
                        currentPage === pageNum
                          ? 'bg-orange-500 text-white font-bold'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {totalPages > 5 && Math.abs(currentPage - totalPages) > 2 && (
                  <span className="px-2 text-gray-500">...</span>
                )}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Sau
                </button>

                <span className="ml-4 text-gray-600 font-medium">
                  Trang {currentPage} / {totalPages}
                </span>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 animate-spin"></div>
                  <div className="text-center">
                    <p className="text-gray-700 font-semibold">Đang tải...</p>
                    <p className="text-gray-500 text-sm mt-1">Vui lòng chở một chút</p>
                  </div>
                </div>
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
