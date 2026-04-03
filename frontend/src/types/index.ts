export interface Category {
  categoryId: string;
  name: string;
  description: string;
  isActive: boolean;
}
export interface Author {
  authorId: string;
  name: string;
  biography: string;
  imageUrl: string;
  isActive: boolean;
  bookCount?: number;
}
export interface Book {
  bookId: string;
  title: string;
  price: number;
  stock: number;
  isHidden: boolean;
  authorId: string;
  authorName: string;
  categoryId: string;
  categoryName: string; 
  imageUrls: string[]; 
  description: string;
  publisherId: string;
  publisherName: string;
  targetAudience?: string;
  length?: number;
  width?: number;
  lengthUnit?: string;
  pageCount?: number;
}
export interface Publisher {
  publisherId: string;
  name: string;
  description: string;
  isActive: boolean;
}
export interface Voucher {
  voucherId: string;
  code: string;
  discountType: 'Direct' | 'Percentage';
  discountAmount: number;
  minOrderValue: number;
  quantity: number;
  usedCount: number;
  expirationDate: string;
  isActive: boolean;
}
export interface OrderItem {
  orderItemId: string;
  bookId: string;
  bookTitle: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  orderId: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  totalAmount: number;
  status: string;
  orderDate: string;
  orderItems: OrderItem[];
}

export interface User {
  userId: string;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  role: string;
  isLocked: boolean;
  createdAt: string;
}