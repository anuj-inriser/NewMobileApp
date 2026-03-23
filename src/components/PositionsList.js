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
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PositionCard from "./PositionCard";
import { apiUrl } from "../utils/apiUrl";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDeviceId } from "../utils/deviceId";
import { useFocusEffect } from "@react-navigation/native";
import {
  subscribeSymbols,
  unsubscribeDelayed,
} from "../ws/marketSubscriptions";
import * as Device from "expo-device";
import axiosInstance from "../api/axios";

const filterOptions = ["All", "Equity", "F&O"];
const sortOptions = ["A-Z", "Z-A", "High-Low", "Low-High"];

const PositionsList = () => {
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState([]);
  const [originalPositions, setOriginalPositions] = useState([]);
  const [sortOpen, setSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  const { authToken } = useAuth();

  
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
        event_type: "Positions",
        content: "Refreshed",
        app_version: "1.0.0"
      });
    } catch (error) {
      console.log("Logging failed", error);
    }
  };

  const onRefresh = async () => {
    if (!authToken) return;
    setRefreshing(true);
    try {
      await fetchPositions()
    } catch (error) {
      console.log("Refresh error:", error);
    } finally {
      setRefreshing(false);
      logRefresh();
    }
  };

  const fetchPositions = async () => {
    try {
       if (!authToken) return;
      setLoading(true);
      const userId = await AsyncStorage.getItem("userId");
      const deviceId = await getDeviceId();
     
      const response = await fetch(`${apiUrl}/api/position/get`, {
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

      setPositions(data?.data || []);
      setOriginalPositions(data?.data || []);
    } catch (error) {
      console.log("API Error PositionsList:", error);
    } finally {
      setLoading(false);
    }
  };

  // Websocket Logic
  // const getSymbols = () => {
  //   if (!positions.length) return [];
  //   return Array.from(
  //     new Set(
  //       positions
  //         .map(
  //           (o) => o.symboltoken || o.symbol_token || o.tradingsymbol || null,
  //         )
  //         .filter(Boolean),
  //     ),
  //   );
  // };

  const getTokens = () => {
    if (!positions.length) return [];

    return Array.from(
      new Set(
        positions
          .map((o) => o.symboltoken || o.symbol_token || null)
          .filter(Boolean),
      ),
    );
  };

  useFocusEffect(
    useCallback(() => {
      if (authToken) {
      fetchPositions();
      }
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      const page = "PositionsList";
      const context = "LiveUpdates";
      const tokens = getTokens();
      if (!tokens.length) return;

      subscribeSymbols(tokens, page, context);

      const appStateSub = AppState.addEventListener("change", (state) => {
        if (state !== "active") {
          unsubscribeDelayed(tokens, page, context);
        } else {
          subscribeSymbols(tokens, page, context);
        }
      });

      return () => {
        unsubscribeDelayed(tokens, page, context);
        appStateSub?.remove();
      };
    }, [positions]),
  );

  const sortPositions = (sortType) => {
    let sorted = [...positions];

    const calcValue = (item) => {
      const buyValue = Number(item.buyqty || 0) * Number(item.buyavgprice || 0);
      const sellValue =
        Number(item.sellqty || 0) * Number(item.sellavgprice || 0);
      return buyValue - sellValue;
    };

    if (sortType === "A-Z") {
      sorted.sort((a, b) =>
        (a.tradingsymbol || "").localeCompare(b.tradingsymbol || ""),
      );
    } else if (sortType === "Z-A") {
      sorted.sort((a, b) =>
        (b.tradingsymbol || "").localeCompare(a.tradingsymbol || ""),
      );
    } else if (sortType === "High-Low") {
      sorted.sort((a, b) => calcValue(b) - calcValue(a));
    } else if (sortType === "Low-High") {
      sorted.sort((a, b) => calcValue(a) - calcValue(b));
    }

    setPositions(sorted);
  };

  const applyFilter = (option) => {
    setSelectedFilter(option);
    if (option === "All") {
      setPositions(originalPositions);
      return;
    }

    const filtered = originalPositions.filter((item) => {
      if (option === "Equity") return item.segment === "EQUITY";
      if (option === "F&O") return item.segment === "FNO";
      return true;
    });

    setPositions(filtered);
  };

  return (
    <View style={styles.container}>
      {/* Sort + Filter Bar */}
      <View style={styles.orderTopBar}>
        <Text style={styles.orderTitle}>Positions</Text>

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
                  sortPositions(option);
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

      <ScrollView style={{ marginTop: 10 }} contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }>
        {loading ? (
          <View style={styles.loaderBox}>
            <Text style={styles.loaderText}>Loading...</Text>
          </View>
        ) : positions.length === 0 ? (
          <View style={{ justifyContent: "center", alignItems: "center", flex: 1 }}>
            <Text style={styles.noDataText}>No Position Found</Text>
          </View>
        ) : (

          positions.map((item, index) => (
            <PositionCard
              key={`${item.tradingsymbol}_${index}`}
              tradingsymbol={item.tradingsymbol}
              exchange={item.exchange}
              producttype={item.producttype}
              buyqty={item.buyqty}
              sellqty={item.sellqty}
              netqty={item.netqty}
              buyavgprice={item.buyavgprice}
              sellavgprice={item.sellavgprice}
              ltp={item.ltp}
              pnl={item.pnl}
              unrealised={item.unrealised}
              realised={item.realised}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default PositionsList;

const styles = StyleSheet.create({
  container: {
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