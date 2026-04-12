
import axiosClient from '../api/axiosClient';

const GUEST_CART_KEY = 'guestCart';

export const getGuestCart = () => {
  const json = localStorage.getItem(GUEST_CART_KEY);
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const saveGuestCart = (cart: any[]) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
};

export const clearGuestCart = () => {
  localStorage.removeItem(GUEST_CART_KEY);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const addToGuestCart = (product: any, quantity: number): { success: boolean; message?: string } => {
  const cart = getGuestCart();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingItem = cart.find((item: any) => item.bookId === product.bookId);
  const currentQuantity = existingItem ? existingItem.quantity : 0;
  if (currentQuantity + quantity > product.stock) {
    return {
      success: false,
      message: existingItem 
        ? `Chỉ còn ${product.stock} sản phẩm trong kho. Hiện có ${currentQuantity}, bạn thêm ${quantity}`
        : `Chỉ còn ${product.stock} sản phẩm trong kho. Bạn yêu cầu ${quantity}`
    };
  }

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      cartItemId: 'GUEST-' + product.bookId,
      bookId: product.bookId,
      bookTitle: product.title,
      price: product.price,
      discountedPrice: product.discountedPrice || product.price,
      quantity,
      imageUrl: product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : (product.mainImageUrl || product.imageUrl || ''),
      stock: product.stock
    });
  }
  saveGuestCart(cart);
  return { success: true };
};

export const syncGuestCartToBackend = async () => {
  const cart = getGuestCart();
  if (cart.length === 0) return;

  for (const item of cart) {
    try {
      await axiosClient.post('/cart/items', {
        bookId: item.bookId,
        quantity: item.quantity
      });
    } catch (err) {
      console.error('Failed to sync guest cart item', err);
    }
  }
  // Giữ lại giỏ hàng ảo trong local storage cho tới khi đăng xuất theo yêu cầu
};

export const removeFromGuestCart = (bookId: string) => {
  let cart = getGuestCart();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cart = cart.filter((item: any) => item.bookId !== bookId);
  saveGuestCart(cart);
};

export const updateGuestCartQuantity = (bookId: string, quantity: number): { success: boolean; message?: string } => {
  const cart = getGuestCart();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = cart.find((item: any) => item.bookId === bookId);
  if (item) {
    if (quantity > (item.stock || 9999)) {
      return {
        success: false,
        message: `Chỉ còn ${item.stock || 9999} sản phẩm trong kho. Bạn yêu cầu ${quantity}`
      };
    }
    item.quantity = quantity;
    saveGuestCart(cart);
    return { success: true };
  }
  return { success: false, message: 'Sản phẩm không tồn tại trong giỏ hàng' };
};;


