import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const TOKENS = {
  AUTH_TOKEN: "@angelone_auth_token",
  FEED_TOKEN: "@angelone_feed_token",
  REFRESH_TOKEN: "@angelone_refresh_token",
  CLIENT_ID: "@angelone_client_id",
};
export const STORAGE_KEYS = {
  token: 'token',
};

const SHOW_KEY = "watchlist_show_names";
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [feedToken, setFeedToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadTokens = async () => {
    try {
      const a = await AsyncStorage.getItem(TOKENS.AUTH_TOKEN);
      const f = await AsyncStorage.getItem(TOKENS.FEED_TOKEN);
      const r = await AsyncStorage.getItem(TOKENS.REFRESH_TOKEN);
      const c = await AsyncStorage.getItem(TOKENS.CLIENT_ID);
      const u = await AsyncStorage.getItem("userId");
      const d = await AsyncStorage.getItem("userData");
      const p = await AsyncStorage.getItem("permissions");
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.token);
      if (storedToken) {
        setToken(storedToken);
      }

      setAuthToken(a);
      setFeedToken(f);
      setRefreshToken(r);
      setClientId(c);
      setUserId(u);
      if (d) setUserData(JSON.parse(d));
      if (p) {
        setPermissions(JSON.parse(p));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTokens();
  }, []);

  const setAuthData = async ({ authToken, feedToken, refreshToken, clientId, userId, userData, permissions, token }) => {
    if (authToken) {
      await AsyncStorage.setItem(TOKENS.AUTH_TOKEN, authToken.toString());
      setAuthToken(authToken.toString());
    }
    if (feedToken) {
      await AsyncStorage.setItem(TOKENS.FEED_TOKEN, feedToken.toString());
      setFeedToken(feedToken.toString());
    }
    if (refreshToken) {
      await AsyncStorage.setItem(TOKENS.REFRESH_TOKEN, refreshToken.toString());
      setRefreshToken(refreshToken.toString());
    }
    if (clientId) {
      await AsyncStorage.setItem(TOKENS.CLIENT_ID, clientId.toString());
      setClientId(clientId.toString());
    }
    if (userId) {
      await AsyncStorage.setItem("userId", userId.toString());
      setUserId(userId.toString());
    }
    if (userData) {
      await AsyncStorage.setItem("userData", JSON.stringify(userData));
      setUserData(userData);
    }
    if (permissions) {
      await AsyncStorage.setItem("permissions", JSON.stringify(permissions));
      setPermissions(permissions);
    }
    if (token) {
      await AsyncStorage.setItem(STORAGE_KEYS.token, token);
      setToken(token);
    }
  };

  const clearAuth = async () => {
    await AsyncStorage.removeItem(TOKENS.AUTH_TOKEN);
    await AsyncStorage.removeItem(TOKENS.FEED_TOKEN);
    await AsyncStorage.removeItem(TOKENS.REFRESH_TOKEN);
    await AsyncStorage.removeItem(TOKENS.CLIENT_ID);
    await AsyncStorage.removeItem(SHOW_KEY);
    await AsyncStorage.removeItem("userId");
    await AsyncStorage.removeItem("userData");
    await AsyncStorage.removeItem("permissions")
    await AsyncStorage.removeItem("token");

    setAuthToken(null);
    setFeedToken(null);
    setRefreshToken(null);
    setClientId(null);
    setUserId(null);
    setUserData(null);
    setPermissions([]);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        authToken,
        feedToken,
        refreshToken,
        clientId,
        userId,
        userData,
        loading,
        setAuthData,
        clearAuth,
        permissions,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);