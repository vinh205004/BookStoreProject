import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';

interface ProductDetail {
  bookId: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  authorName: string;
  authorId: string;
  categoryName: string;
  categoryId: string;
  publisherName: string;
  publisherId: string;
  targetAudience: string;
  length: number;
  width: number;
  lengthUnit: string;
  pageCount: number;
  imageUrls: string[];
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = await axiosClient.get(`/Books/${id}/detail`);
        setProduct(response);
      } catch {
        toast.error('Lỗi khi tải chi tiết sản phẩm!');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProduct();
    }
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      // Check stock first
      if (quantity > product.stock) {
        toast.warning(`Chỉ còn ${product.stock} sản phẩm trong kho!`);
        return;
      }

      // Call backend API to add to cart
      console.log('Adding to cart:', { bookId: product.bookId, quantity });
      await axiosClient.post('/cart/items', {
        bookId: product.bookId,
        quantity: quantity
      });

      // Dispatch custom event to update badge
      window.dispatchEvent(new Event('cart-updated'));
      toast.success('Đã thêm vào giỏ hàng!');
      setQuantity(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Add to cart error:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Lỗi khi thêm vào giỏ hàng!';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-gray-500">Đang tải...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-gray-500">Không tìm thấy sản phẩm</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-6 transition"
      >
        <ArrowLeft size={20} />
        Quay lại
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
            <img
              src={product.imageUrls[selectedImageIndex] || '/placeholder.jpg'}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>

          {product.imageUrls.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.imageUrls.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`aspect-square rounded overflow-hidden border-2 transition ${
                    selectedImageIndex === idx ? 'border-orange-500' : 'border-gray-300'
                  }`}
                >
                  <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.title}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} className="fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-gray-600">(4.5 - 127 đánh giá)</span>
          </div>

          {/* Price */}
          <div className="mb-6">
            <p className="text-4xl font-bold text-orange-500 mb-2">{product.price.toLocaleString()}₫</p>
            <p className={`text-lg ${product.stock > 0 ? 'text-green-600' : 'text-red-600'} font-semibold`}>
              {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}
            </p>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Tác giả</p>
              <p className="font-semibold text-gray-800">{product.authorName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Danh mục</p>
              <p className="font-semibold text-gray-800">{product.categoryName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Nhà xuất bản</p>
              <p className="font-semibold text-gray-800">{product.publisherName}</p>
            </div>
          </div>

          {/* Specifications */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-gray-800 mb-3">Thông số kỹ thuật</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Kích thước</p>
                <p className="font-semibold text-gray-800">{product.width}cm x {product.length}{product.lengthUnit}</p>
              </div>
              <div>
                <p className="text-gray-600">Đối tượng</p>
                <p className="font-semibold text-gray-800">{product.targetAudience}</p>
              </div>
              <div>
                <p className="text-gray-600">Số trang</p>
                <p className="font-semibold text-gray-800">{product.pageCount}</p>
              </div>
            </div>
          </div>

          {/* Quantity & Add to Cart */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Số lượng</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={product.stock <= 0}
                className="bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 px-4 py-2 rounded transition"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={product.stock <= 0}
                className="w-16 px-2 py-2 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={product.stock <= 0}
                className="bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 px-4 py-2 rounded transition"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition text-lg"
          >
            <ShoppingCart size={24} />
            {product.stock > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Mô tả sản phẩm</h2>
        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
          {product.description}
        </div>
      </div>
    </div>
  );
}
