import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import HeaderDropdown, { type HeaderDropdownItem } from './HeaderDropdown';

interface Category {
  categoryId: string;
  name: string;
  isActive: boolean;
}

export default function CategoryMenu() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response: Category[] = await axiosClient.get('/Categories');
      setCategories(response.filter((c) => c.isActive).slice(0, 10));
    } catch (error) {
      console.error('Lỗi khi tải danh mục:', error);
    }
  };

  const items: HeaderDropdownItem[] =
    categories.length > 0
      ? categories.map((cat, index) => ({
          key: cat.categoryId,
          label: cat.name,
          to: `/products?categoryId=${cat.categoryId}`,
          bordered: index < categories.length - 1,
        }))
      : [{ key: 'loading', label: 'Đang tải danh mục...' }];

  return (
    <HeaderDropdown
      trigger={
        <>
          <span>Danh mục</span>
          <ChevronDown size={18} />
        </>
      }
      items={items}
      widthClassName="w-72"
    />
  );
}
