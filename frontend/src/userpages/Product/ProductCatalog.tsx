import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Star, ShoppingCart, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [publishers, setPublishers] = useState<any[]>([]);
  const [audiences, setAudiences] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    categoryId: searchParams.get('categoryId') || '',
    authorId: searchParams.get('authorId') || '',
    publisherId: searchParams.get('publisherId') || '',
    targetAudience: searchParams.get('targetAudience') || '',
    minPrice: parseFloat(searchParams.get('minPrice') || '0') || 0,
    maxPrice: parseFloat(searchParams.get('maxPrice') || '999999') || 999999,
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
    });
  }, [searchParams]);

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
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = await axiosClient.get(`/Books/search?${params}`);
        setProducts(response);
      } catch {
        toast.error('Lỗi khi tải sản phẩm!');
      } finally {
        setLoading(false);
      }
    };

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

    loadData();
    loadCategories();
    loadAuthors();
    loadPublishers();
    loadAudiences();
  }, [filters.search, filters.categoryId, filters.authorId, filters.publisherId, filters.targetAudience, filters.minPrice, filters.maxPrice]);

  const handleFilterChange = (key: string, value: string | number) => {
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
    });
    setSearchParams({});
  };

  const handleAddToCart = async (product: Product) => {
    if (product.stock <= 0) {
      toast.warning('Sản phẩm hết hàng!');
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Sản Phẩm</h1>

      <div className="flex gap-6">
        {/* Filters - Desktop */}
        <aside className="hidden lg:block w-64">
          <div className="bg-white p-6 rounded-lg shadow">
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
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Categories */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Danh mục</label>
              <select
                value={filters.categoryId}
                onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', parseFloat(e.target.value))}
                  placeholder="Đến"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleResetFilters}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 rounded font-semibold transition"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Đang tải sản phẩm...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product.bookId} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                  {/* Image */}
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={product.mainImageUrl || '/placeholder.jpg'}
                      alt={product.title}
                      className="w-full h-full object-cover hover:scale-105 transition"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-800 line-clamp-2 mb-2">{product.title}</h3>

                    <p className="text-sm text-gray-600 mb-1">Tác giả: {product.authorName}</p>
                    <p className="text-sm text-gray-600 mb-3">Danh mục: {product.categoryName}</p>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">(4.5)</span>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-orange-500">{product.price.toLocaleString()}₫</span>
                      <span className={`text-sm px-2 py-1 rounded ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.stock > 0 ? `Còn ${product.stock}` : 'Hết hàng'}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`/product/${product.bookId}`}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded text-center transition"
                      >
                        Chi tiết
                      </a>
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock <= 0}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white py-2 rounded flex items-center justify-center gap-2 transition"
                      >
                        <ShoppingCart size={18} />
                        <span className="hidden sm:inline">Thêm</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
