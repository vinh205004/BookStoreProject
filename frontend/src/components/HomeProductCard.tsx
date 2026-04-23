interface HomeProductCardProps {
  bookId: string;
  title: string;
  price: number;
  stock: number;
  authorName: string;
  mainImageUrl: string;
  discountBadge?: string;
  discountedPrice?: number;
  rating?: number;
  reviewCount?: number;
  soldQuantity?: number;
  className?: string;
  imageFit?: 'cover' | 'contain';
}

export default function HomeProductCard({
  bookId,
  title,
  price,
  stock,
  authorName,
  mainImageUrl,
  discountBadge,
  discountedPrice,
  rating,
  reviewCount,
  soldQuantity,
  className = '',
  imageFit = 'contain',
}: HomeProductCardProps) {
  const renderStars = () => {
    if (rating === undefined || rating === null) return null;

    return (
      <div className="mt-1 flex items-center gap-2">
        <div className="flex">
          {Array.from({ length: 5 }, (_, index) => (
            <span
              key={index}
              className={`text-sm ${index + 1 <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            >
              ★
            </span>
          ))}
        </div>
        {reviewCount !== undefined && <span className="text-xs text-gray-500">({reviewCount})</span>}
      </div>
    );
  };

  return (
    <a
      href={`/product/${bookId}`}
      className={`group relative block flex-none w-64 snap-start border-2 border-orange-500 bg-white shadow-md transition hover:shadow-lg ${className}`.trim()}
    >
      {discountBadge && (
        <div className="pointer-events-none absolute left-2 top-2 z-10 bg-red-500 px-2 py-1 text-xs font-bold text-white shadow-sm">
          {discountBadge}
        </div>
      )}

      <div className="aspect-square overflow-hidden border-2 border-orange-500 bg-white p-2">
        <img
          src={mainImageUrl || '/placeholder.jpg'}
          alt={title}
          className={`h-full w-full transition group-hover:scale-105 ${imageFit === 'contain' ? 'object-contain' : 'object-cover'}`}
          onError={(event) => {
            event.currentTarget.src = '/placeholder.jpg';
          }}
        />
      </div>

      <div className="flex flex-1 flex-col justify-between gap-1 p-2">
        <div>
          <div className="mb-1">
            <h3 className="min-h-[2.5rem] break-words text-sm font-bold leading-5 text-gray-800 transition group-hover:text-orange-500">
              {title}
            </h3>
            <p className="line-clamp-1 text-xs text-gray-600">{authorName}</p>
          </div>
          {renderStars()}
        </div>

        <div className="mt-auto flex flex-col">
          {discountedPrice ? (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-orange-500">{discountedPrice.toLocaleString('vi-VN')}đ</span>
              <span className="text-xs text-gray-400 line-through">{price.toLocaleString('vi-VN')}đ</span>
            </div>
          ) : (
            <span className="text-sm font-bold text-orange-500">{price.toLocaleString('vi-VN')}đ</span>
          )}
        </div>

        <div className="mt-1 flex items-end justify-between text-xs text-gray-500">
          <span>{soldQuantity ?? 0} đã bán</span>
          <span className={`px-2 py-0.5 ${stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {stock > 0 ? 'Có hàng' : 'Hết'}
          </span>
        </div>
      </div>
    </a>
  );
}
