import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "../api/axios";

const IdeasContext = createContext();

export const IdeasProvider = ({ children }) => {
  const [unreadIdeasCount, setUnreadIdeasCount] = useState(0);
  const [latestIdeas, setLatestIdeas] = useState([]);
  const appState = useRef(AppState.currentState);
  const pollingInterval = useRef(null);

  const fetchIdeasCount = useCallback(async () => {
    try {
      // Fetch all recommendations to check for new ones
      const res = await axiosInstance.get("/traderecommendation/all");
      const ideas = res.data?.data || [];
      setLatestIdeas(ideas);

      const lastReadId = await AsyncStorage.getItem("lastReadIdeaId");
      if (!lastReadId) {
        setUnreadIdeasCount(ideas.length);
        return;
      }

      // Use traderecommendationid or tradeId as the unique identifier
      const count = ideas.filter((item) => {
        const ideaId = item.traderecommendationid || item.tradeId || 0;
        return ideaId > parseInt(lastReadId);
      }).length;
      
      setUnreadIdeasCount(count);
    } catch (error) {
      console.log("Error fetching ideas for context:", error);
    }
  }, []);

  const markIdeasAsRead = useCallback(async () => {
    if (latestIdeas.length > 0) {
      const newestId = Math.max(...latestIdeas.map((n) => n.traderecommendationid || n.tradeId || 0));
      if (newestId > 0) {
        await AsyncStorage.setItem("lastReadIdeaId", newestId.toString());
        setUnreadIdeasCount(0);
      }
    }
  }, [latestIdeas]);

  const startPolling = useCallback(() => {
    if (pollingInterval.current) return;
    fetchIdeasCount();
    pollingInterval.current = setInterval(fetchIdeasCount, 30000);
  }, [fetchIdeasCount]);

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
        fetchIdeasCount();
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
  }, [startPolling, stopPolling, fetchIdeasCount]);

  return (
    <IdeasContext.Provider
      value={{
        unreadIdeasCount,
        markIdeasAsRead,
        fetchIdeasCount,
      }}
    >
      {children}
    </IdeasContext.Provider>
  );
};

export const useIdeasContext = () => {
  const context = useContext(IdeasContext);
  if (!context) {
    throw new Error("useIdeasContext must be used within an IdeasProvider");
  }
  return context;
};