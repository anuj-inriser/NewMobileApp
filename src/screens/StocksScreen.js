import React, { useState, useCallback, useRef, useEffect } from "react";
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

const StocksScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    exchange: initExchange = "NSE",
    filterIndex,
    from,
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

  // ✅ Sort and Filter States
  const [sortOpen, setSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState("Default");
  const [displayStocks, setDisplayStocks] = useState([]);
  const [originalStocks, setOriginalStocks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);


  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchStocks()
    } catch (error) {

    } finally {
      setRefreshing(false);
    }
  };
  const sortOptions = ["A-Z", "Z-A", "High-Low", "Low-High"];
  const filterOptions = ["All", "Gainers", "Losers"];

  // 🔁 Dynamic fetch based on category + filter
  const fetchStocks = useCallback(async () => {
    let url = "";

    url =
      selectedExchange === "BSE"
        ? `${apiUrl}/api/indicesNew/bseStocks?filterIndex=${filterIndex}&category=${selectedCategory}`
        : `${apiUrl}/api/indicesNew/nseStocks?filterIndex=${filterIndex}&category=${selectedCategory}`;

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

    if (sortType === "A-Z") {
      sorted.sort((a, b) => {
        const nameA = (a.symbol || "").toUpperCase();
        const nameB = (b.symbol || "").toUpperCase();
        return nameA.localeCompare(nameB);
      });
    } else if (sortType === "Z-A") {
      sorted.sort((a, b) => {
        const nameA = (a.symbol || "").toUpperCase();
        const nameB = (b.symbol || "").toUpperCase();
        return nameB.localeCompare(nameA);
      });
    } else if (sortType === "High-Low") {
      sorted.sort((a, b) => {
        const priceA = Number(realtimePrices[a.symbol]?.price || a.ltp || 0);
        const priceB = Number(realtimePrices[b.symbol]?.price || b.ltp || 0);
        return priceB - priceA;
      });
    } else if (sortType === "Low-High") {
      sorted.sort((a, b) => {
        const priceA = Number(realtimePrices[a.symbol]?.price || a.ltp || 0);
        const priceB = Number(realtimePrices[b.symbol]?.price || b.ltp || 0);
        return priceA - priceB;
      });
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
      const price = Number(realtimePrices[stock.symbol]?.price || stock.ltp || 0);
      const prevClose = Number(realtimePrices[stock.symbol]?.prevClose || stock.prev_close || price);
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

  // 🔙 Back label resolver
  const getBackLabel = () => {
    if (filterIndex) return filterIndex;
    if (from === "Market Cap") return "Market Cap";
    if (from === "Sectors") return "Sectors";
    if (from === "Themes") return "Themes";
    return from || "Back";
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.container}>
      {/* <TopHeader /> */}
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
            <Text style={styles.backText}>({getBackLabel()})</Text>
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

      {/* Sort & Filter Bar - Only when no back button */}
      {!from && originalStocks.length > 0 && (
        <View style={styles.sortFilterBar}>
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

      {/* 📊 Stock List */}
      <FlatList
        data={displayStocks}
        renderItem={({ item }) => (
          <StockListCard
            stock={item}
            realtime={realtimePrices[item.symbol]}
            onPress={() =>
              navigation.navigate("AdvancedChart", {
                symbol: item.symbol,
              })
            }
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
        refreshing={refreshing}
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
  },
  backIcon: {
    fontSize: 25,
    fontWeight: "bold",
    color: global.colors.textPrimary,
    marginRight: 10,
  },
  backText: {
    fontSize: 14,
    fontWeight: "600",
    color: global.colors.textPrimary,
    marginLeft: 7,
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
    backgroundColor: global.colors.overlay,
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
});

export default StocksScreen;