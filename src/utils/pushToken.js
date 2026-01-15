import messaging from "@react-native-firebase/messaging";
import { Platform } from "react-native";

/* 🔥 GET PURE FCM TOKEN (NO EXPO TOKEN) */
export async function getPushToken() {
  try {
    // 🔐 Permission
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log("❌ FCM permission not granted");
      return null;
    }

    // 🔥 REAL FCM TOKEN
    const fcmToken = await messaging().getToken();

    console.log("✅ REAL FCM Token:", fcmToken);

    return fcmToken;
  } catch (err) {
    console.log("❌ FCM token error:", err);
    return null;
  }
}
