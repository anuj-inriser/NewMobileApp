import 'react-native-gesture-handler';
import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from './src/context/AuthContext';

// 🔹 Import Screens
import WelcomeScreen from "./src/screens/WelcomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import PasswordScreen from "./src/screens/PasswordScreen";
import DematScreen from "./src/screens/DematScreen";
import HomeScreen from "./src/screens/HomeScreen";
import TradeOrderListScreen from "./src/screens/TradeOrderListScreen";
import TradeOrderScreen from "./src/screens/TradeOrderScreen";
import Learning from "./src/screens/Learning";
import LearningDetail from "./src/screens/LearningDetail";
import ChapterScreen from "./src/screens/ChapterScreen";
import ChapterDetails from "./src/screens/ChapterDetails";
import NewsScreen from "./src/screens/NewsScreen";
import NewsReadingScreen from "./src/screens/NewsReadingScreen"
import OrdersScreen from "./src/screens/OrdersScreen";
import TradeScreen from './src/screens/TradeScreen';
import PortfolioScreen from './src/screens/PortfolioScreen';
import StockTimelineScreen from './src/screens/StockTimelineScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import StocksScreen from './src/screens/StocksScreen';
import IndicesDetailScreen from './src/screens/IndicesDetailScreen';
import IndicesListScreen from './src/screens/IndicesListScreen';
import { AppQueryProvider } from './src/context/QueryClientProvider';

const Stack = createNativeStackNavigator();

// ... imports

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppQueryProvider>
          <AuthProvider>
            <NavigationContainer>
              {/* ... existing stack ... */}
              <Stack.Navigator
                initialRouteName="Welcome"
                screenOptions={{
                  animation: "slide_from_right",
                }}
              >
                {/* 🔐 Auth Screens */}
                <Stack.Screen
                  name="Welcome"
                  component={WelcomeScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Login"
                  component={LoginScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Signup"
                  component={SignupScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Password"
                  component={PasswordScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Demat"
                  component={DematScreen}
                  options={{ headerShown: false }}
                />

                {/* 🏠 Main Screens */}
                <Stack.Screen
                  name="Home"
                  component={HomeScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="TradeOrderList"
                  component={TradeOrderListScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="TradeOrder"
                  component={TradeOrderScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Learning"
                  component={Learning}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="LearningDetail"
                  component={LearningDetail}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="ChapterScreen"
                  component={ChapterScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="ChapterDetails"
                  component={ChapterDetails}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="NewsScreen"
                  component={NewsScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="NewsReadingScreen"
                  component={NewsReadingScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="OrdersScreen"
                  component={OrdersScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="TradeScreen"
                  component={TradeScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="PortfolioScreen"
                  component={PortfolioScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="StockTimelineScreen"
                  component={StockTimelineScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="ProfileScreen"
                  component={ProfileScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Stocks"
                  component={StocksScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="IndicesDetail"
                  component={IndicesDetailScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="IndicesList"
                  component={IndicesListScreen}
                  options={{ headerShown: false }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </AuthProvider>
        </AppQueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
