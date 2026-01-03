import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import EquityScreen from "../screens/EquityScreen";
import TradeOrderListScreen from "../screens/TradeOrderListScreen";
import Learning from "../screens/Learning";
import NewsScreen from "../screens/NewsScreen";
import OrdersScreen from "../screens/OrdersScreen";
import TradeScreen from "../screens/TradeScreen";

const Tab = createBottomTabNavigator();

export default function HomeTabs() {
    return (
        <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen name="Equity" component={EquityScreen} />
            <Tab.Screen name="Watchlist" component={TradeOrderListScreen} />
            <Tab.Screen name="Learning" component={Learning} />
            <Tab.Screen name="NewsScreen" component={NewsScreen} />
            <Tab.Screen name="OrdersScreen" component={OrdersScreen} />
            <Tab.Screen name="TradeScreen" component={TradeScreen} />
        </Tab.Navigator>
    );
}
