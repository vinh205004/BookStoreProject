import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import axiosClient from '../api/axiosClient';

interface SearchProduct {
  bookId: string;
  title: string;
  price: number;
  mainImageUrl?: string;
}

export default function SearchDropdown() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim().length >= 1) {
      searchProducts();
    } else {
      setResults([]);
      setShowResults(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const searchProducts = async () => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await axiosClient.get(`/Books/search?searchQuery=${encodeURIComponent(query)}`);
      setResults(response.slice(0, 5));
      setShowResults(true);
    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query)}`);
      setQuery('');
      setShowResults(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md mx-8 relative">
      <div className="relative w-full">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length >= 1) {
              setShowResults(true);
            }
          }}
          onFocus={() => query.trim().length >= 1 && setShowResults(true)}
          placeholder="Tìm sách..."
          className="w-full px-4 py-2 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-300"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setShowResults(false);
            }}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          <Search size={20} />
        </button>

        {/* Dropdown Results */}
        {showResults && (query.trim().length >= 1) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-40 max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <p>Đang tìm kiếm...</p>
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="divide-y">
                  {results.map((product) => (
                    <button
                      key={product.bookId}
                      onClick={() => {
                        navigate(`/product/${product.bookId}`);
                        setQuery('');
                        setShowResults(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition text-left"
                    >
                      {product.mainImageUrl && (
                        <img
                          src={product.mainImageUrl}
                          alt={product.title}
                          className="w-10 h-10 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 text-sm line-clamp-1">
                          {product.title}
                        </h4>
                        <p className="text-orange-500 font-bold text-sm">
                          {product.price.toLocaleString()}₫
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    navigate(`/products?search=${encodeURIComponent(query)}`);
                    setQuery('');
                    setShowResults(false);
                  }}
                  className="w-full text-center p-3 border-t bg-white hover:bg-orange-50 transition text-orange-500 font-bold text-sm"
                >
                  Xem tất cả kết quả
                </button>
              </>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <p>Không tìm thấy sách nào</p>
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
