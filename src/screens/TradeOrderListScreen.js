import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  ActivityIndicator,
  Text,
  AppState,
  Alert,
  TouchableOpacity,
  Modal,
  Image,
  StyleSheet,
} from "react-native";
import { useAlert } from "../context/AlertContext";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import axiosInstance from "../api/axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
// import TopHeader from "../components/TopHeader";
import TopMenuSlider from "../components/TopMenuSlider";
import TopWatchlistMenu from "../components/TopWatchlistMenu";
import WatchlistItemCard from "../components/WatchlistItemCard";
// import BottomTabBar from "../components/BottomTabBar";
import { Ionicons } from "@expo/vector-icons";
import { useWatchlistStocks } from "../hooks/useWatchlistStocks";
import { apiUrl } from "../utils/apiUrl";
import { useRealtimePrices } from "../hooks/useRealtimePrices";
import {
  subscribeSymbols,
  unsubscribeDelayed,
} from "../ws/marketSubscriptions";
import { useWatchlistRefresh } from "../context/WatchlistContext";

const mergeWithRealtime = (list, realtimePrices) => {
  return list.map(item => {
    const rt = realtimePrices[item.token] || realtimePrices[item.script_id];

    // ✅ LTP: realtime > item.ltp > 0
    const ltp = rt?.price != null
      ? Number(rt.price)
      : Number(item.ltp || item.value || 0);
    // ✅ Prev Close: realtime > item.prev_close > ltp (no change fallback)
    const prevClose = rt?.prevClose != null
      ? Number(rt.prevClose)
      : Number(item.prev_close || item.prevClose || ltp);

    // ✅ Recalculate every ,time — fresh & consistent
    const change = ltp - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;
    // console.log("ltp",ltp)
    // console.log("prevClose",prevClose)
    // console.log("change",change)
    // console.log("changePercent",changePercent)

    return {
      ...item,
      value: ltp,
      prevClose,          // ✅ expose for debugging/UI
      change,
      changePercent,
      timestamp: rt?.timestamp || item.timestamp || new Date().toISOString(),
    };
  });
};

