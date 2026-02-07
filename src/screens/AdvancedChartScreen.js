import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  // Text,
  TouchableOpacity,
  // Animated,
  // Dimensions,
  // TouchableWithoutFeedback,
  SafeAreaView,
  Dimensions
} from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { WebView } from "react-native-webview";
import { useRoute, useNavigation } from "@react-navigation/native";
import { ArrowLeft } from "lucide-react-native";
// import { apiUrl, wsUrl } from "../utils/apiUrl";

// const SCREEN_HEIGHT = Dimensions.get("window").height;
// const COLLAPSED_HEIGHT = 40;
// const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.75; // Increased height for form

import TradeOrderTabs from "../components/Trade/TradeOrderTabs";
import OrdersList from "../components/OrdersList";
import PositionsList from "../components/PositionsList";
import PortfolioScreen from "./PortfolioScreen";
import PlaceOrderView from "../components/Trade/PlaceOrderView";
import TradeOrderScreen from "./TradeOrderScreen";

// Main App Layout Components
import FundamentalTopHeader from "../components/FundamentalTopHeader";
import BottomTabBar from "../components/BottomTabBar";

const AdvancedChartScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { symbol } = route.params || { symbol: "NASDAQ:AAPL" };

 

  // Tabs State
  const [activeTab, setActiveTab] = useState(1);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // No navigation, just switch view
  };

  // Mock State for BottomTabBar to highlight "Trade" (Index 4 in standard array)
  // Standard Tabs: Home, News, Explore, Ideas, Trade
  const mockTabBarState = {
    index: 4, 
    routes: [
      { name: "Equity", key: "Equity" },
      { name: "NewsScreen", key: "NewsScreen" },
      { name: "StockTimelineScreen", key: "StockTimelineScreen" },
      { name: "Trade", key: "Trade" },
      { name: "AdvancedChart", key: "AdvancedChart" }, 
      { name: "TradeOrder", key: "TradeOrder" },
    ],
  }


  return (
 <View style={styles.container}>
      {/* 🟢 HEADER LOGIC */}
      {activeTab === 1 || activeTab === 5 ? (
        // Custom Header for Place Order & TradeOrder (Full Screen Mode)
        <SafeAreaView style={styles.customHeaderSafeArea}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                marginRight: 10,
                backgroundColor: global.colors.secondary,
                padding: 8,
                borderRadius: 20,
              }}
            >
              <ArrowLeft size={20} color={global.colors.background} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <TradeOrderTabs activeTab={activeTab} onTabChange={handleTabChange} />
            </View>
          </View>
        </SafeAreaView>
      ) : (
        // Main App Header for Orders/Positions/Holdings
        <>
          <FundamentalTopHeader />
          <View style={styles.secondaryTabsContainer}>
             <TradeOrderTabs activeTab={activeTab} onTabChange={handleTabChange} />
          </View>
        </>
      )}


      {/* 🟢 CONTENT LOGIC */}
      <View style={styles.contentContainer}>
        
        {/* Tab 1: Place Order (Chart + Form) - KEPT ALIVE using display: none */}
        <View style={{ flex: 1, display: activeTab === 1 ? 'flex' : 'none' }}>
           <PlaceOrderView symbol={symbol} />
        </View>

        {/* Tab 2: Orders */}
        {activeTab === 2 && (
          <View style={{ flex: 1 }}>
            <OrdersList />
          </View>
        )}

        {/* Tab 3: Positions */}
        {activeTab === 3 && (
          <View style={{ flex: 1 }}>
            <PositionsList />
          </View>
        )}

        {/* Tab 4: Holdings */}
        {activeTab === 4 && (
          <View style={{ flex: 1 }}>
            <PortfolioScreen />
          </View>
        )}
        
        {/* Tab 5: TradeOrder Screen */}
        {activeTab === 5 && (
          <View style={{ flex: 1 }}>
            <TradeOrderScreen navigation={navigation} hideHeader={true} />
          </View>
        )}
      </View>


      {/* 🟢 FOOTER LOGIC */}
      {/* Show Bottom Bar only for Non-Chart/Non-TradeOrder Tabs */}
      {activeTab !== 1 && activeTab !== 5 && (
        <BottomTabBar 
          state={mockTabBarState} 
          navigation={navigation} 
          descriptors={{}} 
        />
      )}

    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: global.colors.background,
  },
  customHeaderSafeArea: {
    backgroundColor: global.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingLeft: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: global.colors.border,
    backgroundColor: global.colors.background,
    zIndex: 10,
  },
  secondaryTabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: global.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: global.colors.border,
  },
  contentContainer: {
    flex: 1,
    position: "relative",
    // Start after header, end before footer is handled by flex
  },
});

export default AdvancedChartScreen;
