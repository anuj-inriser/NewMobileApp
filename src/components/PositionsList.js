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

const filterOptions = ["All", "Equity", "F&O"];
const sortOptions = ["A-Z", "Z-A", "High-Low", "Low-High"];

const PositionsList = () => {
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState([]);
  const [originalPositions, setOriginalPositions] = useState([]);
  const [sortOpen, setSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const { authToken } = useAuth();

  const fetchPositions = async () => {
    try {
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

      console.log("📦 PositionsList API Response:", {
        status: response.status,
        dataCount: data?.data?.length || 0,
        success: data?.success,
        firstItem: data?.data?.[0]
      });

      setPositions(data?.data || []);
      setOriginalPositions(data?.data || []);
    } catch (error) {
      console.log("API Error PositionsList:", error);
    } finally {
      setLoading(false);
    }
  };

  // Websocket Logic
  const getSymbols = () => {
    if (!positions.length) return [];
    return Array.from(
      new Set(
        positions
          .map(
            (o) => o.symboltoken || o.symbol_token || o.tradingsymbol || null,
          )
          .filter(Boolean),
      ),
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchPositions();
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      const page = "PositionsList";
      const context = "LiveUpdates";
      const symbols = getSymbols();

      if (!symbols.length) return;

      console.log(`🟢 SUBSCRIBE → ${page}`, symbols);
      subscribeSymbols(symbols, page, context);

      const appStateSub = AppState.addEventListener("change", (state) => {
        if (state !== "active") {
          unsubscribeDelayed(symbols, page, context);
        } else {
          subscribeSymbols(symbols, page, context);
        }
      });

      return () => {
        unsubscribeDelayed(symbols, page, context);
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
              color="#000"
            />
            <Text style={[styles.actionText, { color: "#000" }]}>Filter</Text>
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

      {loading ? (
        <View style={styles.loaderBox}>
          <Text style={styles.loaderText}>Loading...</Text>
        </View>
      ) : positions.length === 0 ? (
        <View style={{ marginTop: 60, alignItems: "center" }}>
          <Text style={styles.noDataText}>No Data Found</Text>
        </View>
      ) : (
        <ScrollView style={{ marginTop: 10 }} contentContainerStyle={{ paddingBottom: 80 }}>
          {positions.map((item, index) => (
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
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default PositionsList;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
  },
  loaderBox: {
    marginTop: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
  },
  noDataText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
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
    color: "#000",
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
    color: "#000",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  filterDropdown: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginTop: 140,
    marginRight: 20,
    width: 120,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 6,
    shadowColor: "#210F47",
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
    color: "#000",
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
});
