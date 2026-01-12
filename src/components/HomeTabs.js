import { View, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import EquityScreen from "../screens/EquityScreen";
import TradeOrderListScreen from "../screens/TradeOrderListScreen";
import Learning from "../screens/Learning";
import NewsScreen from "../screens/NewsScreen";
import OrdersScreen from "../screens/OrdersScreen";
import TradeScreen from "../screens/TradeScreen";
import FundamentalTopHeader from "./FundamentalTopHeader";

import StockTimelineScreen from "../screens/StockTimelineScreen";

const Tab = createBottomTabNavigator();

export default function HomeTabs() {
    return (
        <Tab.Navigator screenOptions={{
            headerShown: false,
            tabBarStyle: { display: "none" }
        }}>
            <Tab.Screen name="Equity" component={EquityScreen} />
            <Tab.Screen name="Portfolio" component={TradeOrderListScreen} />
            <Tab.Screen name="StockTimelineScreen" component={StockTimelineScreen} />
            <Tab.Screen name="Learning" component={Learning} />
            <Tab.Screen name="NewsScreen" component={NewsScreen} />
            <Tab.Screen name="OrdersScreen" component={OrdersScreen} />
            <Tab.Screen name="Trade" component={TradeScreen} />
        </Tab.Navigator>
    );
}
