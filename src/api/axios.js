
// import axios from "axios";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { apiUrl } from '../utils/apiUrl';

// const axiosInstance = axios.create({
//     baseURL: `${apiUrl}/api`,
//     timeout: 10000,
// });

// // Attach token if exists (optional but recommended)
// axiosInstance.interceptors.request.use(async (config) => {
//     try {
//         const token = await AsyncStorage.getItem("token");
//         if (token) {
//             config.headers.Authorization = `Bearer ${token}`;
//         }
//     } catch (err) {
//         console.log("Error retrieving token:", err);
//     }
//     return config;
// });

// export default axiosInstance;


import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiUrl } from "../utils/apiUrl";

const axiosInstance = axios.create({
  baseURL: `${apiUrl}/api`,
  timeout: 10000,
});

/* ---------------- REQUEST INTERCEPTOR ---------------- */
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    console.log("token ", token)
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

      // OPTIONAL: navigate to login
      // navigationRef.reset({ index: 0, routes: [{ name: "Login" }] });
    }

    if (status === 403) {
      // Plan access denied
      // Trigger upgrade modal or toast
      console.log("Access denied: upgrade required");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

