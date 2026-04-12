import { toast } from 'react-toastify';

const SHORT_DURATION = 1500; // 1.5 seconds

export const notify = {
  stockLimitExceeded: () => {
    toast.warning('Số lượng yêu cầu vượt quá sản phẩm trong kho!', {
      autoClose: SHORT_DURATION,
    });
  },
  stockLeft: (stock: number) => {
    toast.warning(`Chỉ còn ${stock} sản phẩm trong kho!`, {
      autoClose: SHORT_DURATION,
    });
  },
  minQuantity: () => {
    toast.warning('Số lượng tối thiểu là 1!', {
      autoClose: SHORT_DURATION,
    });
  },
  outOfStock: () => {
    toast.warning('Sản phẩm đã hết hàng!', {
      autoClose: SHORT_DURATION,
    });
  },
  successAddedToCart: () => {
    toast.success('Đã thêm vào giỏ hàng!', {
      autoClose: SHORT_DURATION,
    });
  },

  customWarning: (message: string) => {
    toast.warning(message, {
      autoClose: SHORT_DURATION,
    });
  },
  customSuccess: (message: string) => {
    toast.success(message, {
      autoClose: SHORT_DURATION,
    });
  }
};
