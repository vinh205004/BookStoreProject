/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Filter, ShoppingCart, Star } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';
import Breadcrumb from '../../components/Breadcrumb';
import OrangeButton from '../../components/OrangeButton';
import PageTitle from '../../components/PageTitle';
import { addToGuestCart } from '../../utils/cartUtils';

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

interface Publisher {
  publisherId: string;
  name: string;
  isActive: boolean;
}

interface FilterState {
  search: string;
  categoryIds: string[];
  authorIds: string[];
  publisherIds: string[];
  targetAudiences: string[];
  minPrice: number;
  maxPrice: number;
  hasDiscount: boolean;
}

interface CheckboxFilterOption {
  id: string;
  label: string;
}

function parseMultiValue(searchParams: URLSearchParams, key: string, legacyKey?: string) {
  const rawValue = searchParams.get(key);
  if (rawValue) {
    return rawValue
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const legacyValue = legacyKey ? searchParams.get(legacyKey) : null;
  return legacyValue ? [legacyValue] : [];
}

function CheckboxFilterGroup({
  title,
  options,
  selectedValues,
  onToggle,
  isOpen,
  onToggleOpen,
  emptyLabel,
}: {
  title: string;
  options: CheckboxFilterOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  emptyLabel?: string;
}) {
  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={onToggleOpen}
        className="mb-2 flex w-full items-center justify-between bg-orange-50 px-4 py-3 text-left text-lg font-bold text-slate-900 transition hover:bg-orange-100"
      >
        <span>{title}</span>
        <span className="flex items-center gap-2 text-sm font-semibold text-orange-500">
          {selectedValues.length > 0 && <span>{selectedValues.length}</span>}
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {isOpen && (
        <div className="max-h-56 overflow-y-auto border border-gray-300 bg-white custom-scrollbar">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">{emptyLabel || 'Chưa có dữ liệu'}</div>
          ) : (
            options.map((option) => (
              <label
                key={option.id}
                className="grid min-h-[52px] grid-cols-[20px_minmax(0,1fr)] items-start gap-3 border-b border-gray-100 px-4 py-3 text-sm text-gray-800 transition hover:bg-orange-50 last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.id)}
                  onChange={() => onToggle(option.id)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-orange-500"
                />
                <span className="leading-5 break-words">{option.label}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function ProductCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [sortOption, setSortOption] = useState<string>('default');
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [audiences, setAudiences] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openSections, setOpenSections] = useState({
    categories: true,
    authors: false,
    publishers: false,
    audiences: false,
  });
  const itemsPerPage = 20;

  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('search') || '',
    categoryIds: parseMultiValue(searchParams, 'categoryIds', 'categoryId'),
    authorIds: parseMultiValue(searchParams, 'authorIds', 'authorId'),
    publisherIds: parseMultiValue(searchParams, 'publisherIds', 'publisherId'),
    targetAudiences: parseMultiValue(searchParams, 'targetAudiences', 'targetAudience'),
    minPrice: parseFloat(searchParams.get('minPrice') || '0') || 0,
    maxPrice: parseFloat(searchParams.get('maxPrice') || '999999') || 999999,
    hasDiscount: searchParams.get('discount') === 'true',
  });

  useEffect(() => {
    setFilters({
      search: searchParams.get('search') || '',
      categoryIds: parseMultiValue(searchParams, 'categoryIds', 'categoryId'),
      authorIds: parseMultiValue(searchParams, 'authorIds', 'authorId'),
      publisherIds: parseMultiValue(searchParams, 'publisherIds', 'publisherId'),
      targetAudiences: parseMultiValue(searchParams, 'targetAudiences', 'targetAudience'),
      minPrice: parseFloat(searchParams.get('minPrice') || '0') || 0,
      maxPrice: parseFloat(searchParams.get('maxPrice') || '999999') || 999999,
      hasDiscount: searchParams.get('discount') === 'true',
    });
  }, [searchParams]);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          searchQuery: filters.search,
          ...(filters.categoryIds.length === 1 && { categoryId: filters.categoryIds[0] }),
          ...(filters.authorIds.length === 1 && { authorId: filters.authorIds[0] }),
          ...(filters.publisherIds.length === 1 && { publisherId: filters.publisherIds[0] }),
          ...(filters.targetAudiences.length === 1 && { targetAudience: filters.targetAudiences[0] }),
          ...(filters.minPrice > 0 && { minPrice: filters.minPrice.toString() }),
          ...(filters.maxPrice < 999999 && { maxPrice: filters.maxPrice.toString() }),
          ...(filters.hasDiscount && { discount: 'true' }),
        });

        const response: Product[] = await axiosClient.get(`/Books/search?${params}`);
        setProducts(response);
      } catch {
        toast.error('Lỗi khi tải sản phẩm!');
      } finally {
        setLoading(false);
      }
    };

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      loadData();
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [
    filters.search,
    filters.categoryIds,
    filters.authorIds,
    filters.publisherIds,
    filters.targetAudiences,
    filters.minPrice,
    filters.maxPrice,
    filters.hasDiscount,
  ]);

  useEffect(() => {
    const loadFiltersData = async () => {
      const loadCategories = async () => {
        try {
          const response: Category[] = await axiosClient.get('/Categories');
          setCategories(response.filter((category) => category.isActive));
        } catch {
          console.error('Lỗi khi tải danh mục');
        }
      };

      const loadAuthors = async () => {
        try {
          const response: Author[] = await axiosClient.get('/Authors');
          setAuthors(response.filter((author) => author.isActive));
        } catch {
          console.error('Lỗi khi tải tác giả');
        }
      };

      const loadPublishers = async () => {
        try {
          const response: Publisher[] = await axiosClient.get('/Publishers');
          setPublishers(response.filter((publisher) => publisher.isActive));
        } catch {
          console.error('Lỗi khi tải nhà xuất bản');
        }
      };

      const loadAudiences = async () => {
        try {
          const response: string[] = await axiosClient.get('/Books/target-audiences');
          setAudiences(response || []);
        } catch {
          console.error('Lỗi khi tải đối tượng độc giả');
        }
      };

      await Promise.all([loadCategories(), loadAuthors(), loadPublishers(), loadAudiences()]);
    };

    loadFiltersData();
  }, []);

  const updateFilters = (newFilters: FilterState) => {
    setFilters(newFilters);

    const params = new URLSearchParams({
      ...(newFilters.search && { search: newFilters.search }),
      ...(newFilters.categoryIds.length > 0 && { categoryIds: newFilters.categoryIds.join(',') }),
      ...(newFilters.authorIds.length > 0 && { authorIds: newFilters.authorIds.join(',') }),
      ...(newFilters.publisherIds.length > 0 && { publisherIds: newFilters.publisherIds.join(',') }),
      ...(newFilters.targetAudiences.length > 0 && { targetAudiences: newFilters.targetAudiences.join(',') }),
      ...(newFilters.minPrice > 0 && { minPrice: newFilters.minPrice.toString() }),
      ...(newFilters.maxPrice < 999999 && { maxPrice: newFilters.maxPrice.toString() }),
      ...(newFilters.hasDiscount && { discount: 'true' }),
    });

    setSearchParams(params);
  };

  const handleFilterChange = (key: keyof FilterState, value: string | number | boolean) => {
    updateFilters({
      ...filters,
      [key]: value,
    } as FilterState);
  };

  const toggleMultiSelectFilter = (
    key: 'categoryIds' | 'authorIds' | 'publisherIds' | 'targetAudiences',
    value: string,
  ) => {
    const currentValues = filters[key];
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    updateFilters({
      ...filters,
      [key]: nextValues,
    });
  };

  const toggleFilterSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleResetFilters = () => {
    updateFilters({
      search: '',
      categoryIds: [],
      authorIds: [],
      publisherIds: [],
      targetAudiences: [],
      minPrice: 0,
      maxPrice: 999999,
      hasDiscount: false,
    });
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
      await axiosClient.post('/cart/items', {
        bookId: product.bookId,
        quantity: 1,
      });

      window.dispatchEvent(new Event('cart-updated'));
      toast.success('Đã thêm vào giỏ hàng!');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Lỗi khi thêm vào giỏ hàng!';
      toast.error(errorMessage);
    }
  };

  const authorLookup = useMemo(
    () => new Map(authors.map((author) => [author.authorId, author.name.toLowerCase()])),
    [authors],
  );
  const publisherLookup = useMemo(
    () => new Map(publishers.map((publisher) => [publisher.publisherId, publisher.name.toLowerCase()])),
    [publishers],
  );

  const sortedProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesCategory =
        filters.categoryIds.length === 0 || filters.categoryIds.includes(product.categoryId || '');
      const productAuthorName = product.authorName.toLowerCase();
      const productPublisherName = product.publisherName.toLowerCase();
      const matchesAuthor =
        filters.authorIds.length === 0 ||
        filters.authorIds.some((authorId) => authorLookup.get(authorId) === productAuthorName);
      const matchesPublisher =
        filters.publisherIds.length === 0 ||
        filters.publisherIds.some((publisherId) => publisherLookup.get(publisherId) === productPublisherName);
      const matchesAudience =
        filters.targetAudiences.length === 0 || filters.targetAudiences.includes(product.targetAudience);

      return matchesCategory && matchesAuthor && matchesPublisher && matchesAudience;
    });

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
  }, [
    authorLookup,
    filters.authorIds,
    filters.categoryIds,
    filters.publisherIds,
    filters.targetAudiences,
    products,
    publisherLookup,
    sortOption,
  ]);

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters.search,
    filters.categoryIds,
    filters.authorIds,
    filters.publisherIds,
    filters.targetAudiences,
    filters.minPrice,
    filters.maxPrice,
    filters.hasDiscount,
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', to: '/' },
          { label: 'Tất cả sách' },
        ]}
      />
      <PageTitle title="Sản Phẩm" />

      <div className="flex gap-6">
        <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24 self-start z-10">
          <div className={`bg-white shadow transition-opacity duration-300 ${loading ? 'opacity-70' : 'opacity-100'}`}>
            <div className="bg-orange-500 px-4 py-4">
              <h2 className="text-lg font-bold uppercase text-white">Bộ lọc sách</h2>
            </div>
            <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-6 custom-scrollbar">
              <div className="flex items-center justify-between sm:hidden mb-4">
                <h2 className="font-bold">Bộ lọc</h2>
                <button onClick={() => setShowFilters(!showFilters)}>
                  <Filter size={20} />
                </button>
              </div>

              <div className="mb-6">
                <label className="mb-2 block bg-orange-50 px-4 py-3 text-lg font-bold text-slate-900">Tìm kiếm</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Tên sách..."
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <CheckboxFilterGroup
                title="Danh mục"
                options={categories.map((category) => ({ id: category.categoryId, label: category.name }))}
                selectedValues={filters.categoryIds}
                onToggle={(value) => toggleMultiSelectFilter('categoryIds', value)}
                isOpen={openSections.categories}
                onToggleOpen={() => toggleFilterSection('categories')}
                emptyLabel="Chưa có danh mục"
              />

              <CheckboxFilterGroup
                title="Tác giả"
                options={authors.map((author) => ({ id: author.authorId, label: author.name }))}
                selectedValues={filters.authorIds}
                onToggle={(value) => toggleMultiSelectFilter('authorIds', value)}
                isOpen={openSections.authors}
                onToggleOpen={() => toggleFilterSection('authors')}
                emptyLabel="Chưa có tác giả"
              />

              <CheckboxFilterGroup
                title="Nhà xuất bản"
                options={publishers.map((publisher) => ({ id: publisher.publisherId, label: publisher.name }))}
                selectedValues={filters.publisherIds}
                onToggle={(value) => toggleMultiSelectFilter('publisherIds', value)}
                isOpen={openSections.publishers}
                onToggleOpen={() => toggleFilterSection('publishers')}
                emptyLabel="Chưa có nhà xuất bản"
              />

              <CheckboxFilterGroup
                title="Đối tượng độc giả"
                options={audiences.map((audience) => ({ id: audience, label: audience }))}
                selectedValues={filters.targetAudiences}
                onToggle={(value) => toggleMultiSelectFilter('targetAudiences', value)}
                isOpen={openSections.audiences}
                onToggleOpen={() => toggleFilterSection('audiences')}
                emptyLabel="Chưa có đối tượng độc giả"
              />

              <div className="mb-6">
                <label className="mb-2 block bg-orange-50 px-4 py-3 text-lg font-bold text-slate-900">Giá</label>
                <div className="space-y-2">
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', parseFloat(e.target.value || '0'))}
                    placeholder="Từ"
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', parseFloat(e.target.value || '999999'))}
                    placeholder="Đến"
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-2 block bg-orange-50 px-4 py-3 text-lg font-bold text-slate-900">Lọc</label>
                <label className="flex items-center gap-3 border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    checked={filters.hasDiscount}
                    onChange={(e) => handleFilterChange('hasDiscount', e.target.checked)}
                    className="h-5 w-5 shrink-0 accent-orange-500"
                  />
                  <span className="leading-5">Sản phẩm giảm giá</span>
                </label>
              </div>

              <button
                onClick={handleResetFilters}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 font-semibold transition"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 relative">
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-gray-700 font-medium">
            <div>Hiển thị {sortedProducts.length} sản phẩm</div>
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

          {sortedProducts.length === 0 && !loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm</p>
            </div>
          ) : (
            <div className={`transition-all duration-500 ${loading ? 'opacity-50 scale-100' : 'opacity-100'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {paginatedProducts.map((product) => (
                  <Link
                    to={`/product/${product.bookId}`}
                    key={product.bookId}
                    className="bg-white shadow-md overflow-hidden hover:shadow-lg transition flex flex-col h-full border-2 border-orange-500 cursor-pointer"
                  >
                    <div className="aspect-square bg-white overflow-hidden relative flex-shrink-0 border-2 border-orange-500 p-2">
                      <img
                        src={product.mainImageUrl || '/placeholder.jpg'}
                        alt={product.title}
                        className="w-full h-full object-contain hover:scale-105 transition"
                        onError={(event) => {
                          event.currentTarget.src = '/placeholder.jpg';
                        }}
                      />
                      {product.discountBadge && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs font-bold">
                          {product.discountBadge}
                        </div>
                      )}
                    </div>

                    <div className="p-2 flex flex-col flex-1">
                      <div className="mb-1">
                        <h3 className="font-bold text-sm leading-5 min-h-[2.5rem] text-gray-800 break-words hover:text-orange-500 transition-colors">
                          {product.title}
                        </h3>
                        <p className="text-xs text-gray-600 line-clamp-1">{product.authorName}</p>
                      </div>

                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, index) => (
                            <Star
                              key={index}
                              size={12}
                              className={
                                index < Math.ceil(product.rating || 0)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'fill-gray-200 text-gray-200'
                              }
                            />
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
                        <Link
                          to={`/product/${product.bookId}`}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-1 flex items-center justify-center transition text-xs font-semibold"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          Chi tiết
                        </Link>
                        <OrangeButton
                          onClick={(e: React.MouseEvent) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          disabled={product.stock <= 0}
                          className="flex-1 gap-1 py-1 text-xs normal-case disabled:bg-gray-400"
                        >
                          <ShoppingCart size={14} />
                          <span className="hidden sm:inline">Thêm</span>
                        </OrangeButton>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && !loading && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Trước
                  </button>

                  {Array.from({ length: totalPages }, (_, index) => {
                    const pageNum = index + 1;
                    const shouldShow = pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1;

                    if (!shouldShow && pageNum !== 2 && pageNum !== totalPages - 1) {
                      return null;
                    }

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
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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
                      <p className="text-gray-500 text-sm mt-1">Vui lòng chờ một chút</p>
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
