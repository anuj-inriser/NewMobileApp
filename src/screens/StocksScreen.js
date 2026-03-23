import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  AppState,
  TouchableOpacity,
  Modal,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
// import BottomTabBar from '../components/BottomTabBar';
// import TopHeader from '../components/TopHeader';
import TopMenuSlider from "../components/TopMenuSlider";
import MarketTabs from "../components/MarketTabs";
import StockListCard from "../components/StockListCard";
import { apiUrl } from "../utils/apiUrl";
import { useRealtimePrices } from "../hooks/useRealtimePrices";
import {
  subscribeSymbols,
  unsubscribeDelayed,
} from "../ws/marketSubscriptions";
import axiosInstance from "../api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useDrawer } from "../context/DrawerContext";
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import SparklineChart from "../components/Sparkline";

// const Sparkline = ({ color, isPositive }) => {
//   const curveD = isPositive
//     ? "M 0 35 C 20 35, 30 25, 45 25 S 60 5, 80 0 L 80 40 L 0 40 Z"
//     : "M 0 5 C 20 5, 30 15, 45 15 S 60 35, 80 40 L 80 40 L 0 40 Z";

//   const lineD = isPositive
//     ? "M 0 35 C 20 35, 30 25, 45 25 S 60 5, 80 0"
//     : "M 0 5 C 20 5, 30 15, 45 15 S 60 35, 80 40";

//   return (
//     <Svg width="80" height="40" viewBox="0 0 80 40">
//       <Defs>
//         <SvgLinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
//           <Stop offset="0" stopColor={color} stopOpacity="0.3" />
//           <Stop offset="1" stopColor={color} stopOpacity="0.0" />
//         </SvgLinearGradient>
//       </Defs>
//       <Path d={curveD} fill="url(#grad)" />
//       <Path d={lineD} fill="none" stroke={color} strokeWidth="2" />
//     </Svg>
//   );
// };

