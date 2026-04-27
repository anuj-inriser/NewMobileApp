import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "../api/axios";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;

      const response = await axiosInstance.get(
        `/notification/getNotificationUserWise?userId=${userId}`
      );
      
      const allNotifications = response?.data?.data ?? [];
      setNotifications(allNotifications);
      
      // Calculate unread count (where opened_at is null)
      const unread = allNotifications.filter(n => n.opened_at == null).length;
      setUnreadCount(unread);
    } catch (error) {
      console.log("Error fetching notifications for context:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;

      // Filter unread ones to mark
      const unreadIds = notifications
        .filter(n => n.opened_at == null)
        .map(n => n.id);

      if (unreadIds.length === 0) return;

      // Update local state immediately for UI responsiveness
      setUnreadCount(0);
      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          opened_at: n.opened_at || new Date().toISOString() 
        }))
      );

      // Call API to mark all as opened for this user
      await axiosInstance.post("/notification/mark-all-opened", { userId });
    } catch (error) {
      console.log("Error marking all notifications as read:", error);
    }
  }, [notifications]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Check every 5s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        fetchNotifications,
        markAllAsRead,
        loading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};