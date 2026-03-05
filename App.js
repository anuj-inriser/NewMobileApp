import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import "./src/theme/colors";
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
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import BottomTabBar from "./src/components/BottomTabBar";

import { playNotificationSound } from "./src/utils/soundPlayer";
import { AuthProvider } from "./src/context/AuthContext";
import { WatchlistProvider } from "./src/context/WatchlistContext";
import { AppQueryProvider } from "./src/context/QueryClientProvider";
import { DrawerProvider } from "./src/context/DrawerContext";
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
import TradeOrderNativeScreen from "./src/screens/TradeOrderNativeScreen";

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();

const Stack = createNativeStackNavigator();

function EquityStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EquityHome" component={EquityScreen} />
      <Stack.Screen name="Stocks" component={StocksScreen} />
      {/* <Stack.Screen name="AdvancedChart" component={AdvancedChartScreen} /> */}
    </Stack.Navigator>
  );
}

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

const Tab = createBottomTabNavigator();

// 🔹 Main Tab Navigator
function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        // Standard tab configs
        lazy: true, // Keep tabs mounted
        unmountOnBlur: false, // Don't unmount on blur
      }}
    >
      <Tab.Screen
        name="Equity"
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Equity', { screen: 'EquityHome' }); // reset stack
          },
        })}
      >
        {() => (
          <PermissionGuard permission="VIEW_EQUITY">
            <EquityStack />
          </PermissionGuard>
        )}
      </Tab.Screen>
      <Tab.Screen name="TradeOrderList">
        {() => (
          <PermissionGuard permission="VIEW_WATCHLIST">
            <TradeOrderListScreen />
          </PermissionGuard>
        )}
      </Tab.Screen>
      <Tab.Screen name="NewsScreen">
        {() => (
          <PermissionGuard permission="VIEW_NEWS">
            <NewsScreen />
          </PermissionGuard>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="StockTimelineScreen"
        component={StockTimelineScreen}
      />
      <Tab.Screen name="Trade" component={TradeScreen} />
      {/* <Tab.Screen name="OrdersScreen" component={OrdersScreen} /> */}
      <Tab.Screen name="Profile" component={Profile} />
      <Tab.Screen name="Portfolio">
        {() => (
          <PermissionGuard permission="VIEW_PORTFOLIO">
            <PortfolioScreen />
          </PermissionGuard>
        )}
      </Tab.Screen>
      {/* AdvancedChart moved to RootStack for full-screen without header/footer */}
      <Tab.Screen name="AdvancedChart" component={AdvancedChartScreen} />
      <Tab.Screen name="NotificationScreen" component={NotificationScreen} />
      <Tab.Screen name="Learning">
        {() => (
          <PermissionGuard permission="VIEW_LEARNING">
            <Learning />
          </PermissionGuard>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
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
          <RootStack.Screen 
            name="TradeOrderNative" 
            component={TradeOrderNativeScreen} 
            options={{ 
              animation: "slide_from_bottom",
              gestureEnabled: true,
            }}
          />
        </>
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <MainLayout>
      <AppStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >

        {/* 🔹 Main Tabs as the Root Screen */}
        <AppStack.Screen name="MainTabs" component={MainTabNavigator} />

        {/* 🔹 Stack Screens (Detail Views) */}
        <AppStack.Screen name="NewsReadingScreen" component={NewsReadingScreen} />


        <AppStack.Screen name="IndicesList" component={IndicesListScreen} />
        <AppStack.Screen name="IndicesDetail" component={IndicesDetailScreen} />
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
            <DrawerProvider>
              <WatchlistProvider>
                <AlertProvider>
                  <NavigationContainer>
                    <RootNavigator />
                  </NavigationContainer>
                </AlertProvider>
              </WatchlistProvider>
            </DrawerProvider>
          </AuthProvider>
        </AppQueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}