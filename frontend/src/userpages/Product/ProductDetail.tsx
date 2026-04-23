/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BookOpen, Building2, Star, ShoppingCart, UserCircle, X } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';
import { getCurrentUserId, getUserRole } from '../../utils/tokenUtils';
import Breadcrumb from '../../components/Breadcrumb';
import OrangeButton from '../../components/OrangeButton';
import HomeProductCard from '../../components/HomeProductCard';

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
  rating?: number;
  reviewCount?: number;
  soldQuantity?: number;
  discountBadge?: string;
  discountedPrice?: number;
  discountVoucherCode?: string;
}

interface AuthorInfo {
  authorId: string;
  name: string;
  biography: string;
  imageUrl: string;
  bookCount?: number;
}

interface PublisherInfo {
  publisherId: string;
  name: string;
  description: string;
}

type InfoModalState =
  | { type: 'author'; data: AuthorInfo }
  | { type: 'publisher'; data: PublisherInfo }
  | null;

import { addToGuestCart } from '../../utils/cartUtils';

export default function ProductDetail() {
  const currentUserId = getCurrentUserId();
  const currentUserRole = getUserRole();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [infoModal, setInfoModal] = useState<InfoModalState>(null);
  const [loadingInfoModal, setLoadingInfoModal] = useState<'author' | 'publisher' | null>(null);

  const [authorBooks, setAuthorBooks] = useState<any[]>([]);
  const [categoryBooks, setCategoryBooks] = useState<any[]>([]);

  const getBookImage = (book: any) =>
    book?.imageUrls?.[0] || book?.mainImageUrl || book?.imageUrl || book?.img || '/placeholder.jpg';

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const response: any = await axiosClient.get(`/Books/${id}/detail`);
        setProduct(response);
        
        try {
          const authorRes: any = await axiosClient.get(`/Books/search?authorId=${response.authorId}`);
          setAuthorBooks((authorRes || []).filter((b: any) => b.bookId !== id).slice(0, 10));
        } catch (e) { console.error('Lỗi tải sách cùng tác giả'); }
        
        try {
          const catRes: any = await axiosClient.get(`/Books/search?categoryId=${response.categoryId}`);
          setCategoryBooks((catRes || []).filter((b: any) => b.bookId !== id).slice(0, 15));
        } catch (e) { console.error('Lỗi tải sách cùng danh mục'); }

      } catch {
        toast.error('Lỗi khi tải chi tiết sản phẩm!');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProduct();
      window.scrollTo(0, 0);
    }
  }, [id, navigate]);

  // Tabs for Description / Reviews
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyComment, setReplyComment] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editReviewRating, setEditReviewRating] = useState(5);
  const [editReviewComment, setEditReviewComment] = useState('');
  const [submittingEditReview, setSubmittingEditReview] = useState(false);

  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyComment, setEditReplyComment] = useState('');
  const [submittingEditReply, setSubmittingEditReply] = useState(false);

  const loadReviews = useCallback(async (showLoading = true) => {
    if (!id) return;

    try {
      if (showLoading) {
        setLoadingReviews(true);
      }

      const [res, canReviewRes] = await Promise.all([
        axiosClient.get(`/Reviews/book/${id}`),
        currentUserId ? axiosClient.get(`/Reviews/book/${id}/can-review`).catch(() => ({ canReview: false })) : Promise.resolve({ canReview: false })
      ]);
      setReviews((res as any) || []);
      if ((canReviewRes as any)?.canReview !== undefined) {
        setCanReview((canReviewRes as any).canReview);
      }
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      if (showLoading) {
        setLoadingReviews(false);
      }
    }
  }, [id, currentUserId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    const handleReviewReplied = (event: Event) => {
      const payload = (event as CustomEvent<{ bookId?: string; reviewId?: string }>).detail;
      if (!payload?.bookId || payload.bookId === id) {
        loadReviews(false);
        if (payload?.bookId === id) {
          setActiveTab('reviews');
        }
      }
    };

    window.addEventListener('review-replied', handleReviewReplied);
    return () => window.removeEventListener('review-replied', handleReviewReplied);
  }, [id, loadReviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    const token = localStorage.getItem('token');
    if (!token || token === 'null' || token === 'undefined') {
      toast.warning('Vui lòng đăng nhập để đánh giá sản phẩm!');
      return;
    }

    if (!userComment.trim()) {
      toast.warning('Vui lòng nhập nội dung đánh giá!');
      return;
    }

    try {
      setSubmittingReview(true);
      await axiosClient.post('/Reviews', {
        bookId: id,
        rating: userRating,
        comment: userComment
      });
      toast.success('Gửi đánh giá thành công!');
      setUserComment('');
      setUserRating(5);
      
      // Reload reviews
      const res: any = await axiosClient.get(`/Reviews/book/${id}`);
      setReviews(res || []);
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Lỗi khi gửi đánh giá!';
      toast.error(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

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

      // Reload reviews
      const res: any = await axiosClient.get(`/Reviews/book/${id}`);
      setReviews(res || []);
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Lỗi khi gửi phản hồi!';
      toast.error(msg);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleEditReviewSubmit = async (e: React.FormEvent, reviewId: string) => {
    e.preventDefault();
    if (!editReviewComment.trim()) {
       toast.warning('Vui lòng nhập nội dung đánh giá!');
       return;
    }
    try {
       setSubmittingEditReview(true);
       await axiosClient.put(`/Reviews/${reviewId}`, {
          bookId: id,
          rating: editReviewRating,
          comment: editReviewComment
       });
       toast.success('Cập nhật đánh giá thành công!');
       setEditingReviewId(null);
       const res: any = await axiosClient.get(`/Reviews/book/${id}`);
       setReviews(res || []);
    } catch (error: any) {
       toast.error(error?.response?.data?.error || 'Lỗi khi cập nhật đánh giá!');
    } finally {
       setSubmittingEditReview(false);
    }
  };

  const handleEditReplySubmit = async (e: React.FormEvent, replyId: string) => {
    e.preventDefault();
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
       const res: any = await axiosClient.get(`/Reviews/book/${id}`);
       setReviews(res || []);
    } catch (error: any) {
       toast.error(error?.response?.data?.error || 'Lỗi khi cập nhật phản hồi!');
    } finally {
       setSubmittingEditReply(false);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Bạn có chắc muốn xóa phản hồi này?')) return;
    
    try {
      await axiosClient.delete(`/Reviews/replies/${replyId}`);
      toast.success('Đã xóa phản hồi!');
      // Reload reviews
      const res: any = await axiosClient.get(`/Reviews/book/${id}`);
      setReviews(res || []);
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Lỗi khi xóa phản hồi!';
      toast.error(msg);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
    
    try {
      await axiosClient.delete(`/Reviews/${reviewId}`);
      toast.success('Đã xóa đánh giá!');
      // Reload reviews
      const res: any = await axiosClient.get(`/Reviews/book/${id}`);
      setReviews(res || []);
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Lỗi khi xóa đánh giá!';
      toast.error(msg);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    // Check stock first
    if (quantity > product.stock) {
      toast.warning(`Chỉ còn ${product.stock} sản phẩm trong kho!`);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      const result = addToGuestCart(product, quantity);
      if (result.success) {
        window.dispatchEvent(new Event('cart-updated'));
        toast.success('Đã thêm vào giỏ hàng!');
        setQuantity(1);
      } else {
        toast.error(result.message || 'Lỗi khi thêm vào giỏ hàng!');
      }
      return;
    }

    try {
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
    } catch (error: any) {
      console.error('Add to cart error:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Lỗi khi thêm vào giỏ hàng!';
      toast.error(errorMessage);
    }
  };

  const handleOpenAuthorInfo = async () => {
    if (!product) return;

    try {
      setLoadingInfoModal('author');
      const author: any = await axiosClient.get(`/Authors/${product.authorId}`);
      setInfoModal({ type: 'author', data: author });
    } catch {
      toast.error('Không tải được thông tin tác giả!');
    } finally {
      setLoadingInfoModal(null);
    }
  };

  const handleOpenPublisherInfo = async () => {
    if (!product) return;

    try {
      setLoadingInfoModal('publisher');
      const publisher: any = await axiosClient.get(`/Publishers/${product.publisherId}`);
      setInfoModal({ type: 'publisher', data: publisher });
    } catch {
      toast.error('Không tải được thông tin nhà xuất bản!');
    } finally {
      setLoadingInfoModal(null);
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
    <>
      <style>{`
        @keyframes relatedTitleBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.68; }
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', to: '/' },
          { label: product.categoryName || 'Danh mục', to: `/products?categoryId=${product.categoryId}` },
          { label: product.title }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="aspect-square bg-white rounded-none overflow-hidden mb-4 border border-gray-200 p-4 flex items-center justify-center">
            <img
              src={product.imageUrls[selectedImageIndex] || '/placeholder.jpg'}
              alt={product.title}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {product.imageUrls.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.imageUrls.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`aspect-square rounded-none overflow-hidden border-2 bg-white p-1 transition ${
                    selectedImageIndex === idx ? 'border-orange-500' : 'border-gray-300'
                  }`}
                >
                  <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="mb-2 text-2xl font-bold uppercase leading-tight text-gray-800 lg:text-[1.75rem]">{product.title}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            {reviews.length > 0 ? (
              <>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => {
                    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                    return (
                      <Star
                        key={i}
                        size={20}
                        className={
                          i < Math.round(avgRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-200'
                        }
                      />
                    );
                  })}
                </div>
                <span className="text-gray-600">
                  ({(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)} - {reviews.length} đánh giá)
                </span>
              </>
            ) : (
              <span className="text-gray-500 italic">Chưa có đánh giá</span>
            )}
          </div>

          {/* Price */}
          <div className="mb-6">
            {product.discountedPrice ? (
  <div className="mb-2 flex items-center gap-4 flex-wrap">
    <p className="text-4xl font-bold text-orange-500">{product.discountedPrice.toLocaleString()}</p>
    <p className="text-2xl line-through text-gray-400">{product.price.toLocaleString()}</p>
    {product.discountBadge && (
      <span className="bg-red-500 text-white font-bold px-3 py-1 rounded text-sm">
        {product.discountBadge}
      </span>
    )}
  </div>
) : (
  <p className="text-4xl font-bold text-orange-500 mb-2">{product.price.toLocaleString()}</p>
)}
            <p className={`text-lg ${product.stock > 0 ? 'text-green-600' : 'text-red-600'} font-semibold mb-2`}>
              {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}
            </p>
            <p className="text-sm text-gray-600">
              {product.soldQuantity ?? 0} đã bán
            </p>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-none">
            <div>
              <p className="text-sm text-gray-600">Tác giả</p>
              <button
                type="button"
                onClick={handleOpenAuthorInfo}
                disabled={loadingInfoModal === 'author'}
                className="font-semibold text-gray-800 hover:text-orange-600 underline-offset-4 hover:underline text-left disabled:text-gray-400"
              >
                {loadingInfoModal === 'author' ? 'Đang tải...' : product.authorName}
              </button>
            </div>
            <div>
              <p className="text-sm text-gray-600">Danh mục</p>
              <p className="font-semibold text-gray-800">{product.categoryName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Nhà xuất bản</p>
              <button
                type="button"
                onClick={handleOpenPublisherInfo}
                disabled={loadingInfoModal === 'publisher'}
                className="font-semibold text-gray-800 hover:text-orange-600 underline-offset-4 hover:underline text-left disabled:text-gray-400"
              >
                {loadingInfoModal === 'publisher' ? 'Đang tải...' : product.publisherName}
              </button>
            </div>
          </div>

          {/* Specifications */}
          <div className="mb-6 p-4 bg-blue-50 rounded-none">
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
                className="bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 px-4 py-2 rounded-none transition"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={product.stock <= 0}
                className="w-16 px-2 py-2 border border-gray-300 rounded-none text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={product.stock <= 0}
                className="bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 px-4 py-2 rounded-none transition"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold py-3 rounded-none flex items-center justify-center gap-2 transition text-lg"
          >
            <ShoppingCart size={24} />
            {product.stock > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
          </button>
        </div>
      </div>
      </div>
      
      {/* Sách cùng tác giả (Right Column) */}
      <div className="lg:col-span-1 border-l border-gray-200 pl-4 hidden lg:block">
        <div className="sticky top-6">
          <div className="flex items-center justify-between gap-2 mb-4 border-b pb-2">
            <h3 className="text-sm font-bold uppercase italic text-orange-500 whitespace-nowrap animate-[relatedTitleBlink_1.8s_ease-in-out_infinite]">Sách cùng tác giả</h3>
            <OrangeButton to={`/products?authorId=${product.authorId}`} size="sm">
              Xem tất cả
            </OrangeButton>
          </div>
          <div className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
            {authorBooks.length > 0 ? (
              authorBooks.map(book => (
                <div key={book.bookId} className="flex gap-3 relative group">
                  <Link to={`/product/${book.bookId}`} className="w-20 h-28 flex-shrink-0 bg-gray-100 border border-gray-200">
                    <img
                      src={getBookImage(book)}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = '/placeholder.jpg';
                      }}
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${book.bookId}`}>
                      <h4 className="font-semibold text-gray-800 text-sm leading-5 break-words group-hover:text-orange-500 transition-colors">
                        {book.title}
                      </h4>
                    </Link>
                    {book.discountedPrice ? (
                      <div className="mt-1">
                        <span className="text-orange-500 font-bold text-sm block">{book.discountedPrice.toLocaleString()}đ</span>
                        <span className="text-gray-400 text-xs line-through">{book.price.toLocaleString()}đ</span>
                      </div>
                    ) : (
                      <div className="mt-1 font-bold text-orange-500 text-sm">
                        {book.price.toLocaleString()}đ
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">Không có sách nào cùng tác giả.</p>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Description & Reviews Tabs */}
      <div className="mt-12">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('description')}
            className={`py-3 px-6 font-bold text-lg transition-colors border-b-2 ${
              activeTab === 'description'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Mô tả sản phẩm
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 px-6 font-bold text-lg transition-colors border-b-2 ${
              activeTab === 'reviews'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Đánh giá
          </button>
        </div>

        <div className="mt-6 p-6 bg-gray-50 rounded-none min-h-[200px] overflow-hidden relative">
          <div className="relative">
            {activeTab === 'description' && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                  {product.description}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col md:flex-row gap-8">
                {/* Left side: Review List */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Đánh giá từ khách hàng</h3>
                  
                  {loadingReviews ? (
                    <p className="text-gray-500">Đang tải đánh giá...</p>
                  ) : reviews && reviews.length > 0 ? (
                    <div className="space-y-6">
                      {reviews.map((review: any) => (
                        <div key={review.reviewId} className="bg-white p-4 justify-between border border-gray-200 rounded-none shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="font-bold text-gray-800">{review.userName || 'Người dùng'}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                          <div className="flex items-center mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={16}
                                className={star <= review.rating ? "text-yellow-400 fill-yellow-400 border-none" : "text-gray-300"}
                              />
                            ))}
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{review.comment}</p>
                          <div className="mt-2 text-sm text-gray-500">
                            <button
                              onClick={() => {
                                setReplyingTo(replyingTo === review.reviewId ? null : review.reviewId);
                                setReplyComment('');
                              }}
                              className="text-orange-500 hover:text-orange-600 font-semibold mr-4"
                            >
                              {replyingTo === review.reviewId ? 'Đóng' : 'Phản hồi'}
                            </button>
                            {currentUserId === (review.userId || review.UserId) && (
                              <button
                                onClick={() => {
                                  setEditingReviewId(review.reviewId);
                                  setEditReviewRating(review.rating);
                                  setEditReviewComment(review.comment || '');
                                }}
                                className="text-blue-500 hover:text-blue-600 font-semibold mr-4"
                              >
                                Sửa
                              </button>
                            )}
                            {(currentUserId === (review.userId || review.UserId) || currentUserRole === 'Admin') && (
                              <button
                                onClick={() => handleDeleteReview(review.reviewId)}
                                className="text-red-500 hover:text-red-600 font-semibold"
                              >
                                Xóa
                              </button>
                            )}
                          </div>
                          
                          {/* List Replies */}
                          {review.replies && review.replies.length > 0 && (
                            <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-3">
                              {review.replies.map((reply: any) => (
                                <div key={reply.replyId} className="bg-gray-50 p-3 rounded-none">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className="font-bold text-gray-800">{reply.userName}</span>
                                      {reply.isAdmin && (
                                        <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-none font-semibold">Admin</span>
                                      )}
                                      <span className="text-gray-500">{new Date(reply.createdAt).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    {/* (Optional) Thêm kiểm tra nếu là người dùng hiện tại hoặc admin thì hiển thị nút xóa */}
                                    <div className="flex gap-2">
                                      {currentUserId === (reply.userId || reply.UserId) && (
                                        <button onClick={() => {
                                          setEditingReplyId(reply.replyId);
                                          setEditReplyComment(reply.content);
                                        }} className="text-xs text-blue-500 hover:underline">
                                          Sửa
                                        </button>
                                      )}
                                      {(currentUserId === (reply.userId || reply.UserId) || currentUserRole === 'Admin') && (
                                        <button onClick={() => handleDeleteReply(reply.replyId)} className="text-xs text-red-500 hover:underline">
                                          Xóa
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  {editingReplyId === reply.replyId ? (
                                    <form onSubmit={(e) => handleEditReplySubmit(e, reply.replyId)} className="mt-2">
                                      <textarea
                                        className="w-full px-3 py-2 border border-gray-300 rounded-none text-sm focus:outline-none focus:border-orange-500"
                                        value={editReplyComment}
                                        onChange={(e) => setEditReplyComment(e.target.value)}
                                        disabled={submittingEditReply}
                                      />
                                      <div className="mt-2 flex justify-end gap-2">
                                        <button type="button" onClick={() => setEditingReplyId(null)} className="px-4 py-2 text-sm font-bold bg-gray-200 hover:bg-gray-300 rounded-none transition">Hủy</button>
                                        <button type="submit" disabled={submittingEditReply || !editReplyComment.trim()} className="px-4 py-2 text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 disabled:bg-gray-400 rounded-none transition">Lưu</button>
                                      </div>
                                    </form>
                                  ) : (
                                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{reply.content}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Edit Box */}
                          {editingReviewId === review.reviewId && (
                            <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-none">
                              <h4 className="font-bold text-sm mb-2 text-blue-800">Sửa đánh giá</h4>
                              <form onSubmit={(e) => handleEditReviewSubmit(e, review.reviewId)}>
                                <div className="flex items-center gap-1 cursor-pointer mb-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      size={20}
                                      onClick={() => setEditReviewRating(star)}
                                      className={star <= editReviewRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                                    />
                                  ))}
                                </div>
                                <textarea
                                  className="w-full px-3 py-2 border border-gray-300 rounded-none text-sm focus:outline-none focus:border-blue-500 min-h-[60px]"
                                  value={editReviewComment}
                                  onChange={(e) => setEditReviewComment(e.target.value)}
                                  disabled={submittingEditReview}
                                />
                                <div className="mt-2 flex justify-end gap-2">
                                  <button type="button" onClick={() => setEditingReviewId(null)} className="px-4 py-2 text-sm font-bold bg-gray-200 hover:bg-gray-300 rounded-none transition">Hủy</button>
                                  <button type="submit" disabled={submittingEditReview || !editReviewComment.trim()} className="px-4 py-2 text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 disabled:bg-gray-400 rounded-none transition">Lưu</button>
                                </div>
                              </form>
                            </div>
                          )}

                          {/* Reply Box */}
                          {replyingTo === review.reviewId && editingReviewId !== review.reviewId && (
                            <div className="mt-4 flex gap-2">
                              <input
                                type="text"
                                placeholder="Nhập phản hồi của bạn..."
                                disabled={submittingReply}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-none text-sm focus:outline-none focus:border-orange-500"
                                value={replyComment}
                                onChange={(e) => setReplyComment(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleReplySubmit(review.reviewId);
                                }}
                              />
                              <button
                                onClick={() => handleReplySubmit(review.reviewId)}
                                disabled={submittingReply || !replyComment.trim()}
                                className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold px-4 py-2 rounded-none transition"
                              >
                                Gửi
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Chưa có đánh giá nào cho sản phẩm này.</p>
                  )}
                </div>

                {/* Right side: Write Review */}
                <div className="md:w-1/3">
                  <div className="bg-white p-6 border border-gray-200 rounded-none shadow-sm sticky top-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Viết đánh giá của bạn</h3>
                    {canReview ? (
                    <form onSubmit={handleSubmitReview}>
                      <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Chất lượng</label>
                        <div className="flex items-center gap-1 cursor-pointer">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={28}
                              onClick={() => setUserRating(star)}
                              className={star <= userRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 hover:text-yellow-300"}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Bình luận</label>
                        <textarea
                          rows={4}
                          placeholder="Chia sẻ cảm nhận của bạn về cuốn sách này..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                          value={userComment}
                          onChange={(e) => setUserComment(e.target.value)}
                          disabled={submittingReview}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submittingReview || !userComment.trim()}
                        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-none transition"
                      >
                        {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                      </button>
                    </form>
                  ) : (
                    <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-none">
                      <p className="text-gray-600 text-sm">Bạn phải mua thành công sản phẩm này mới có thể viết đánh giá.</p>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Sách cùng danh mục (Bottom Scroll) */}
      <div className="mt-16 border-t border-gray-200 pt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold uppercase italic text-orange-500 animate-[relatedTitleBlink_1.8s_ease-in-out_infinite]">Sách cùng danh mục</h2>
          <OrangeButton to={`/products?categoryId=${product.categoryId}`}>
            Xem tất cả
          </OrangeButton>
        </div>
        
        <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar">
          {categoryBooks.length > 0 ? (
            categoryBooks.map(book => (
              <HomeProductCard
                key={book.bookId}
                bookId={book.bookId}
                title={book.title}
                price={book.price}
                stock={book.stock ?? 0}
                authorName={book.authorName || ''}
                mainImageUrl={getBookImage(book)}
                discountBadge={book.discountBadge}
                discountedPrice={book.discountedPrice}
                rating={book.rating}
                reviewCount={book.reviewCount}
                soldQuantity={book.soldQuantity}
                className="w-48"
                imageFit="contain"
              />
            ))
          ) : (
            <p className="text-gray-500 italic">Không có sách nào cùng danh mục.</p>
          )}
        </div>
      </div>
      
      </div>

      {infoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white w-full max-w-xl rounded shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <div className="flex items-center gap-2">
                {infoModal.type === 'author' ? (
                  <UserCircle className="text-orange-500" size={24} />
                ) : (
                  <Building2 className="text-orange-500" size={24} />
                )}
                <h3 className="font-bold text-xl text-gray-800">
                  {infoModal.type === 'author' ? 'Thông tin tác giả' : 'Thông tin nhà xuất bản'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="p-1 text-gray-500 hover:text-gray-800"
                aria-label="Đóng"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-5">
              {infoModal.type === 'author' ? (
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="w-28 h-28 flex-shrink-0 bg-gray-100 border border-gray-200 rounded overflow-hidden">
                    {infoModal.data.imageUrl ? (
                      <img
                        src={infoModal.data.imageUrl}
                        alt={infoModal.data.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <UserCircle size={56} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">{infoModal.data.name}</h4>
                    <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1 text-sm font-semibold mb-4">
                      <BookOpen size={16} />
                      {infoModal.data.bookCount ?? 0} tác phẩm trong kho
                    </div>
                    <p className="text-gray-700 leading-7 whitespace-pre-wrap">
                      {infoModal.data.biography || 'Chưa có tiểu sử cho tác giả này.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-4">{infoModal.data.name}</h4>
                  <p className="text-gray-700 leading-7 whitespace-pre-wrap">
                    {infoModal.data.description || 'Chưa có mô tả cho nhà xuất bản này.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

