import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { NotificationStorage, Notification } from '@/lib/storage';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    const userNotifications = NotificationStorage.getByUser(user.id);
    setNotifications(userNotifications);
    setUnreadCount(NotificationStorage.getUnreadCount(user.id));
  }, [user]);

  useEffect(() => {
    refresh();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const markAsRead = (id: string) => {
    NotificationStorage.markAsRead(id);
    refresh();
  };

  const markAllAsRead = () => {
    if (user) {
      NotificationStorage.markAllAsRead(user.id);
      refresh();
    }
  };

  const deleteNotification = (id: string) => {
    NotificationStorage.delete(id);
    refresh();
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      refresh,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
