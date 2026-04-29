import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Modal,
  Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AppState, BackHandler, ToastAndroid } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import TopMenuSlider from "../components/TopMenuSlider";
import MarketTabs from "../components/MarketTabs";
import Indices from "../components/Indices";
import StocksScreen from "./StocksScreen";
import { useRealtimePrices } from "../hooks/useRealtimePrices";
import {
  subscribeSymbols,
  unsubscribeDelayed,
} from "../ws/marketSubscriptions";
import { Ionicons } from "@expo/vector-icons";
import axiosInstance from "../api/axios";
import { useDrawer } from "../context/DrawerContext";
import SparklineChart from "../components/Sparkline";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGroupTypes } from "../hooks/useGroupTypes";


// ✅ Generic List Component for all dynamic categories
const DynamicGroupList = ({ data, exchange, category, navigation, refreshing, onRefresh, onSelectGroup }) => {
  const renderItem = ({ item }) => {
    const isPositive = item.change > 0;
    let color = global.colors.textSecondary;
    if (item.change > 0) color = global.colors.success;
    else if (item.change < 0) color = global.colors.error;

    return (
      <TouchableOpacity
        style={styles.marketCapItem}
        onPress={() => onSelectGroup(item)}
      >
        <View style={styles.infoContainer}>
          <Text style={styles.marketCapName}>{item.group_name || item.name}</Text>
          <Text style={styles.marketCapSymbol}>{item.symbol || exchange}</Text>
        </View>
        <View style={styles.chartContainer}>
          <SparklineChart symbol={item.symbol} color={color} />
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            ₹{Number(item.ltp || 0).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text style={[styles.change, { color }]}>
            {isPositive ? "+" : ""}{item.change?.toFixed(2)} ({isPositive ? "+" : ""}{item.changePercent?.toFixed(2)}%)
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={data}
      keyExtractor={(item, index) => `${exchange}-${category}-${item.group_name || item.name}-${index}`}
      renderItem={renderItem}
      contentContainerStyle={[styles.marketCapList, { paddingBottom: 80 }]}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
};

// ✅ Dynamic Data Fetch Function
const fetchGroupData = async ({ queryKey: [, category, exchange] }) => {
  try {
    const formattedCategory = category.toLowerCase().replace(/\s+/g, "");
    const isStandard = ["marketcap", "sector", "theme", "index"].includes(formattedCategory);

    let rawData = [];
    const exchangesToFetch = exchange === "All" ? ["NSE", "BSE"] : [exchange];

    for (const exch of exchangesToFetch) {
      const formattedExchange = exch.toLowerCase();
      let url;
      
      if (isStandard) {
        url = `/indicesNew/${formattedExchange}${formattedCategory}`;
      } else {
        const categoryUpper = category.toUpperCase().replace(/\s+/g, "");
        if (exch === "NSE") {
          url = `/indicesNew/nseAll${categoryUpper}`;
        } else {
          url = `/indicesNew/bseAll${categoryUpper}`;
        }
      }

      const response = await axiosInstance.get(url);
      const data = response?.data?.data ?? [];
      
      // Mark the exchange for each item if we are fetching 'All'
      const markedData = data.map(item => ({
        ...item,
        exchange: exch
      }));
      
      rawData = [...rawData, ...markedData];
    }

    return rawData.map(item => ({
      ...item,
      change: Number(item.ltp || 0) - Number(item.prev_close || 0),
      changePercent: item.prev_close > 0
        ? ((Number(item.ltp || 0) - Number(item.prev_close || 0)) / Number(item.prev_close)) * 100
        : 0
    }));
  } catch (error) {
    console.error(`Error fetching ${category}:`, error);
    throw error;
  }
};

export default function EquityScreen() {
  const navigation = useNavigation();

  const { prices: realtimePrices } = useRealtimePrices();
  const route = useRoute();
  const { initialCategory, initialExchange } = route.params || {};
  const [selectedExchange, setSelectedExchange] = useState(
    initialExchange || "NSE"
  );
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory || "Index"
  );
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showPreview, setShowPreview] = useState(true);

  // ✅ Dynamic Category States
  const [displayData, setDisplayData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [allIndicesData, setAllIndicesData] = useState([]);
  const [originalAllIndicesData, setOriginalAllIndicesData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ UI States
  const [sortOpen, setSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState("Default");


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
        event_type: "Equity",
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
      if (selectedCategory === "Index") {
        await indicesQuery.refetch();
      } else {
        await groupQuery.refetch();
      }
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
      logRefresh();
    }
  };
  // Only apply route.params if they represent an EXTERNAL navigation intent
  useEffect(() => {
    const { initialCategory, initialExchange } = route.params || {};

    // Only update if params exist AND differ from current state
    // AND if this is not just a re-render due to internal state change
    if (initialCategory !== undefined && initialCategory !== selectedCategory) {
      setSelectedCategory(initialCategory);
      setShowPreview(false);
    }
    if (initialExchange !== undefined && initialExchange !== selectedExchange) {
      setSelectedExchange(initialExchange);
    }
    // ✅ Use primitive values from route.params, not the object itself
  }, [route.params?.initialCategory, route.params?.initialExchange]);


  const sortOptions = ["A-Z", "Z-A", "High-Low", "Low-High"];

  // Get filter options based on selected category
  const getFilterOptions = () => {
    if (selectedCategory === "Market Cap" || selectedCategory === "Index" || selectedCategory === "Sector") {
      return ["All", "Gainers", "Losers"];
    }
    return ["All"];
  };

  const filterOptions = getFilterOptions();

  // ✅ Swipe Navigation Setup - Using touch tracking instead of PanResponder
  const { data: groupTypes = [] } = useGroupTypes();
  const swipeCategories = useMemo(() => {
    // Ensure "Index" is only added once by including it in the Set with dynamic categories
    const dynamic = groupTypes.map(i => i.indice_name);
    return [...new Set(["Index", ...dynamic])];
  }, [groupTypes]);
  const touchStartX = useRef(0);

  const handleSwipeStart = (e) => {
    touchStartX.current = e.nativeEvent.locationX;
  };

  const handleSwipeEnd = (e) => {
    const touchEndX = e.nativeEvent.locationX;
    const distance = touchStartX.current - touchEndX;
    const currentIndex = swipeCategories.indexOf(selectedCategory);

    // Swipe left (distance > 50): Move to next tab (right to left motion)
    if (distance > 50 && currentIndex < swipeCategories.length - 1) {
      setSelectedCategory(swipeCategories[currentIndex + 1]);
      setShowPreview(false);
    }
    // Swipe right (distance < -50): Move to previous tab (left to right motion)
    else if (distance < -50 && currentIndex > 0) {
      setSelectedCategory(swipeCategories[currentIndex - 1]);
      setShowPreview(false);
    }
  };

  // const handleBuyFromHome = useCallback(
  //   (item) => {
  //     navigation.navigate("TradeOrder", {
  //       symbol: item.sumbol,
  //       token: item.token,
  //       name: item.name,
  //       internaltype: "Place",
  //     });
  //   },
  //   [navigation, selectedExchange]
  // );
  const getCurrentTokens = () => {
    if (selectedCategory === "Index") {
      return allData.map((i) => i.token).filter(Boolean);
    }

    return displayData.map((i) => i.token).filter(Boolean);
  };
  const getCurrentSymbols = () => {
    if (!Array.isArray(allData)) return [];

    if (selectedCategory === "Index" || selectedCategory === "Indices") {
      return allData.map(i => i.symbol || i.name).filter(Boolean);
    }

    return displayData.map((i) => i.symbol || i.group_name || i.name).filter(Boolean);
  };
  useFocusEffect(
    useCallback(() => {
      let backPressCount = 0;
      let timeout;

      const onBackPress = () => {
        if (selectedGroup) {
          setSelectedGroup(null);
          return true;
        }
        if (backPressCount === 0) {
          backPressCount = 1;
          ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);

          timeout = setTimeout(() => {
            backPressCount = 0; // reset after 2 sec
          }, 2000);

          return true; // first press prevents exit
        } else {
          clearTimeout(timeout);

          // ✅ exit app, home screen pe aajaye, logout logic fire nahi hoga
          BackHandler.exitApp();

          // ⚠️ Note: false return can trigger default handler, so return true
          return true;
        }
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => {
        backHandler.remove();
        clearTimeout(timeout);
      };
    }, [selectedGroup])
  );


  useFocusEffect(
    useCallback(() => {
      const page = "EquityScreen";
      const context = selectedCategory;

      const tokens = getCurrentTokens();

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
    }, [
      selectedCategory,
      selectedExchange,
      allData,
      displayData,

    ])
  );



  // ✅ Dynamic Category Query
  const groupQuery = useQuery({
    queryKey: ["groupData", selectedCategory, selectedExchange],
    queryFn: fetchGroupData,
    enabled: selectedCategory !== "Index",
    retry: false,
  });

  // Sync group data to state for sorting/filtering
  useEffect(() => {
    if (groupQuery.data) {
      const sortedData = applySortToData("Default", groupQuery.data);
      setDisplayData(sortedData);
      setOriginalData(sortedData);
      setSelectedSort("Default");
    }
  }, [groupQuery.data]);

  // ✅ Indices Fetch 

  const fetchIndices = async ({ queryKey: [, exchange] }) => {
    try {
      let combinedData = [];

      if (exchange === "All") {
        const [nseResponse, bseResponse] = await Promise.all([
          axiosInstance.get("/indicesNew/nse"),
          axiosInstance.get("/indicesNew/bse")
        ]);
        const nseData = nseResponse?.data?.data ?? [];
        const bseData = bseResponse?.data?.data ?? [];

        combinedData = [
          ...nseData.map(item => ({ ...item, exchange: "NSE" })),
          ...bseData.map(item => ({ ...item, exchange: "BSE" }))
        ];
      } else {
        const url = exchange === "BSE" ? "/indicesNew/bse" : "/indicesNew/nse";
        const response = await axiosInstance.get(url);
        const exchangeData = response?.data?.data ?? [];
        combinedData = exchangeData.map(item => ({ ...item, exchange }));
      }

      return combinedData.map(item => ({
        ...item,
        change: Number(item.ltp || 0) - Number(item.prev_close || 0),
        changePercent: item.prev_close > 0
          ? ((Number(item.ltp || 0) - Number(item.prev_close || 0)) / Number(item.prev_close)) * 100
          : 0
      }));
    } catch (error) {
      console.error(
        error?.response?.data?.message || "Error fetching indices"
      );
      throw error;
    }
  };


  const indicesQuery = useQuery({
    queryKey: ["indices", selectedExchange],
    queryFn: fetchIndices,
    retry: false,
    staleTime: 30000,             // 30 seconds cache
    refetchOnWindowFocus: false,
  });
  // ✅ Stable reference: useMemo prevents new [] on every render (infinite loop fix)
  const allData = useMemo(() => indicesQuery.data ?? [], [indicesQuery.data]);
  const loading = indicesQuery.isLoading;
  useEffect(() => {
    if (allData && allData.length > 0) {
      const sortedIndices = applySortToData("Default", allData);
      setAllIndicesData(sortedIndices);
      setOriginalAllIndicesData(sortedIndices);
    }
  }, [allData, selectedExchange]);


  // ✅ Handlers
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedGroup(null);
    setShowPreview(false);
  };

  const handleExchangeChange = (exchange) => setSelectedExchange(exchange);

  // ✅ Sort Logic
  const applySortToData = (sortType, data) => {
    let sorted = [...data];

    const getLTP = (item) => Number(item.ltp || item.value || 0);

    const getChangePercent = (item) => {
      const value = getLTP(item);
      const prevClose = Number(item.prev_close || 0);
      const change = prevClose > 0 ? value - prevClose : 0;
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
      return changePercent;
    };

    if (sortType === "A-Z") {
      sorted.sort((a, b) => {
        const nameA = (a.symbol || a.group_name || a.name || "").toUpperCase();
        const nameB = (b.symbol || b.group_name || b.name || "").toUpperCase();
        return nameA.localeCompare(nameB);
      });
    }
    else if (sortType === "Z-A") {
      sorted.sort((a, b) => {
        const nameA = (a.symbol || a.group_name || a.name || "").toUpperCase();
        const nameB = (b.symbol || b.group_name || b.name || "").toUpperCase();
        return nameB.localeCompare(nameA);
      });
    }
    else if (sortType === "High-Low") {
      sorted.sort((a, b) => getChangePercent(b) - getChangePercent(a));
    }
    else if (sortType === "Low-High") {
      sorted.sort((a, b) => getChangePercent(a) - getChangePercent(b));
    }
    else if (sortType === "Default") {
      // 1) first by sort order asc if no change then; 
      // 2) price percentage change high to low.
      sorted.sort((a, b) => {
        const orderA = a.sort_order ?? 999999;
        const orderB = b.sort_order ?? 999999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return getChangePercent(b) - getChangePercent(a);
      });
    }

    return sorted;
  };

  const handleSort = (sortType) => {
    setSelectedSort(sortType);
    setSortOpen(false);

    if (selectedCategory === "Index") {
      setAllIndicesData(applySortToData(sortType, originalAllIndicesData));
    } else {
      setDisplayData(applySortToData(sortType, originalData));
    }
  };

  const handleFilterByType = (filterType) => {
    setIsFilterOpen(false);

    const getChangePercent = (item) => {
      const value = Number(item.ltp || 0);
      const prevClose = Number(item.prev_close || 0);
      const change = prevClose > 0 ? value - prevClose : 0;
      return prevClose > 0 ? (change / prevClose) * 100 : 0;
    };

    const processData = (data) => {
      let filtered = [...data];
      if (filterType === "Gainers") {
        filtered = filtered
          .filter((item) => getChangePercent(item) > 0)
          .sort((a, b) => getChangePercent(b) - getChangePercent(a));
      } else if (filterType === "Losers") {
        filtered = filtered
          .filter((item) => getChangePercent(item) < 0)
          .sort((a, b) => getChangePercent(a) - getChangePercent(b));
      }
      return filtered;
    };

    if (selectedCategory === "Index") {
      setAllIndicesData(
        filterType === "All" ? originalAllIndicesData : processData(originalAllIndicesData)
      );
    } else {
      setDisplayData(
        filterType === "All" ? originalData : processData(originalData)
      );
    }
  };

  const handleViewAllIndices = () => {
    setSelectedCategory("Indices");
    setShowPreview(false);
  };

  const { openStockInfoDrawer } = useDrawer();

  const handleIndexPress = (index) => {
    setSelectedGroup(index);
  };

  // ✅ Swipe right → View chart directly
  const handleSwipeToChart = (index) => {
    openStockInfoDrawer(index.symbol);
  };

  // ✅ Render Content
  const renderContent = () => {
    if (selectedGroup) {
      return (
        <StocksScreen
          inline={true}
          inlineGroup={selectedGroup}
          inlineCategory={selectedCategory}
          inlineExchange={selectedExchange}
          onBack={() => setSelectedGroup(null)}
        />
      );
    }

    if (selectedCategory === "Index") {
      return (
        <Indices
          exchange={selectedExchange}
          viewMode={showPreview ? "horizontal" : "vertical"}
          onViewAllPress={handleViewAllIndices}
          onIndexPress={handleIndexPress}
          externalData={allIndicesData}
          maxItems={showPreview ? 5 : undefined}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      );
    }

    if (groupQuery.isLoading) {
      return (
        <View style={styles.placeholderContainer}>
          <ActivityIndicator size="large" color={global.colors.overlay} />
          <Text style={styles.loadingText}>Loading {selectedCategory}...</Text>
        </View>
      );
    }

    if (groupQuery.isError) {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={styles.errorText}>⚠️ Failed to load {selectedCategory}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => groupQuery.refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!displayData || displayData.length === 0) {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No {selectedCategory} data available</Text>
        </View>
      );
    }

    const dataWithRealtime = mergeWithRealtime(
      displayData.map((item) => ({
        ...item,
        symbol: item.symbol || item.group_name || item.name,
        name: item.group_name || item.name,
        token: item.token,
        prevClose: Number(item.prev_close || 0),
        value: Number(item.ltp || 0),
      })),
      realtimePrices
    );

    return (
      <DynamicGroupList
        data={dataWithRealtime}
        exchange={selectedExchange}
        category={selectedCategory}
        navigation={navigation}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onSelectGroup={setSelectedGroup}
      />
    );
  };

  return (
    <>
      <SafeAreaView
        edges={["bottom"]}
        style={{ flex: 1, backgroundColor: global.colors.background }}
      >
        {/* <TopHeader /> */}
        <TopMenuSlider currentRoute={route.name} />
        <MarketTabs
          onExchangeChange={handleExchangeChange}
          onCategoryChange={handleCategoryChange}
          selectedExchange={selectedExchange}
          activeTab={selectedCategory}
          tabs={swipeCategories}
        />

        {/* Sort & Filter Bar for Market Cap, Sectors, and Indices */}
        {(selectedCategory === "Market Cap" || selectedCategory === "Sector" || selectedCategory === "Index") && !selectedGroup && (
          <View style={styles.sortFilterBar}>

            {/* Sort & Filter - RIGHT (Always visible) */}
            <View style={styles.sortFilterButtonsContainer}>
              <TouchableOpacity style={styles.sortButton} onPress={() => setSortOpen(true)}>
                <Image
                  source={require("../../assets/sorticon.png")}
                  style={{ width: 18, height: 18, resizeMode: "contain" }}
                />
                <Text style={styles.sortFilterText}>Sort</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.filterButton} onPress={() => setIsFilterOpen(true)}>
                <Ionicons name="funnel-outline" size={16} color="#000" />
                <Text style={styles.sortFilterText}>Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View
          style={styles.swipeWrapper}
          onTouchStart={handleSwipeStart}
          onTouchEnd={handleSwipeEnd}
        >
          <View style={styles.content}>{renderContent()}</View>
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
                  onPress={() => handleFilterByType(option)}
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
const mergeWithRealtime = (list, realtimePrices) => {
  return list.map((item) => {
    const rt = realtimePrices[item.token];

    if (!rt) return item;

    const prevClose = item.prevClose || rt.prevClose || rt.open || item.value;

    const change = rt.price - prevClose;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return {
      ...item,
      value: rt.price,
      change,
      changePercent,
      timestamp: rt.timestamp || rt.exchange_timestamp || item.timestamp || item.exchange_timestamp,
      exchange_timestamp: rt.exchange_timestamp || item.exchange_timestamp,
    };
  });
};

// ✅ Styles
const styles = StyleSheet.create({
  swipeWrapper: { flex: 1 },
  content: { flex: 1, backgroundColor: global.colors.background, },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: global.colors.background,
  },
  placeholderText: { fontSize: 16, color: global.colors.textSecondary, fontWeight: "500" },
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
    marginBottom: 8,
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: 14,
    color: global.colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 32,
  },
  retryButton: {
    backgroundColor: global.colors.overlay,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: global.colors.background,
    fontSize: 16,
    fontWeight: "700",
  },

  // Swipe Actions
  rightAction: {
    backgroundColor: global.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
  },
  actionText: {
    color: global.colors.background,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },

  // Market Cap List
  marketCapList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  marketCapItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: global.colors.background,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: global.colors.border,
    shadowColor: global.colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  marketCapName: { fontSize: 14, fontWeight: "600" },
  marketCapSymbol: { fontSize: 11, color: global.colors.textSecondary },
  marketCapValue: {
    fontSize: 15,
    fontWeight: "600",
    color: global.colors.overlay,
  },
  positive: {
    color: global.colors.success,
  },
  negative: {
    color: global.colors.error,
  },
  price: { fontSize: 15, fontWeight: "600", color: global.colors.textPrimary,textAlign:"right" },
  change: { fontSize: 12, fontWeight: "600", marginTop: 4,textAlign:"right" },
  leftAction: {
    justifyContent: "center",
    paddingLeft: 30,
    width: 90,
  },
  buyText: {
    fontSize: 12,
    fontWeight: "700",
    color: global.colors.secondary,
  },

  // New Advanced Card Styles
  card_verticalCard: {
    backgroundColor: global.colors.background,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: global.colors.border,
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
    justifyContent: "flex-end", // Align sparkline to bottom
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

  // Sort & Filter Bar
  sortFilterBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  backButtonText: {
    marginLeft: 6,
    fontSize: 13,
    color: global.colors.secondary,
    fontWeight: "600",
  },
  sortFilterButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    flex: 1,
    justifyContent: "flex-end",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  sortFilterText: {
    marginLeft: 6,
    fontSize: 13,
    color: "#000",
    fontWeight: "600",
  },

  // Overlay and Dropdown
  overlay: {
    flex: 1,
    // backgroundColor: global.colors.overlay,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    top: 90,
  },
  verticalCardRight: {
    alignItems: "flex-end",
  },
  filterDropdown: {
    backgroundColor: global.colors.background,
    borderRadius: 10,
    marginTop: 150,
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
  verticalPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: global.colors.textPrimary,
  },
  verticalChange: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownText: {
    fontSize: 13,
    color: "#000",
    fontWeight: "500",
  },
  cardWrapper: { marginVertical: 6, marginHorizontal: 4 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: global.colors.background,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: global.colors.border,
    shadowColor: global.colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  infoContainer: { flex: 1 },
  chartContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  priceContainer: { flex: 1, alignItems: "flex-end", justifyContent: "center" },
  companyName: { fontSize: 14, fontWeight: "600" },
  symbol: { fontSize: 11, color: global.colors.textSecondary },
});