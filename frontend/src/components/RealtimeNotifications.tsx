import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import { toast } from 'react-toastify';

const API_ORIGIN = 'https://localhost:7087';

type OrderNotification = {
  orderId: string;
  statusText?: string;
  totalAmount?: number;
  paymentMethod?: string;
};

type ReviewNotification = {
  reviewId: string;
  bookId?: string;
  userName?: string;
  rating?: number;
  replyId?: string;
  content?: string;
};

const formatCurrency = (value?: number) =>
  typeof value === 'number' ? `${value.toLocaleString('vi-VN')} đ` : '';

export default function RealtimeNotifications() {
  const location = useLocation();
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    let isDisposed = false;

    const startConnection = async () => {
      const token = localStorage.getItem('token');
      if (!token || token === 'null' || token === 'undefined') {
        if (connectionRef.current) {
          await connectionRef.current.stop();
          connectionRef.current = null;
          tokenRef.current = null;
        }
        return;
      }

      if (connectionRef.current && tokenRef.current === token) {
        return;
      }

      if (connectionRef.current) {
        await connectionRef.current.stop();
        connectionRef.current = null;
      }

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_ORIGIN}/hubs/notifications`, {
          accessTokenFactory: () => localStorage.getItem('token') || ''
        })
        .withAutomaticReconnect()
        .build();

      const joinAdminGroup = async () => {
        try {
          await connection.invoke('JoinAdminGroup');
        } catch (error) {
          console.debug('Realtime admin group skipped:', error);
        }
      };

      connection.onreconnected(() => {
        joinAdminGroup();
      });

      connection.on('OrderStatusChanged', (payload: OrderNotification) => {
        toast.info(`Đơn #${payload.orderId} đã chuyển sang: ${payload.statusText || 'trạng thái mới'}`);
        window.dispatchEvent(new CustomEvent('order-status-changed', { detail: payload }));
      });

      connection.on('ReviewReplied', (payload: ReviewNotification) => {
        toast.info('Admin vừa phản hồi đánh giá của bạn.');
        window.dispatchEvent(new CustomEvent('review-replied', { detail: payload }));
      });

      connection.on('NewOrderCreated', (payload: OrderNotification) => {
        const amount = formatCurrency(payload.totalAmount);
        toast.info(`Có đơn hàng mới #${payload.orderId}${amount ? ` - ${amount}` : ''}`);
        window.dispatchEvent(new CustomEvent('admin-orders-updated', { detail: payload }));
      });

      connection.on('OrderCancelledByCustomer', (payload: OrderNotification) => {
        toast.warning(`Khách hàng vừa hủy đơn #${payload.orderId}`);
        window.dispatchEvent(new CustomEvent('admin-orders-updated', { detail: payload }));
      });

      connection.on('NewReviewCreated', (payload: ReviewNotification) => {
        toast.info(`${payload.userName || 'Khách hàng'} vừa đánh giá ${payload.rating || ''} sao.`);
        window.dispatchEvent(new CustomEvent('admin-reviews-updated', { detail: payload }));
      });

      connection.on('ReviewReplyCreated', (payload: ReviewNotification) => {
        toast.info(`${payload.userName || 'Khách hàng'} vừa phản hồi một đánh giá.`);
        window.dispatchEvent(new CustomEvent('admin-reviews-updated', { detail: payload }));
      });

      connection.on('ReviewUpdatedByCustomer', (payload: ReviewNotification) => {
        toast.info(`${payload.userName || 'Khách hàng'} vừa sửa đánh giá.`);
        window.dispatchEvent(new CustomEvent('admin-reviews-updated', { detail: payload }));
      });

      connection.on('ReviewDeletedByCustomer', (payload: ReviewNotification) => {
        toast.info('Khách hàng vừa xóa một đánh giá.');
        window.dispatchEvent(new CustomEvent('admin-reviews-updated', { detail: payload }));
      });

      connection.on('ReviewReplyUpdatedByCustomer', (payload: ReviewNotification) => {
        toast.info(`${payload.userName || 'Khách hàng'} vừa sửa phản hồi đánh giá.`);
        window.dispatchEvent(new CustomEvent('admin-reviews-updated', { detail: payload }));
      });

      connection.on('ReviewReplyDeletedByCustomer', (payload: ReviewNotification) => {
        toast.info('Khách hàng vừa xóa một phản hồi đánh giá.');
        window.dispatchEvent(new CustomEvent('admin-reviews-updated', { detail: payload }));
      });

      try {
        await connection.start();
        if (isDisposed) {
          await connection.stop();
          return;
        }

        await joinAdminGroup();

        connectionRef.current = connection;
        tokenRef.current = token;
      } catch (error) {
        console.error('Không thể kết nối realtime:', error);
      }
    };

    startConnection();

    return () => {
      isDisposed = true;
    };
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      connectionRef.current?.stop();
      connectionRef.current = null;
      tokenRef.current = null;
    };
  }, []);

  return null;
}
