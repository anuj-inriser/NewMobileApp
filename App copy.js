import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { apiUrl } from "./src/utils/apiUrl";

// SDK 54 fix: Use legacy for downloadAsync compatibility
import * as FileSystem from "expo-file-system/legacy";
import * as Notifications from "expo-notifications";
import messaging from "@react-native-firebase/messaging";
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

// 🔹 Screens (Saare imports pehle jaise hi hain)
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

function AppNavigator() {
  return (
    <MainLayout>
      <AppStack.Navigator screenOptions={{ headerShown: false }}>
        <AppStack.Screen name="Equity" component={EquityScreen} />
        <AppStack.Screen name="Trade" component={TradeScreen} />
        <AppStack.Screen name="NewsScreen" component={NewsScreen} />
        <AppStack.Screen name="NewsReadingScreen" component={NewsReadingScreen} />
        <AppStack.Screen name="Portfolio" component={PortfolioScreen} />
        <AppStack.Screen name="Profile" component={Profile} options={{ presentation: "modal", animation: "slide_from_left" }} />
        <AppStack.Screen name="TradeOrderList" component={TradeOrderListScreen} />
        <AppStack.Screen name="OrdersScreen" component={OrdersScreen} />
        <AppStack.Screen name="StockTimelineScreen" component={StockTimelineScreen} />
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

/* 🔔 NOTIFICATION SETTINGS */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

export default function App() {
  useEffect(() => {
    const setupNotifications = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') console.log("Permission not granted!");

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default Channel",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          showBadge: true,
        });
      }
    };

    setupNotifications();

    /* 🔥 FCM HANDLER WITH LOGGING */
    /* 🔥 FCM HANDLER - FIXED VERSION */
    const fcmUnsubscribe = messaging().onMessage(async (remoteMessage) => {
      const data = remoteMessage.data || {};
      const { title, body, notificationId, imageUrl, soundUrl } = data;

      let localImageUri = null;

      // 1. Download Logic (Same as before)
      if (imageUrl && imageUrl.startsWith('http')) {
        try {
          const extension = imageUrl.split('.').pop().split(/\#|\?/)[0] || 'jpg';
          const filename = `notif_${Date.now()}.${extension}`;
          const downloadPath = `${FileSystem.cacheDirectory}${filename}`;
          const result = await FileSystem.downloadAsync(imageUrl, downloadPath);
          if (result.status === 200) {
            localImageUri = result.uri;
          }
        } catch (error) {
          console.error("Download Error:", error);
        }
      }

      // 2. Schedule Notification with SAFETY CHECKS
      try {
        const finalTitle = title || "Smart Stock Update";
        const finalBody = body || "You have a new update";

        await Notifications.scheduleNotificationAsync({
          content: {
            title: finalTitle,
            body: finalBody,
            sound: false,
            priority: 'max',
            // Agar image hai tabhi BIG_PICTURE style lagao, warna default rakho
            ...(localImageUri && Platform.OS === 'android' ? {
              android: {
                channelId: "default",
                notificationStyle: {
                  type: Notifications.AndroidNotificationStyle.BIG_PICTURE,
                  picture: localImageUri,
                  title: finalTitle, // Safety: Title must be string
                  summary: finalBody  // Safety: Body must be string
                },
              }
            } : {
              android: {
                channelId: "default",
              }
            }),
            attachments: localImageUri ? [{ url: localImageUri }] : [],
            data: { notificationId, originalImage: imageUrl, localImage: localImageUri },
          },
          trigger: null,
        });
      } catch (scheduleError) {
        console.error("Scheduling Failed, sending fallback:", scheduleError);
        // Fallback: Agar upar wala fail ho jaye toh bina style ke bhej do
        await Notifications.scheduleNotificationAsync({
          content: { title: title || "Update", body: body || "" },
          trigger: null,
        });
      }

      // Sound and Mark-Delivered logic...
      if (soundUrl) setTimeout(() => playNotificationSound(soundUrl), 300);
    });

    const openSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log("Notification Tapped! Data ->", data);
    });

    connectMarketWS();
    const wsUnsubscribe = onMarketMessage((msg) => {
      if (msg?.type === "PRICE") applyPriceMessage(msg);
    });

    return () => {
      if (fcmUnsubscribe) fcmUnsubscribe();
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
                <RootStack.Screen name="TradeOrder" component={TradeOrderScreen} />
                <RootStack.Screen name="AdvancedChart" component={AdvancedChartScreen} options={{ headerShown: true }} />
              </RootStack.Navigator>
            </NavigationContainer>
          </AuthProvider>
        </AppQueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}