import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { apiUrl } from "./src/utils/apiUrl";
import { AlertProvider } from "./src/context/AlertContext";
import AsyncStorage from '@react-native-async-storage/async-storage';

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
import { WatchlistProvider } from "./src/context/WatchlistContext";
import { AppQueryProvider } from "./src/context/QueryClientProvider";
import { connectMarketWS, onMarketMessage } from "./src/ws/marketWs";
import { applyPriceMessage } from "./src/store/marketPrices";
import { useAuth } from "./src/context/AuthContext";

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
import NotificationScreen from "./src/screens/NotificationScreen";
import PermissionGuard from "./src/guards/PermissionGuard";

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
        <AppStack.Screen
          name="Equity"
          // component={EquityScreen}
          children={() => (
            <PermissionGuard permission="VIEW_EQUITY">
              <EquityScreen />
            </PermissionGuard>
          )}
        />
        <AppStack.Screen name="Trade" component={TradeScreen} />
        <AppStack.Screen name="NewsScreen"
          children={() => (
            <PermissionGuard permission="VIEW_NEWS">
              <NewsScreen />
            </PermissionGuard>
          )} />
        <AppStack.Screen name="NewsReadingScreen" component={NewsReadingScreen} />
        <AppStack.Screen name="Portfolio"
          // component={PortfolioScreen}
          children={() => (
            <PermissionGuard permission="VIEW_PORTFOLIO">
              <PortfolioScreen />
            </PermissionGuard>
          )}
        />
        <AppStack.Screen name="Profile" component={Profile} options={{ presentation: "modal", animation: "slide_from_left" }} />
        <AppStack.Screen
          name="TradeOrderList"
          // component={TradeOrderListScreen}
          children={() => (
            <PermissionGuard permission="VIEW_WATCHLIST">
              <TradeOrderListScreen />
            </PermissionGuard>
          )}
        />
        <AppStack.Screen name="OrdersScreen" component={OrdersScreen} />
        <AppStack.Screen name="StockTimelineScreen" component={StockTimelineScreen} />
        <AppStack.Screen name="Stocks" component={StocksScreen} />
        <AppStack.Screen name="IndicesList" component={IndicesListScreen} />
        <AppStack.Screen name="IndicesDetail" component={IndicesDetailScreen} />
        <AppStack.Screen name="Learning"
          children={() => (
            <PermissionGuard permission="VIEW_LEARNING">
              <Learning />
            </PermissionGuard>
          )} />
        <AppStack.Screen name="LearningDetail" component={LearningDetail} />
        <AppStack.Screen name="ChapterScreen" component={ChapterScreen} />
        <AppStack.Screen name="ChapterDetails" component={ChapterDetails} />
        <AppStack.Screen name="NotificationScreen" component={NotificationScreen} />
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

function RootNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return null; // or SplashScreen
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <>
          <RootStack.Screen name="App" component={AppNavigator} />
          <RootStack.Screen name="TradeOrder" component={TradeOrderScreen} />
          <RootStack.Screen name="AdvancedChart" component={AdvancedChartScreen} />
        </>
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
}

export default function App() {


  useEffect(() => {
    const setupNotifications = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') console.log("Permission not granted!");
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default Channel",
          importance: Notifications.AndroidImportance.MAX, // Compulsory for Popup
          vibrationPattern: [0, 250, 250, 250],
          enableVibrate: true,
          showBadge: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }
    };

    setupNotifications();
    /* 🔥 FCM HANDLER - UPDATED FOR ANDROID CONTENT URI */
    /* 🔥 FCM HANDLER - FIXED VERSION (No More Undefined Error) */
    const fcmUnsubscribe = messaging().onMessage(async (remoteMessage) => {
      const data = remoteMessage.data || {};
      const { title, body, notificationId, imageUrl, soundUrl } = data;

      let localImageUri = null;

      if (imageUrl && imageUrl.startsWith('http')) {
        try {
          const extension = imageUrl.split('.').pop().split(/\#|\?/)[0] || 'jpg';
          const filename = `notif_${Date.now()}.${extension}`;
          const downloadPath = `${FileSystem.cacheDirectory}${filename}`;
          const result = await FileSystem.downloadAsync(imageUrl, downloadPath);

          if (result.status === 200) {
            // Android compatibility ke liye Content URI
            localImageUri = await FileSystem.getContentUriAsync(result.uri);
          }
        } catch (error) {
          console.error("Download Error:", error);
        }
      }

      try {
        const finalTitle = title || "Smart Stock Update";
        const finalBody = body || "New notification received";

        await Notifications.scheduleNotificationAsync({
          content: {
            title: finalTitle,
            body: finalBody,
            sound: false,
            priority: 'max',
            // 🖼️ Force Style using String (To avoid 'undefined' error)
            ...(localImageUri && Platform.OS === 'android' ? {
              android: {
                channelId: "default",
                notificationStyle: {
                  type: "bigpicture", // 👈 String use karo 'bigpicture'
                  picture: localImageUri,
                  title: finalTitle,
                  summary: finalBody
                },
              }
            } : {
              android: { channelId: "default" }
            }),
            attachments: localImageUri ? [{ url: localImageUri }] : [],
            data: { notificationId, localImage: localImageUri },
          },
          trigger: null,
        });
      } catch (err) {
        console.error("Notification Style Error:", err);
      }

      if (soundUrl) setTimeout(() => playNotificationSound(soundUrl), 300);
    });
    const openSub =
      Notifications.addNotificationResponseReceivedListener(async (response) => {
        try {
          const data = response.notification.request.content.data;

          const notificationId = data?.notificationId; // ✅ push_notifications.id here

          if (!notificationId) {
            console.log("⚠️ notificationId missing");
            return;
          }

          // 🔥 UPDATE opened_at IN DB
          await fetch(`${apiUrl}/api/notification/mark-opened`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notificationId }),
          });

          console.log("✅ opened_at updated for:", notificationId);
        } catch (error) {
          console.log("❌ Error marking notification opened:", error);
        }
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
            <WatchlistProvider>
              <AlertProvider>
                <NavigationContainer>
                  <RootNavigator />
                </NavigationContainer>
              </AlertProvider>
            </WatchlistProvider>
          </AuthProvider>

        </AppQueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}