export default function TradeOrderListScreen() {
  const { showSuccess, showError } = useAlert();
  const navigation = useNavigation();
  const [currentWatchlistId, setCurrentWatchlistId] = useState(null);
  // const [stocks, setStocks] = useState([]); // ✅ raw DB data
  // const [enrichedStocks, setEnrichedStocks] = useState([]);
  // const [loading, setLoading] = useState(false);
  const [removingScriptId, setRemovingScriptId] = useState(null);

  const { prices: realtimePrices } = useRealtimePrices();
  const { refreshTrigger } = useWatchlistRefresh();
  const { stocks: rawStocks, loading, refetch } = useWatchlistStocks(currentWatchlistId);

  const symbolsRef = useRef([]);
  const fetchedPrevCloseRef = useRef(false);

  useEffect(() => {
    const enriched = rawStocks.map(item => {
      const value = Number(item.ltp || item.last_price || item.lastPrice || item.value || 0);
      const prevClose = Number(item.prev_close || item.prevClose || 0);
      const change = prevClose > 0 ? value - prevClose : 0;
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

      return {
        ...item,
        symbol: item.script_symbol || item.symbol || String(item.script_id || item.token), // ✅ Use script_symbol for WebSocket lookup
        name: item.script_name || item.name,
        value,
        prevClose,
        change,
        changePercent,
        timestamp: new Date().toISOString()
      };
    });
    setEnrichedStocks(enriched);
    setOriginalStocks(enriched);
    symbolsRef.current = enriched.map(i => i.symbol).filter(Boolean);
  }, [rawStocks]);

  // Refetch when refreshTrigger changes
  useEffect(() => {
    if (currentWatchlistId && refreshTrigger) {
      refetch();
    }
  }, [refreshTrigger, currentWatchlistId, refetch]);

  // Sort and Filter states
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState("Default");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [enrichedStocks, setEnrichedStocks] = useState([]);
  const [originalStocks, setOriginalStocks] = useState([]);


  // ---------------- WEBSOCKET SUBSCRIPTION ----------------
  useEffect(() => {
    const symbols = symbolsRef.current;
    if (symbols.length === 0) return;

    const page = "WatchlistPage";
    const context = `Watchlist-${currentWatchlistId}`;
    subscribeSymbols(symbols, page, context);

    const appStateSub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        subscribeSymbols(symbols, page, context);
      } else {
        unsubscribeDelayed(symbols, page, context);
      }
    });

    return () => {
      unsubscribeDelayed(symbols, page, context);
      appStateSub.remove();
    };
  }, [enrichedStocks, currentWatchlistId]);

  // ---------------- REMOVE STOCK ----------------
  const removeStockFromWatchlist = useCallback(async (item) => {
    if (!currentWatchlistId) return;
    const { script_id, script_name } = item;
    if (!script_id) {
      showError(
        "Error",
        "Invalid stock."
      );
      return;
    }

    setRemovingScriptId(script_id);

    try {
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        showError(
          "Error",
          "User ID not found. Please log in again."
        );
        setRemovingScriptId(null);
        return;
      }

      const response = await axiosInstance.post(`/wishlistcontrol/remove`, {
        user_id: parseInt(userIdStr, 10),
        wishlist_id: parseInt(currentWatchlistId, 10),
        script_id: script_id,
      });

      if (response.data.success) {
        // Optimistic update on enrichedStocks (not raw stocks)
        setEnrichedStocks(prev => prev.filter(s => s.symbol !== String(script_id)));
        setOriginalStocks(prev =>
          prev.filter(s => s.script_id !== script_id)
        );
        symbolsRef.current = symbolsRef.current.filter(s => s !== String(script_id));
      } else {
        throw new Error(response.data.message || 'Remove failed');
      }
    } catch (err) {
      console.error("❌ Remove stock failed:", err.response?.data || err.message);
      showError(
        "Failed",
        "Could not remove " + script_name
      );
    } finally {
      setRemovingScriptId(null);
    }
  }, [currentWatchlistId]);
  // Sort logic
  const handleSort = (sortType) => {
    setSelectedSort(sortType);
    setSortOpen(false);

    let sorted = [...enrichedStocks];
    if (sortType === "A-Z") {
      sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortType === "Z-A") {
      sorted.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    } else if (sortType === "High-Low") {
      sorted.sort((a, b) => Number(b.value || 0) - Number(a.value || 0));
    } else if (sortType === "Low-High") {
      sorted.sort((a, b) => Number(a.value || 0) - Number(b.value || 0));
    }
    setEnrichedStocks(sorted);
  };

  // Filter logic
  const handleFilter = (filterType) => {
    setSelectedFilter(filterType);
    setFilterOpen(false);

    let filtered = [...originalStocks];
    if (filterType === "Gainers") {
      filtered = filtered.filter(item => item.changePercent > 0);
      filtered.sort((a, b) => b.changePercent - a.changePercent);
    } else if (filterType === "Losers") {
      filtered = filtered.filter(item => item.changePercent < 0);
      filtered.sort((a, b) => a.changePercent - b.changePercent);
    }
    setEnrichedStocks(filtered);
    setSelectedSort("Default");
  };

  const sortOptions = ["A-Z", "Z-A", "High-Low", "Low-High"];
  const filterOptions = ["All", "Gainers", "Losers"];

  const displayStocks = mergeWithRealtime(enrichedStocks, realtimePrices);

  // ---------------- UI ----------------
  return (
    <>
      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: global.colors.background }}>
        <TopMenuSlider />
        <TopWatchlistMenu onWatchlistChange={setCurrentWatchlistId} />
        {/* Sort and Filter Bar */}
        {!loading && originalStocks.length > 0 && (
          <View style={styles.sortFilterBar}>
            <TouchableOpacity style={styles.sortButton} onPress={() => setSortOpen(true)}>
              <Image
                source={require("../../assets/sorticon.png")}
                style={{ width: 18, height: 18, resizeMode: "contain" }}
              />
              <Text style={styles.sortFilterText}>Sort</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterButton} onPress={() => setFilterOpen(true)}>
              <Ionicons name="funnel-outline" size={16} color={global.colors.textPrimary} />
              <Text style={styles.sortFilterText}>Filter</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={global.colors.secondary} />
          </View>
        ) : !displayStocks || displayStocks.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ marginTop: 8, color: "#666" }}>
              No stocks in your watchlist
            </Text>
          </View>
        ) : (
          <WatchlistItemCard
            data={displayStocks}
            realtimePrices={{}}
            prevCloses={{}}
            onPressItem={(item) =>
              navigation.navigate("TradeOrder", {
                symbol: item.symbol,
                name: item.name,
              })
            }
            onRemoveItem={removeStockFromWatchlist}
          />
        )}
        {/* Sort Modal */}
        <Modal visible={sortOpen} transparent animationType="fade">
          <TouchableOpacity style={styles.overlay} onPress={() => setSortOpen(false)}>
            <View style={styles.dropdown}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.dropdownItem}
                  onPress={() => handleSort(option)}
                >
                  <Text style={styles.dropdownText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Filter Modal */}
        <Modal visible={filterOpen} transparent animationType="fade">
          <TouchableOpacity style={styles.overlay} onPress={() => setFilterOpen(false)}>
            <View style={styles.dropdown}>
              {filterOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.dropdownItem}
                  onPress={() => handleFilter(option)}
                >
                  <Text style={styles.dropdownText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
      {/* <BottomTabBar /> */}
    </>
  );
}

const styles = StyleSheet.create({
  sortFilterBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sortFilterText: {
    marginLeft: 6,
    fontSize: 13,
    color: global.colors.textPrimary,
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    backgroundColor: global.colors.overlay,
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  dropdown: {
    backgroundColor: global.colors.background,
    borderRadius: 10,
    marginTop: 200,
    marginRight: 20,
    width: 120,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: global.colors.border,
    elevation: 6,
    shadowColor: global.colors.secondary,
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownText: {
    fontSize: 13,
    color: global.colors.textPrimary,
    fontWeight: "500",
  },
});