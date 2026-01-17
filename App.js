import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { apiUrl } from "./src/utils/apiUrl";
import { Audio } from "expo-av";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { playNotificationSound } from "./src/utils/soundPlayer";
import { AuthProvider } from "./src/context/AuthContext";
import { AppQueryProvider } from "./src/context/QueryClientProvider";
import { connectMarketWS, onMarketMessage } from "./src/ws/marketWs";
import { applyPriceMessage } from "./src/store/marketPrices";

import MainLayout from "./src/Layout/MainLayout";

// 🔹 Screens
import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import PasswordScreen from "./src/screens/PasswordScreen";
import DematScreen from "./src/screens/DematScreen";

import EquityScreen from "./src/screens/EquityScreen";
import TradeScreen from "./src/screens/TradeScreen";
import NewsScreen from "./src/screens/NewsScreen";
import NewsReadingScreen from "./src/screens/NewsReadingScreen";
import PortfolioScreen from "./src/screens/PortfolioScreen";
import Profile from "./src/screens/ProfileScreen";

import TradeOrderListScreen from "./src/screens/TradeOrderListScreen";
import TradeOrderScreen from "./src/screens/TradeOrderScreen";
import OrdersScreen from "./src/screens/OrdersScreen";
import StockTimelineScreen from "./src/screens/StockTimelineScreen";
import StocksScreen from "./src/screens/StocksScreen";
import IndicesListScreen from "./src/screens/IndicesListScreen";
import IndicesDetailScreen from "./src/screens/IndicesDetailScreen";
import Learning from "./src/screens/Learning";
import LearningDetail from "./src/screens/LearningDetail";
import ChapterScreen from "./src/screens/ChapterScreen";
import ChapterDetails from "./src/screens/ChapterDetails";
import AdvancedChartScreen from "./src/screens/AdvancedChartScreen";

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();

/* ---------------- AUTH NAVIGATOR (NO HEADER) ---------------- */
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="Password" component={PasswordScreen} />
      <AuthStack.Screen name="Demat" component={DematScreen} />
    </AuthStack.Navigator>
  );
}

/* ---------------- APP NAVIGATOR ---------------- */
function AppNavigator() {
  return (
    <MainLayout>
      <AppStack.Navigator screenOptions={{ headerShown: false }}>
        <AppStack.Screen name="Equity" component={EquityScreen} />
        <AppStack.Screen name="Trade" component={TradeScreen} />
        <AppStack.Screen name="NewsScreen" component={NewsScreen} />
        <AppStack.Screen
          name="NewsReadingScreen"
          component={NewsReadingScreen}
        />
        <AppStack.Screen name="Portfolio" component={PortfolioScreen} />
        <AppStack.Screen
          name="Profile"
          component={Profile}
          options={{
            headerShown: false,
            presentation: "modal",
            animation: "slide_from_left",
          }}
        />
        <AppStack.Screen
          name="TradeOrderList"
          component={TradeOrderListScreen}
        />
        <AppStack.Screen name="OrdersScreen" component={OrdersScreen} />
        <AppStack.Screen
          name="StockTimelineScreen"
          component={StockTimelineScreen}
        />
        <AppStack.Screen name="Stocks" component={StocksScreen} />
        <AppStack.Screen name="IndicesList" component={IndicesListScreen} />
        <AppStack.Screen name="IndicesDetail" component={IndicesDetailScreen} />
        <AppStack.Screen name="Learning" component={Learning} />
        <AppStack.Screen name="LearningDetail" component={LearningDetail} />
        <AppStack.Screen name="ChapterScreen" component={ChapterScreen} />
        <AppStack.Screen name="ChapterDetails" component={ChapterDetails} />
      </AppStack.Navigator>
    </MainLayout>
  );
}

/* 🔔 GLOBAL NOTIFICATION HANDLER */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false, // We play sound manually
    shouldSetBadge: true,
  }),
});

/* ---------------- ROOT APP ---------------- */
export default function App() {
  useEffect(() => {
    const setupNotifications = async () => {
      await Notifications.requestPermissionsAsync();

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default Channel",
          importance: Notifications.AndroidImportance.MAX,
          sound: null,
          vibrationPattern: [0, 250, 250, 250],
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }
    };

    setupNotifications();

    /* 🔥 FOREGROUND MESSAGE HANDLER */
    const unsubscribeFCM = messaging().onMessage(async (remoteMessage) => {
      const data = remoteMessage.data || {};
      const { title, body, notificationId, imageUrl, soundUrl } = data;

      console.log("Received FCM foreground message with imageUrl:", imageUrl);

      const attachments = [];
      if (imageUrl && typeof imageUrl === "string") {
        let safeImageUrl = imageUrl.trim();
        if (safeImageUrl.startsWith("http://")) {
          safeImageUrl = safeImageUrl.replace("http://", "https://");
        }
        if (safeImageUrl.startsWith("https://")) {
          attachments.push({ identifier: "notif-image", url: safeImageUrl });
        }
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: title || "New Notification",
          body: body || "",
          sound: false,
          channelId: "default",
          data: { notificationId }, // ✅ FIXED: 'data' keyword added
          attachments,
        },
        trigger: null,
      });

      if (soundUrl) {
        setTimeout(() => playNotificationSound(soundUrl), 300);
      }

      if (notificationId) {
        try {
          await fetch(`${apiUrl}/api/notification/mark-delivered`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notificationId }),
          });
        } catch (err) {
          console.warn("Failed to mark notification as delivered", err);
        }
      }
    });

    /* 🔔 NOTIFICATION TAP HANDLER */
    const openSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const notificationId =
          response.notification.request.content.data?.notificationId;
        if (notificationId) {
          fetch(`${apiUrl}/api/notification/mark-opened`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notificationId }),
          }).catch((err) =>
            console.warn("Failed to mark notification as opened", err)
          );
        }
      }
    );

    /* 🔥 MARKET WEBSOCKET */
    connectMarketWS();
    const wsUnsubscribe = onMarketMessage((msg) => {
      if (msg?.type === "PRICE") {
        applyPriceMessage(msg);
      }
    });

    return () => {
      unsubscribeFCM();
      openSub.remove();
      if (wsUnsubscribe) wsUnsubscribe();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppQueryProvider>
          <AuthProvider>
            <NavigationContainer>
              <RootStack.Navigator screenOptions={{ headerShown: false }}>
                <RootStack.Screen name="Auth" component={AuthNavigator} />
                <RootStack.Screen name="App" component={AppNavigator} />
                <RootStack.Screen
                  name="TradeOrder"
                  component={TradeOrderScreen}
                />
                <RootStack.Screen
                  name="AdvancedChart"
                  component={AdvancedChartScreen}
                  options={{ headerShown: true }}
                />
              </RootStack.Navigator>
            </NavigationContainer>
          </AuthProvider>
        </AppQueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}