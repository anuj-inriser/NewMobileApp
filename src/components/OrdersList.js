import React, { useEffect, useState, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  AppState,
  RefreshControl,
} from "react-native";
import { useAlert } from "../context/AlertContext";
import { Ionicons } from "@expo/vector-icons";
import { useDrawer } from "../context/DrawerContext";
import OrderItemCard from "./OrderItemCard";
import { apiUrl } from "../utils/apiUrl";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDeviceId } from "../utils/deviceId";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as Device from "expo-device";
import axiosInstance from "../api/axios";

const filterOptions = ["All", "Executed", "Cancelled", "Rejected", "Pending"];
const sortOptions = ["A-Z", "Z-A", "High-Low", "Low-High"];

const OrdersList = () => {
  const { showSuccess, showError } = useAlert();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [originalOrders, setOriginalOrders] = useState([]);
  const [sortOpen, setSortOpen] = useState(false);
  const { openStockInfoDrawer } = useDrawer();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const { authToken } = useAuth();

  const normalizeStatus = (status = "") =>
    status.toString().trim().toLowerCase();

  const logRefresh = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const deviceId =
        Device.osBuildId || Device.modelId || Device.deviceName || "Unknown";

      await axiosInstance.post("/eventlog", {
        user_id: userId || "",
        success: true,
        device_id: deviceId,
        event_group_id: 3,
        event_type: "Orders",
        content: "Refreshed",
        app_version: "1.0.0"
      });
    } catch (error) {
      console.log("Logging failed", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchOrders()
    } catch (error) {
      console.log("Refresh error:", error);
    } finally {
      setRefreshing(false);
      logRefresh();
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem("userId");
      const deviceId = await getDeviceId();

      const response = await fetch(`${apiUrl}/api/order/get`, {
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

      setOrders(data?.data || []);
      setOriginalOrders(data?.data || []);
    } catch (error) {
      console.log("API Error OrdersList:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, []),
  );

  const sortOrders = (sortType) => {
    let sorted = [...orders];

    if (sortType === "A-Z") {
      sorted.sort((a, b) =>
        (a.trading_symbol || "").localeCompare(b.trading_symbol || ""),
      );
    } else if (sortType === "Z-A") {
      sorted.sort((a, b) =>
        (b.trading_symbol || "").localeCompare(a.trading_symbol || ""),
      );
    } else if (sortType === "High-Low") {
      sorted.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortType === "Low-High") {
      sorted.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }

    setOrders(sorted);
  };

  const applyFilter = (option) => {
    setSelectedFilter(option);
    if (option === "All") {
      setOrders(originalOrders);
      return;
    }

    const filtered = originalOrders.filter((item) => {
      const st = normalizeStatus(item.status);
      if (option === "Executed") return st === "completed" || st === "complete";

      if (option === "Cancelled")
        return st === "cancelled" || st === "canceled";

      if (option === "Rejected") return st === "rejected";

      if (option === "Pending")
        return (
          st === "pending" ||
          st === "open" ||
          st === "trigger pending" ||
          st === "triggerpending" ||
          st === "openpending"
        );
      return true;
    });

    setOrders(filtered);
  };

  const cancelOrderApi = async (item) => {
    const userId = await AsyncStorage.getItem("userId");
    const deviceId = await getDeviceId();

    const payload = {
      variety: item.variety,
      orderid: item.orderid,
      symboltoken: item.symbol_token,
      tradingsymbol: item.trading_symbol,
      transactiontype: item.transaction_type,
      exchange: item.exchange,
      ordertype: item.order_type,
      producttype: item.product_type,
      duration: item.duration,
      price: item.price,
      squareoff: item.square_off ?? 0,
      stoploss: item.stop_loss ?? 0,
      quantity: item.quantity,
      script: item.script,
    };

    const response = await fetch(`${apiUrl}/api/order/cancel/${item.orderid}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        userid: userId,
        device_mac: deviceId,
      },
      body: JSON.stringify(payload),
    });

    await fetchOrders();
    return await response.json();
  };

  return (
    <View style={styles.container}>
      {/* Sort + Filter Bar */}
      <View style={styles.orderTopBar}>
        <Text style={styles.orderTitle}>Orders</Text>

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

          <TouchableOpacity
            style={styles.iconRow}
            onPress={() => setIsFilterOpen(true)}
          >
            <Ionicons
              name={selectedFilter !== "All" ? "funnel" : "funnel-outline"}
              size={16}
              color={global.colors.textPrimary}
            />
            <Text style={[styles.actionText, { color: global.colors.textPrimary }]}>Filter</Text>
          </TouchableOpacity>
        </View>
      </View>

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
                  sortOrders(option);
                }}
              >
                <Text style={styles.dropdownText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={isFilterOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsFilterOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsFilterOpen(false)}
        >
          <View style={styles.filterDropdown}>
            {filterOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.dropdownItem}
                onPress={() => {
                  setIsFilterOpen(false);
                  applyFilter(option);
                }}
              >
                <Text style={styles.dropdownText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        scrollEnabled={orders.length > 0}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {loading ? (
          <View style={styles.loaderBox}>
            <Text style={styles.loaderText}>Loading...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={{ justifyContent: "center", alignItems: "center", flex: 1 }}>
            <Text style={styles.noDataText}>No Orders Found</Text>
          </View>
        ) : (

          orders.map((item, index) => (
            <OrderItemCard
              key={`${item.orderid}_${index}`}
              name={item.trading_symbol}
              type={item.transaction_type?.toUpperCase()}
              shares={`${item.unfilledshares}/${Number(item.filledshares) + Number(item.unfilledshares)}`}
              status={item.status}
              price={`₹ ${Number(item.price).toFixed(2)}`}
              broker={item.broker}
              // onModify={() => {
              //   navigation.navigate("TradeOrder", {
              //     symbol: item.trading_symbol,
              //     token: item.symbol_token,
              //     name: item.script,
              //     price: item.price,
              //     quantity: item.quantity,
              //     stoploss: item.stop_loss,
              //     target: 0,
              //     producttype: item.product_type,
              //     internaltype: "Modify",
              //     orderid: item.orderid,
              //   });
              // }}
              onModify={() => {
                openStockInfoDrawer(
                  item.symbol_token,
                  item.trading_symbol,
                  "placeorder", // tab
                  item.isin,
                  {
                    name: item.script,
                    price: item.price,
                    quantity: item.quantity,
                    stoploss: item.stop_loss,
                    producttype: item.product_type,
                    orderid: item.orderid,
                    transactiontype: item.transaction_type,
                    internaltype: "Modify",
                    exchange: item.exchange,
                    tradeable: item.tradeable,
                  }
                );
              }}
              onCancel={async () => {
                Alert.alert(
                  "Cancel Order",
                  "Are you sure you want to cancel this order?",
                  [
                    { text: "No", style: "cancel" },
                    {
                      text: "Yes",
                      onPress: async () => {
                        const res = await cancelOrderApi(item);
                        if (res.success) {
                          showSuccess(
                            "Success",
                            "Order cancelled successfully."
                          );
                        } else {
                          showError(
                            "Error",
                            res?.message || "Failed to cancel order."
                          );
                        }
                      },
                    },
                  ],
                );
              }}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default OrdersList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: global.colors.background,
  },
  loaderBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: global.colors.textSecondary,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 25,
    paddingHorizontal: 12,
    marginTop: 5
  },
  noDataText: {

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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 18,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 13,
    color: "#000",
    fontWeight: "600",
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
    marginTop: 185,
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