const AdvancedHeaderCard = ({ item, realtime, counts }) => {
  const isPositive = (realtime?.price || item?.value) >= (realtime?.prevClose || item?.prevClose);
  const color = isPositive ? global.colors.success : global.colors.error;

  const price = realtime?.price || item?.value || 0;
  const prevClose = realtime?.prevClose || item?.prevClose || price;
  const change = price - prevClose;
  const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

  // const isMarketStillOpen = isMarketOpen();
  // const timeColor = isMarketStillOpen ? global.colors.textSecondary : "#ef4444"; // Redis/Red if closed

  const timeStr = realtime?.timestamp
    ? new Date(realtime.timestamp).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).toLowerCase()
    : "04:14:59 pm";

  return (
    <View style={styles.card_verticalCard}>
      <View style={styles.card_topRow}>
        <View style={styles.card_topLeft}>
          <Text style={styles.card_companyName}>{item.name || item.symbol}</Text>
          <Text style={[styles.card_verticalTime, { color: global.colors.textSecondary }]}>{timeStr}</Text>
        </View>

        <View style={styles.card_topMiddle}>
          <SparklineChart symbol={item.symbol} color={color} />
        </View>

        <View style={styles.card_topRight}>
          <Text style={styles.card_verticalPrice}>
            ₹{Number(price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={[styles.card_verticalChange, { color }]}>
            {change >= 0 ? "+" : ""}{change.toFixed(2)} ({change >= 0 ? "+" : ""}{changePercent.toFixed(2)}%)
          </Text>
        </View>
      </View>

      <View style={styles.card_bottomRow}>
        <View style={[styles.card_badge, styles.card_badgeGainers]}>
          <Text style={styles.card_badgeText}>Gainers {counts.gainers}</Text>
        </View>
        <View style={[styles.card_badge, styles.card_badgeLosers]}>
          <Text style={styles.card_badgeText}>Losers {counts.losers}</Text>
        </View>
        <View style={[styles.card_badge, styles.card_badgeNeutral]}>
          <Text style={styles.card_badgeText}>Neutral {counts.neutral}</Text>
        </View>
      </View>
    </View>
  );
};

const StocksScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    exchange: initExchange = "NSE",
    filterIndex,
    from,
    headerData,
    headerCategory
  } = route.params || {};
  const [selectedExchange, setSelectedExchange] = useState(initExchange);
  const [selectedCategory, setSelectedCategory] = useState(from || "Indices");
  useEffect(() => {
    if (from) {
      setSelectedCategory(from);
    }
  }, [from]);
  const { prices: realtimePrices } = useRealtimePrices();
  const subscribedRef = useRef(false);
  const { openStockInfoDrawer } = useDrawer();

  // ✅ Sort and Filter States
  const [sortOpen, setSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState("Default");
  const [displayStocks, setDisplayStocks] = useState([]);
  const [originalStocks, setOriginalStocks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

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
        event_type: "Stocks",
        content: "Refreshed",
        app_version: "1.0.0"
      });
    } catch (err) {
      console.log("Logging failed", err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch()
    } catch (error) {

    } finally {
      setRefreshing(false);
      logRefresh();
    }
  };
  const sortOptions = ["A-Z", "Z-A", "High-Low", "Low-High"];
  const filterOptions = ["All", "Gainers", "Losers"];

  // 🔁 Dynamic fetch based on category + filter
  const fetchStocks = useCallback(async () => {
    let url = "";
    const group_token = headerData.token;
    url =
      selectedExchange === "BSE"
        ? `${apiUrl}/api/indicesNew/bseStocks?filterIndex=${group_token}&category=${selectedCategory}`
        : `${apiUrl}/api/indicesNew/nseStocks?filterIndex=${group_token}&category=${selectedCategory}`;

    try {
      const response = await axiosInstance.get(url);
      if (!response.status) {
        const text = response.data.data;
        console.error(`❌ HTTP ${response.status} from ${url}`, text);
        throw new Error(`API ${response.status}: ${response.statusText}`);
      }
      const result = response.data.data;
      return result || [];
    } catch (err) {
      console.error("Fetch error:", err);
      throw err;
    }
  }, [selectedExchange, selectedCategory, filterIndex]);
  const {
    data: stocksData = [],
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: [
      "stocks-screen",
      selectedExchange,
      selectedCategory,
      filterIndex,
    ],
    queryFn: fetchStocks,
    retry: 1,
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      if (subscribedRef.current || !data?.length) return;

      const symbols = Array.from(
        new Set(data.map((s) => s.symbol || s.token).filter(Boolean))
      );
      if (!symbols.length) return;

      const page = "StocksScreen";
      const context = `${selectedExchange}::${selectedCategory}`;
      subscribeSymbols(symbols, page, context);
      subscribedRef.current = true;
    },
  });


  // 📱 Subscription sync
  useFocusEffect(
    useCallback(() => {
      const page = "StocksScreen";
      const context = `${selectedExchange}::${selectedCategory}`;
      const symbols = Array.from(
        new Set(stocksData.map((s) => s.symbol || s.token).filter(Boolean))
      );

      if (symbols.length) {
        subscribeSymbols(symbols, page, context);
      }

      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          subscribeSymbols(symbols, page, context);
        } else {
          unsubscribeDelayed(symbols, page, context);
        }
      });

      return () => {
        unsubscribeDelayed(symbols, page, context);
        sub?.remove();
        subscribedRef.current = false;
      };
    }, [selectedExchange, selectedCategory, stocksData])
  );

  // 🎯 Handlers
  const handleExchangeChange = (exch) => {
    setSelectedExchange(exch);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    navigation.navigate("EquityHome", {
      initialCategory: category,
      initialExchange: selectedExchange,
    });
  };

  // ✅ Sort Logic
  const applySortToData = (sortType, data) => {
    let sorted = [...data];

    const getChangePercent = (item) => {
      const value = Number(realtimePrices[item.token]?.price || item.ltp || 0);
      const prevClose = Number(item.prev_close || 0);
      const change = prevClose > 0 ? value - prevClose : 0;
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
      return changePercent;
    };

    if (sortType === "A-Z") {
      sorted.sort((a, b) => {
        const nameA = (a.symbol || "").toUpperCase();
        const nameB = (b.symbol || "").toUpperCase();
        return nameA.localeCompare(nameB);
      });
    }
    else if (sortType === "Z-A") {
      sorted.sort((a, b) => {
        const nameA = (a.symbol || "").toUpperCase();
        const nameB = (b.symbol || "").toUpperCase();
        return nameB.localeCompare(nameA);
      });
    }
    else if (sortType === "High-Low") {
      sorted.sort((a, b) => getChangePercent(b) - getChangePercent(a));
    }
    else if (sortType === "Low-High") {
      sorted.sort((a, b) => getChangePercent(a) - getChangePercent(b));
    }

    return sorted;
  };
 

  const handleSort = (sortType) => {
    setSelectedSort(sortType);
    setSortOpen(false);
    setDisplayStocks(applySortToData(sortType, originalStocks));
  };

  const applyFilterToData = (filterType, data) => {
    if (filterType === "All") {
      return data;
    }

    return data.filter((stock) => {
     
      const price = Number(realtimePrices[stock.token]?.price || stock.ltp || 0);
      const prevClose = Number(realtimePrices[stock.token]?.prevClose || stock.prev_close || price);
      const change = price - prevClose;

      if (filterType === "Gainers") return change > 0;
      if (filterType === "Losers") return change < 0;

      return true;
    });
  };

  const handleFilter = (filterType) => {
    setIsFilterOpen(false);
    const filtered = applyFilterToData(filterType, originalStocks);
    setDisplayStocks(applySortToData(selectedSort, filtered));
  };

  // 🔁 Refetch on tab/exchange change
  useEffect(() => {
    refetch();
  }, [selectedExchange, selectedCategory, filterIndex, refetch]);

  const counts = useMemo(() => {
    let g = 0, l = 0, n = 0;
    displayStocks.forEach((stock) => {
      const price = Number(
        realtimePrices[stock.token]?.price || stock.ltp || 0
      );
      const prevClose = Number(
        realtimePrices[stock.token]?.prevClose || stock.prev_close || price
      );
      const change = price - prevClose;
      if (change > 0) g++;
      else if (change < 0) l++;
      else n++;
    });
    return { gainers: g, losers: l, neutral: n };
  }, [displayStocks, realtimePrices]);

  // Update display stocks when stocksData changes
  useEffect(() => {
    setOriginalStocks(stocksData);
    setDisplayStocks(stocksData);
    setSelectedSort("Default");
  }, [stocksData]);

  // 🖼️ Loading / Error UI
  if (isLoading && stocksData.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {/* <TopHeader /> */}
        <TopMenuSlider currentRoute="Stocks" />
        <View style={styles.placeholderContainer}>
          <ActivityIndicator size="large" color={global.colors.textPrimary} />
          <Text style={styles.loadingText}>
            Loading {selectedCategory} stocks...
          </Text>
        </View>
        {/* <BottomTabBar /> */}
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        {/* <TopHeader /> */}
        <TopMenuSlider currentRoute="Stocks" />
        <View style={styles.placeholderContainer}>
          <Text style={styles.errorText}>⚠️ {error.message}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
        {/* <BottomTabBar /> */}
      </SafeAreaView>
    );
  }



  return (
    <SafeAreaView edges={["bottom"]} style={styles.container}>
      {/* ... existing header code ... */}
      <TopMenuSlider currentRoute="Equity" />

      {/* ✅ MarketTabs */}
      <MarketTabs
        onExchangeChange={handleExchangeChange}
        onCategoryChange={handleCategoryChange}
        selectedExchange={selectedExchange}
        activeTab={selectedCategory}
        additionalTabs={["Sectors", "Themes"]}
      />

      {from && (
        <View style={styles.headerWithBack}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color={global.colors.secondary} />
          </TouchableOpacity>

          {/* Sort & Filter Bar - RIGHT SIDE */}
          {originalStocks.length > 0 && (
            <View style={styles.sortFilterButtonsContainer}>
              <TouchableOpacity style={styles.sortButton} onPress={() => setSortOpen(true)}>
                <Image
                  source={require("../../assets/sorticon.png")}
                  style={{ width: 18, height: 18, resizeMode: "contain" }}
                />
                <Text style={styles.sortFilterText}>Sort</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.filterButton} onPress={() => setIsFilterOpen(true)}>
                <Ionicons name="funnel-outline" size={16} color={global.colors.textPrimary} />
                <Text style={styles.sortFilterText}>Filter</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}


      {/* 📊 Stock List */}
      <FlatList
        ListHeaderComponent={
          <>
            {/* ✅ Advanced Header Card */}
            {headerData && (
              <View style={{ paddingHorizontal: 8, marginTop: 12, marginBottom: 10 }}>
                <AdvancedHeaderCard
                  item={headerData}
                  realtime={realtimePrices[headerData.token] || realtimePrices[headerData.name]}
                  counts={counts}
                />
              </View>
            )}
          </>
        }
        data={displayStocks}
        renderItem={({ item }) => (
          <StockListCard
            stock={item}
            realtime={realtimePrices[item.token]}
            onPress={() => openStockInfoDrawer(item.token, item.symbol, null, item.isin, {
              name: item.name || item.symbol,
              price: 0,
              exchange: item.exchange || selectedExchange,
              tradeable: item.tradeable
            })}
          />
        )}
        keyExtractor={(item, index) => `${item.symbol || item.token}-${index}`}
        contentContainerStyle={[styles.content, { paddingBottom: 70 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isLoading
                ? "Loading..."
                : `No ${selectedCategory.toLowerCase()} stocks found`}
            </Text>
            {selectedCategory === "Indices" && !filterIndex && (
              <Text style={[styles.emptyText, { marginTop: 8, fontSize: 13 }]}>
                Select an index from Equity screen to view stocks.
              </Text>
            )}
          </View>
        }
        refreshing={isFetching}
        onRefresh={onRefresh}
      />

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
                onPress={() => handleSort(option)}
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

      {/* <BottomTabBar /> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: global.colors.background,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: global.colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: global.colors.textSecondary,
    fontWeight: "500",
    marginTop: 12,
  },
  errorText: {
    fontSize: 18,
    color: global.colors.error,
    fontWeight: "600",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: global.colors.textPrimary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: global.colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
  headerContext: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: global.colors.surface,
  },
  contextText: {
    fontSize: 14,
    color: global.colors.textPrimary,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emptyContainer: {
    paddingTop: 40,
    alignItems: "center",
  },
  emptyText: {
    color: global.colors.textSecondary,
    fontSize: 16,
  },

  // 🔙 Back Header
  headerWithBack: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: global.colors.background,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },

  sortFilterButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // Sort & Filter Bar
  sortFilterBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 0,
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

  // Overlay and Dropdown
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  filterDropdown: {
    backgroundColor: global.colors.background,
    borderRadius: 10,
    marginTop: 240,
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
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownText: {
    fontSize: 13,
    color: global.colors.textPrimary,
    fontWeight: "500",
  },


  // Advanced Card Styles
  card_verticalCard: {
    backgroundColor: global.colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 0,
  },
  card_topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
  },
  card_topLeft: {
    flex: 1,
    justifyContent: "flex-start",
  },
  card_topMiddle: {
    justifyContent: "flex-end",
    paddingHorizontal: 8,
  },
  card_topRight: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },
  card_companyName: { fontSize: 16, fontWeight: "700", color: global.colors.textPrimary },
  card_verticalTime: {
    fontSize: 12,
    color: global.colors.textSecondary,
    marginTop: 4,
  },
  card_verticalPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: global.colors.textPrimary,
  },
  card_verticalChange: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  card_bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  card_badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 3,
  },
  card_badgeGainers: {
    backgroundColor: "rgba(34, 197, 94, 0.15)", // light green
  },
  card_badgeLosers: {
    backgroundColor: "rgba(239, 68, 68, 0.15)", // light red
  },
  card_badgeNeutral: {
    backgroundColor: "rgba(107, 114, 128, 0.2)", // light gray
  },
  card_badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: global.colors.textPrimary,
  },
});

export default StocksScreen;
