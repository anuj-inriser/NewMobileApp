import React, { useEffect, useState, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
  Modal,
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import TradeExecutedCard from "../components/TradeExecutedCard";
import { apiUrl } from "../utils/apiUrl";
import { useAuth } from "../context/AuthContext";
import TradeOrderTabs from "../components/Trade/TradeOrderTabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDeviceId } from "../utils/deviceId";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import {
  subscribeSymbols,
  unsubscribeDelayed,
} from "../ws/marketSubscriptions";
import OrdersList from "../components/OrdersList";
import PositionsList from "../components/PositionsList";
// import BottomTabBar from "../components/BottomTabBar";

const filterOptions = ["All", "Equity", "F&O"];
const sortOptions = ["A-Z", "Z-A", "High-Low", "Low-High"];

const OrdersScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();

  // State for Tab 1 (Trades)
  const [loading, setLoading] = useState(false);
  const [tradeOrders, setTradeOrders] = useState([]);
  const [originalTradeOrders, setOriginalTradeOrders] = useState([]);
  const [selectedTab, setSelectedTab] = useState(1);
  const [sortOpen, setSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");

  const { authToken } = useAuth();

  useEffect(() => {
    if (route.params?.defaultTab) {
      setSelectedTab(route.params.defaultTab);
    } else {
      setSelectedTab(1);
    }
  }, [route.params]);

  // Fetch Logic Only for Tab 1 (Trades)
  const fetchTrades = async () => {
    if (selectedTab !== 1) return;

    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem("userId");
      const deviceId = await getDeviceId();

      const response = await fetch(`${apiUrl}/api/trade/get`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
          userid: userId,
          device_mac: deviceId,
        },
      });

      const text = await response.text();
      const data = JSON.parse(text);

      setTradeOrders(data?.data || []);
      setOriginalTradeOrders(data?.data || []);
    } catch (error) {
      console.log("API Error Trades:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTab === 1) {
      fetchTrades();
    }
  }, [selectedTab]);

  // Websocket Logic (Only for Tab 1 if needed? Existing code subscribed.
  // Trades usually don't need live updates unless they rely on LTP?
  // Looking at TradeExecutedCard, it has no live data. The original code subscribed
  // for all tabs... lets check if Trades need it.
  // TradeExecutedCard uses: fillprice, fillsize, tradevalue. No LTP.
  // So Tab 1 likely doesn't need socket. I'll remove it for Tab 1 to clean up.)

  const sortTrades = (sortType) => {
    let sorted = [...tradeOrders];
    if (sortType === "A-Z") {
      sorted.sort((a, b) =>
        (a.tradingsymbol || "").localeCompare(b.tradingsymbol || ""),
      );
    } else if (sortType === "Z-A") {
      sorted.sort((a, b) =>
        (b.tradingsymbol || "").localeCompare(a.tradingsymbol || ""),
      );
    } else if (sortType === "High-Low") {
      sorted.sort(
        (a, b) => Number(b.tradevalue || 0) - Number(a.tradevalue || 0),
      );
    } else if (sortType === "Low-High") {
      sorted.sort(
        (a, b) => Number(a.tradevalue || 0) - Number(b.tradevalue || 0),
      );
    }
    setTradeOrders(sorted);
  };

  const applyFilter = (option) => {
    setSelectedFilter(option);
    if (option === "All") {
      setTradeOrders(originalTradeOrders);
      return;
    }
    const filtered = originalTradeOrders.filter((item) => {
      if (option === "Equity") return item.segment === "EQUITY";
      if (option === "F&O") return item.segment === "FNO";
      return true;
    });
    setTradeOrders(filtered);
  };

  // Render Content based on Tab
  const renderContent = () => {
    if (selectedTab === 2) {
      return <OrdersList />;
    }
    if (selectedTab === 3) {
      return <PositionsList />;
    }

    // Tab 1: Trade Order (History)
    return (
      <View style={{ flex: 1 }}>
        {/* Sort + Filter Bar for Trades */}
        <View style={styles.orderTopBar}>
          <Text style={styles.orderTitle}>Trade Order</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.iconRow}
              onPress={() => setSortOpen(true)}
            >
              <Image
                source={require("../../assets/sorticon.png")}
                style={{ width: 20, height: 20, resizeMode: "contain" }}
              />
              <Text style={styles.actionText}>Sort</Text>
            </TouchableOpacity>
            {/* Trades Filter not usually shown in original code? 
                    Original only showed Filter for Tab 2 (Orders). 
                    But filterMap had Tab 1 entries. Let's keep it visible if wanted, 
                    or follow original: "selectedTab === 2 && (...)" -> only for Orders.
                    Actually original code had logic for Tab 1 in applyFilter.
                    But UI only rendered filter button if selectedTab === 2.
                    I will stick to original UI behavior: No Filter btn for Tab 1.
                 */}
          </View>
        </View>

        {loading ? (
          <View style={styles.loaderBox}>
            <Text style={styles.loaderText}>Loading...</Text>
          </View>
        ) : tradeOrders.length === 0 ? (
          <View style={{ marginTop: 60, alignItems: "center" }}>
            <Text style={styles.noDataText}>No Data Found</Text>
          </View>
        ) : (
          <ScrollView style={{ marginTop: 10 }}>
            {tradeOrders.map((item, index) => (
              <TradeExecutedCard
                key={`${item.orderid || item.fillid || item.symboltoken}_${index}`}
                exchange={item.exchange}
                producttype={item.producttype}
                tradingsymbol={item.tradingsymbol}
                transactiontype={item.transactiontype}
                tradevalue={item.tradevalue}
                fillprice={item.fillprice}
                fillsize={item.fillsize}
                orderid={item.orderid}
                fillid={item.fillid}
                filltime={item.filltime}
              />
            ))}
          </ScrollView>
        )}

        {/* Sort Modal */}
        <Modal visible={sortOpen} transparent animationType="fade">
          <TouchableOpacity
            style={styles.overlay}
            onPress={() => setSortOpen(false)}
          >
            <View style={styles.filterDropdown}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSortOpen(false);
                    sortTrades(option);
                  }}
                >
                  <Text style={styles.dropdownText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  };


  return (
    <>
      <SafeAreaView edges={["bottom"]} style={[styles.container]}>
        {/* Tabs */}
        <View style={styles.topSliders}>
          <TradeOrderTabs
            activeTab={selectedTab}
            onTabChange={(tab) => setSelectedTab(tab)}
          />
        </View>

        {renderContent()}
      </SafeAreaView>
      {/* Show BottomTabBar only when NOT on Place Order tab */}
      {/* {selectedTab !== 1 && <BottomTabBar />} */}
    </>
  );
};

export default OrdersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: global.colors.background,
    paddingBottom: 70,
  },
  topSliders: {
    backgroundColor: global.colors.background,
    elevation: 10,
    shadowColor: global.colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    marginTop: -3,
    paddingTop: 10,
    paddingBottom: 10,
    marginBottom: 10,
  },
  loaderBox: {
    marginTop: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: global.colors.textSecondary,
  },
  noDataText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
    color: global.colors.textSecondary,
  },
  orderTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 5,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: global.colors.textPrimary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 18,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 13,
    color: global.colors.textPrimary,
  },
  overlay: {
    flex: 1,
    backgroundColor: global.colors.overlay,
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  filterDropdown: {
    backgroundColor: global.colors.background,
    borderRadius: 10,
    marginTop: 140,
    marginRight: 20,
    width: 120,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: global.colors.border,
    elevation: 6,
    shadowColor: global.colors.secondary,
    shadowOpacity: 0.15,
    shadowRadius: 5,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  dropdownText: {
    fontSize: 14,
    color: global.colors.textPrimary,
    borderBottomWidth: 0.5,
    borderBottomColor: global.colors.border,
  },
});
