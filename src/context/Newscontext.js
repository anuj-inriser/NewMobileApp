import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "../api/axios";

const NewsContext = createContext();

export const NewsProvider = ({ children }) => {
  const [unreadNewsCount, setUnreadNewsCount] = useState(0);
  const [latestNews, setLatestNews] = useState([]);
  const appState = useRef(AppState.currentState);
  const pollingInterval = useRef(null);

  const fetchNewsCount = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/newsfeed/published");
      const news = res.data?.data || [];
      setLatestNews(news);

      const lastReadId = await AsyncStorage.getItem("lastReadNewsId");
      if (!lastReadId) {
        setUnreadNewsCount(news.length);
        return;
      }

      const count = news.filter((item) => item.news_id > parseInt(lastReadId)).length;
      setUnreadNewsCount(count);
    } catch (error) {
      console.log("Error fetching news for context:", error);
    }
  }, []);

  const markNewsAsRead = useCallback(async () => {
    if (latestNews.length > 0) {
      const newestId = Math.max(...latestNews.map((n) => n.news_id));
      await AsyncStorage.setItem("lastReadNewsId", newestId.toString());
      setUnreadNewsCount(0);
    }
  }, [latestNews]);

  const startPolling = useCallback(() => {
    if (pollingInterval.current) return;
    fetchNewsCount();
    pollingInterval.current = setInterval(fetchNewsCount, 30000);
  }, [fetchNewsCount]);

  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        startPolling();
        fetchNewsCount();
      } else if (nextAppState.match(/inactive|background/)) {
        stopPolling();
      }
      appState.current = nextAppState;
    });

    startPolling();

    return () => {
      stopPolling();
      subscription.remove();
    };
  }, [startPolling, stopPolling, fetchNewsCount]);

  return (
    <NewsContext.Provider
      value={{
        unreadNewsCount,
        markNewsAsRead,
        fetchNewsCount,
      }}
    >
      {children}
    </NewsContext.Provider>
  );
};

export const useNewsContext = () => {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error("useNewsContext must be used within a NewsProvider");
  }
  return context;
};