export interface Category {
  categoryId: number;
  name: string;
  description: string;
  isActive: boolean;
}
export interface Author {
  authorId: number;
  name: string;
  biography: string;
  imageUrl: string;
  isActive: boolean;
  bookCount?: number;
}
export interface Book {
  bookId: number;
  title: string;
  price: number;
  stock: number;
  isHidden: boolean;
  authorId: number;
  authorName: string;
  categoryId: number;
  categoryName: string; 
  imageUrls: string[]; 
  description: string;
  publisherId: number;
  publisherName: string;
}
export interface Publisher {
  publisherId: number;
  name: string;
  description: string;
  isActive: boolean;
}
export interface Voucher {
  voucherId: number;
  code: string;
  discountType: 'Direct' | 'Percentage';
  discountAmount: number;
  minOrderValue: number;
  quantity: number;
  usedCount: number;
  expirationDate: string;
  isActive: boolean;
}