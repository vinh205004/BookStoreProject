import { Link } from 'react-router-dom';

interface CompactBookSidebarItem {
  bookId: string;
  title: string;
  price: number;
  discountedPrice?: number;
  soldQuantity?: number;
  imageUrls?: string[];
  mainImageUrl?: string;
}

interface CompactBookSidebarProps {
  title: string;
  books: CompactBookSidebarItem[];
  emptyText: string;
  className?: string;
}

export default function CompactBookSidebar({
  title,
  books,
  emptyText,
  className = '',
}: CompactBookSidebarProps) {
  return (
    <div className={`border-l border-gray-200 pl-4 ${className}`.trim()}>
      <div className="sticky top-6">
        <div className="mb-4 border-b pb-2">
          <h3 className="text-sm font-bold uppercase italic text-orange-500">{title}</h3>
        </div>

        <div className="flex max-h-[42rem] flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          {books.length > 0 ? (
            books.map((book) => (
              <div key={book.bookId} className="group relative flex gap-3">
                <Link to={`/product/${book.bookId}`} className="h-28 w-20 flex-shrink-0 border border-gray-200 bg-gray-100">
                  <img
                    src={book.imageUrls?.[0] || book.mainImageUrl || '/placeholder.jpg'}
                    alt={book.title}
                    className="h-full w-full object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/product/${book.bookId}`}>
                    <h4 className="break-words text-sm font-semibold leading-5 text-gray-800 transition-colors group-hover:text-orange-500">
                      {book.title}
                    </h4>
                  </Link>
                  {book.discountedPrice ? (
                    <div className="mt-1">
                      <span className="block text-sm font-bold text-orange-500">{book.discountedPrice.toLocaleString('vi-VN')}đ</span>
                      <span className="text-xs text-gray-400 line-through">{book.price.toLocaleString('vi-VN')}đ</span>
                    </div>
                  ) : (
                    <div className="mt-1 text-sm font-bold text-orange-500">{book.price.toLocaleString('vi-VN')}đ</div>
                  )}
                  <div className="mt-2 text-xs font-medium text-gray-500">
                    Đã bán: <span className="font-semibold text-gray-700">{book.soldQuantity ?? 0}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm italic text-gray-500">{emptyText}</p>
          )}
        </div>
      </div>
    </div>
  );
}
