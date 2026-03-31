import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { Audio } from "expo-av";
import messaging from "@react-native-firebase/messaging";
import { apiUrl } from "./apiUrl";

let soundObject = null;

const normalizeSoundUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") return null;

  const cleaned = rawUrl.trim().replace(/\\/g, "/");
  if (!cleaned) return null;

  if (/^https?:\/\//i.test(cleaned)) {
    return encodeURI(cleaned);
  }

  const normalizedPath = cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
  return encodeURI(`${apiUrl}${normalizedPath}`);
};

const canPlayRemoteSound = async (resolvedUrl) => {
  try {
    const response = await fetch(resolvedUrl, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    console.log("Sound URL check failed:", resolvedUrl, error?.message || error);
    return false;
  }
};

// Notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false, // manual
    shouldSetBadge: false,
  }),
});

// Play sound manually
export async function playNotificationSound(soundUrl) {
  try {
    if (!soundUrl) return;
    const resolvedUrl = normalizeSoundUrl(soundUrl);
    if (!resolvedUrl) return;

    const exists = await canPlayRemoteSound(resolvedUrl);
    if (!exists) {
      console.log("Sound file not found:", resolvedUrl);
      return;
    }

    if (soundObject) {
      await soundObject.unloadAsync();
      soundObject = null;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri: resolvedUrl },
      { shouldPlay: true }
    );

    soundObject = sound;
    await sound.playAsync();
  } catch (err) {
    console.log("🔴 Sound play error:", err);
  }
};

// Register foreground notification
export function registerForegroundNotification() {
  messaging().onMessage(async (remoteMessage) => {
    const data = remoteMessage.data || {};
    const { title, body, notificationId, imageUrl, soundUrl } = data;

    // ✅ Foreground notification with image
    await showNotificationWithImage({ title, body, notificationId, imageUrl });

    if (soundUrl) {
      setTimeout(() => playNotificationSound(soundUrl), 300);
    }

    if (notificationId) {
      fetch(`${data.apiUrl || ""}/api/notification/mark-delivered`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      }).catch(() => { });
    }
  });

}

// Android channel
export async function setupNotificationChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
      sound: null, // manual
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}
