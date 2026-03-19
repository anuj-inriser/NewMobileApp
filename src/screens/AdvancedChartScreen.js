import React, { useState, useEffect } from "react";
import { StyleSheet, View, SafeAreaView } from "react-native";
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
import TradeOrderScreen from "./TradeOrderScreen";
import AccountScreen from "./AccountScreen";

// Main App Layout Components
import FundamentalTopHeader from "../components/FundamentalTopHeader";
import BottomTabBar from "../components/BottomTabBar";

const AdvancedChartScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { symbol } = route.params || { symbol: "NSE:RELIANCE-EQ" };

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
            { name: "Stock Info", key: "StockInfo" },
            { name: "AdvancedChart", key: "AdvancedChart" },
            { name: "TradeOrder", key: "TradeOrder" },
        ],
  }


    return (
        <View style={styles.container}>
            {/* 🟢 HEADER LOGIC */}
            <SafeAreaView style={styles.customHeaderSafeArea}>
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <TradeOrderTabs activeTab={activeTab} onTabChange={handleTabChange} />
                    </View>
                </View>
            </SafeAreaView>

            {/* 🟢 CONTENT LOGIC */}
            <View style={styles.contentContainer}>
                {/* Tab 1: Holdings */}
                {activeTab === 1 && (
                    <View style={{ flex: 1 }}>
                        <PortfolioScreen />
                    </View>
                )}

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

                {/* Tab 4: Account */}
                {activeTab === 4 && (
                    <View style={{ flex: 1 }}>
                        <AccountScreen />
                    </View>
                )}
            </View>

            {/* 🟢 FOOTER LOGIC */}
            <BottomTabBar
                state={mockTabBarState}
                navigation={navigation}
                descriptors={{}}
                forceShow={true}
            />
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
    },
});

export default AdvancedChartScreen;
