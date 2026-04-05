import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import axiosClient from '../api/axiosClient';

interface Category {
  categoryId: string;
  name: string;
  isActive: boolean;
}

export default function CategoryMenu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await axiosClient.get('/Categories');
      setCategories(response.filter((c: Category) => c.isActive).slice(0, 10));
    } catch (error) {
      console.error('Lỗi khi tải danh mục:', error);
    }
  };

  return (
    <div className="relative group">
      <button
        onMouseEnter={() => setShowDropdown(true)}
        onMouseLeave={() => setShowDropdown(false)}
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 text-white hover:bg-orange-700 px-3 py-2 rounded transition whitespace-nowrap"
      >
        <span>Danh mục</span>
        <ChevronDown size={18} className={`transition ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div
          onMouseEnter={() => setShowDropdown(true)}
          onMouseLeave={() => setShowDropdown(false)}
          className="absolute left-0 mt-0 w-56 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 py-2 top-full"
        >
          {categories.length > 0 ? (
            <>
              {categories.map((cat) => (
                <Link
                  key={cat.categoryId}
                  to={`/products?categoryId=${cat.categoryId}`}
                  onClick={() => setShowDropdown(false)}
                  className="block px-4 py-2 text-gray-800 hover:bg-orange-50 hover:text-orange-600 transition text-sm"
                >
                  {cat.name}
                </Link>
              ))}
            </>
          ) : (
            <div className="px-4 py-2 text-gray-500 text-sm">Đang tải danh mục...</div>
          )}
        </div>
      )}
    </div>
  );
}
