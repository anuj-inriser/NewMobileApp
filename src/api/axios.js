import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiUrl } from "../utils/apiUrl";
import { STORAGE_KEYS } from "../context/AuthContext";

const axiosInstance = axios.create({
  baseURL: `${apiUrl}/api`,
  timeout: 10000,
});

/* ---------------- REQUEST INTERCEPTOR ---------------- */
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.token);
    if (token) {
      config.headers.authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ---------------- RESPONSE INTERCEPTOR ---------------- */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      // Token expired / invalid
      await AsyncStorage.multiRemove([
        "authToken",
        "permissions",
        "token",
      ]);

    }

    if (status === 403) {
      return Promise.resolve({
        data: {
          success: false,
          permissions: []
        },
        permissionDenied: true,
      });
    }

    if (status >= 500) {
      return Promise.resolve({
        data: {
          success: false,
          message: "Server error. Please try again later.",
        },
        statusCode: status,
      });
    }

    if (!status) {
      return Promise.resolve({
        data: {
          success: false,
          message: error?.message || "Network request failed",
        },
        isNetworkError: true,
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

