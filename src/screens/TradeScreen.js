import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  AppState,
  RefreshControl,
  DeviceEventEmitter,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
// import TopHeader from "../components/TopHeader";
import TopMenuSlider from "../components/TopMenuSlider";
import { useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
// import BottomTabBar from '../components/BottomTabBar';
import { Ionicons } from "@expo/vector-icons";
import axiosInstance from "../api/axios";
import GlobalTopMenu from "../components/GlobalTopMenu";
import TradeCard from "../components/Trade/TradeCard";
import { useFocusEffect } from "@react-navigation/native";
import { useActivePlans } from "../hooks/useActivePlans";
import {
  subscribeSymbols,
  unsubscribeDelayed,
} from "../ws/marketSubscriptions";
import { useRealtimePrices } from "../hooks/useRealtimePrices";
import GlobalSubTabMenu from "../components/GlobalSubTabMenu";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

const filterOptions = ["All", "Live", "Closed", "Target Hit", "Target Miss"];
const sortOptions = ["A-Z", "Z-A", "High-Low", "Low-High"];

const TradeScreen = () => {
  const { prices } = useRealtimePrices();
  const route = useRoute();
  const { role, userData } = useAuth();
  const currentRole = role || userData?.role || 1;
  const { data: activePlansData, refetch: refetchActivePlans } = useActivePlans();
  const allowedScriptTypes = activePlansData?.allowedScriptTypes || [];
  const didSubscribeRef = useRef(false);
  const ALL_TYPE = { tradeTypeId: null, tradeTypeName: "All" };
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedType, setSelectedType] = useState(ALL_TYPE);
  // const [tradeRecommendations, setTradeRecommendations] = useState([]);
  // const [tradeCategories, setTradeCategories] = useState([]);
  // const [loadingCategories, setLoadingCategories] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState("A-Z");
  const touchMoveX = useRef(0);
  const touchStartX = useRef(0);


  const mergeWithRealtime = (list, realtimePrices) => {
    return list.map((item) => {
      const priceKey =
        item?.token != null && String(item.token).trim() !== ""
          ? String(item.token)
          : item?.symbol || item?.script || item?.script_name || null;
      const rt = priceKey ? realtimePrices[priceKey] : null;
      // ✅ LTP: realtime > item.ltp > 0
      const ltp =
        rt?.price != null
          ? Number(rt.price)
          : Number(item.ltp || item.value || 0);
      // ✅ Prev Close: realtime > item.prev_close > ltp (no change fallback)
      const prevClose =
        rt?.prevClose != null
          ? Number(rt.prevClose)
          : Number(item.prev_close || item.prevClose || ltp);

      // ✅ Recalculate every ,time — fresh & consistent
      const change = ltp - prevClose;
      const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

      return {
        ...item,
        value: ltp,
        prevClose,
        change,
        changePercent,
        timestamp: rt?.timestamp || item.timestamp || new Date().toISOString(),
      };
    });
  };

  // ✅ Handlers
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setShowPreview(false);

    if (
      category === "Intraday" &&
      marketCapData.length === 0 &&
      !isMarketCapLoading
    ) {
      fetchMarketCap(selectedExchange);
    }

    if (
      category === "Long Term" &&
      sectorsData.length === 0 &&
      !isSectorsLoading
    ) {
      fetchSectors(selectedExchange);
    }

    if (category === "Themes" && themesData.length === 0 && !isThemesLoading) {
      fetchThemes(selectedExchange);
    }
  };

  const handleFilterSelect = (option) => {
    setSelectedFilter(option);
    setIsFilterOpen(false);
  };

  const handleSortSelect = (option) => {
    setSelectedSort(option);
    setIsSortOpen(false);
  };

  // const handleSwipeStart = (e) => {
  //   touchStartX.current = e.nativeEvent.pageX;
  // };

  // const handleSwipeEnd = (e) => {
  //   const touchEndX = e.nativeEvent.pageX;
  //   const distance = touchStartX.current - touchEndX;
  //   const currentIndex = typesWithAll.findIndex(t => t.tradeTypeId === selectedType.tradeTypeId);

  //   if (distance > 50 && currentIndex < typesWithAll.length - 1) {
  //     setSelectedType(typesWithAll[currentIndex + 1]);
  //   } else if (distance < -50 && currentIndex > 0) {
  //     setSelectedType(typesWithAll[currentIndex - 1]);
  //   }
  // };

  const handleSwipeStart = (e) => {
    touchStartX.current = e.nativeEvent.pageX;
  };

  const handleSwipeMove = (e) => {
    touchMoveX.current = e.nativeEvent.pageX;
  };

  const handleSwipeEnd = () => {
    const distance = touchStartX.current - touchMoveX.current;

    const swipeThreshold = 150;

    const currentIndex = typesWithAll.findIndex(
      (t) => t.tradeTypeId === selectedType.tradeTypeId,
    );

    if (distance > swipeThreshold && currentIndex < typesWithAll.length - 1) {
      setSelectedType(typesWithAll[currentIndex + 1]);
    } else if (distance < -swipeThreshold && currentIndex > 0) {
      setSelectedType(typesWithAll[currentIndex - 1]);
    }
  };

  const getSymbols = () => {
    return Array.from(
      new Set(
        tradeRecommendations
          .map((t) => t?.token || t?.symbol || t?.script || t?.script_name)
          .filter(Boolean),
      ),
    );
  };

  useFocusEffect(
    useCallback(() => {
      refetchActivePlans();

      const page = "Ideas";
      const context =
        selectedCategory?.scriptTypeName || selectedCategory?.name || "unknown";

      const symbols = getSymbols();

      if (!symbols.length) {
        console.log(`⏭ SKIP SUBSCRIBE → ${page}::${context} (no symbols)`);
        return;
      }

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
    }, [tradeRecommendations, selectedCategory, refetchActivePlans]),
  );

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "REFRESH_ACTIVE_PLANS",
      () => {
        refetchActivePlans();
      },
    );

    return () => {
      subscription.remove();
    };
  }, [refetchActivePlans]);

  const { data: tradeTypes = [] } = useQuery({
    queryKey: ["tradeTypes"],
    queryFn: async () => {
      const res = await axiosInstance.get("/tradetype");
      return res.data.data || [];
    },
    // staleTime: 1000 * 60 * 60,
  });

  const { data: tradeCategories = [], isLoading: loadingCategories } = useQuery(
    {
      queryKey: ["tradeCategories"],
      queryFn: async () => {
        const res = await axiosInstance.get("/scripttype");
        let categories = res?.data?.data || [];

        // your sorting logic
        categories.sort((a, b) => {
          const nameA = (a.scriptTypeName || "").toLowerCase();
          const nameB = (b.scriptTypeName || "").toLowerCase();

          if (nameA.includes("equity") && !nameB.includes("equity")) return -1;
          if (!nameA.includes("equity") && nameB.includes("equity")) return 1;

          if (nameA.includes("f&o") && !nameB.includes("f&o")) return -1;
          if (!nameA.includes("f&o") && nameB.includes("f&o")) return 1;

          return 0;
        });

        return categories;
      },

      // staleTime: 1000 * 60 * 60,
    },
  );

  // Prepend "All" tab to trade types (sub-menu)
  const typesWithAll = useMemo(() => {
    return [ALL_TYPE, ...tradeTypes];
  }, [tradeTypes]);

  useEffect(() => {
    if (!tradeCategories.length) return;
    if (route.params?.selectedCategoryId) {
      const found = tradeCategories.find(
        (c) => c.id === route.params.selectedCategoryId,
      );
      if (found) {
        setSelectedCategory(found);
        return;
      }
    }

    // Only set default if selectedCategory is null AND no route param
    if (!selectedCategory) {
      setSelectedCategory(tradeCategories[0]);
    }
  }, [route.params?.selectedCategoryId, tradeCategories, selectedCategory]);

  useEffect(() => {
    if (tradeTypes.length && !selectedType) {
      setSelectedType(tradeTypes);
    }
  }, [tradeTypes]);

  const { data: tradeRecommendations = [], isLoading: loadingRecommendations, refetch, isFetching } =
    useQuery({
      queryKey: [
        "tradeRecommendations",
        selectedCategory?.scriptTypeId,
        selectedFilter,
        selectedType?.tradeTypeId,
      ],

      queryFn: async () => {
        const params = {};

        if (selectedCategory?.scriptTypeId) {
          params.scriptTypeId = selectedCategory.scriptTypeId;
        }

        if (selectedFilter !== "All") {
          params.status = selectedFilter;
        }

        if (selectedType?.tradeTypeId) {
          params.type = selectedType.tradeTypeId;
        }

        const res = await axiosInstance.get("/traderecommendation/all", {
          params,
        });

        return res?.data?.data || [];
      },

      enabled: !!selectedCategory,

      // replaces your setInterval
      // refetchInterval: 1000,

      // refetchIntervalInBackground: true,
    });


  const displayStocks = useMemo(() => {
    let filtered = tradeRecommendations.filter((item) => !item.track_only);
    let merged = mergeWithRealtime(filtered, prices);

    // Apply Sorting
    switch (selectedSort) {
      case "A-Z":
        merged.sort((a, b) => (a.script_name || "").localeCompare(b.script_name || ""));
        break;
      case "Z-A":
        merged.sort((a, b) => (b.script_name || "").localeCompare(a.script_name || ""));
        break;
      case "High-Low":
        merged.sort((a, b) => (b.value || 0) - (a.value || 0));
        break;
      case "Low-High":
        merged.sort((a, b) => (a.value || 0) - (b.value || 0));
        break;
    }

    return merged;
  }, [tradeRecommendations, prices, selectedSort]);

  const renderdata = () => { };

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
        event_type: "Trade",
        content: "Refreshed",
        app_version: "1.0.0"
      });
    } catch (err) {
      console.log("Logging failed", err);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchActivePlans()]);
    logRefresh();
  };

  return (
    <>
      <SafeAreaView edges={["bottom"]} style={styles.container}>
        {/* <TopHeader /> */}
        <GlobalTopMenu
          tabs={tradeCategories}
          activeTab={selectedCategory}
          onTabChange={setSelectedCategory}
          showFilter={false}
        />
        <GlobalSubTabMenu
          tabs={typesWithAll}
          activeTab={selectedType}
          onTabChange={setSelectedType}
        />

        {/* SORT & FILTER ROW - above cards */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.filterContainer}
            onPress={() => setIsSortOpen(true)}
            activeOpacity={0.7}
          >
            <Image
              source={require("../../assets/sorticon.png")}
              style={{ width: 14, height: 14, resizeMode: "contain" }}
            />
            <Text style={styles.filterLabel}>Sort</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterContainer, { marginLeft: 16 }]}
            onPress={() => setIsFilterOpen(!isFilterOpen)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={selectedFilter !== "All" ? "funnel" : "funnel-outline"}
              size={15}
              color={global.colors.textPrimary}
            />
            <Text style={styles.filterLabel}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* SORT MODAL */}
        <Modal
          visible={isSortOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsSortOpen(false)}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setIsSortOpen(false)}
          >
            <View style={[styles.filterDropdown, { marginTop: 225 }]}>
              {sortOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => handleSortSelect(option)}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      selectedSort === option && {
                        color: global.colors.secondary,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* FILTER MODAL */}
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
                  onPress={() => handleFilterSelect(option)}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      selectedFilter === option && {
                        color: global.colors.secondary,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        <ScrollView
          style={{ flex: 1 }}
          onTouchStart={handleSwipeStart}
          onTouchMove={handleSwipeMove}
          onTouchEnd={handleSwipeEnd}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={handleRefresh}
            />
          }
        >
          {tradeRecommendations.length === 0 ? (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: global.colors.textSecondary,
                }}
              >
                No Recommendations for {selectedCategory?.tradeTypeName}{" "}
                Category
              </Text>
            </View>
          ) : (

            displayStocks.map((recommendation) => {
              const priceKey =
                recommendation?.token != null && String(recommendation.token).trim() !== ""
                  ? String(recommendation.token)
                  : recommendation?.symbol || recommendation?.script || recommendation?.script_name || null;
              const liveData = priceKey ? prices[priceKey] : null;
              return (
                <TradeCard
                  key={recommendation.tradeId}
                  Tradeid={recommendation.tradeId}
                  script={
                    recommendation.script_name ||
                    recommendation.symbol ||
                    recommendation.script
                  }
                  script_id={recommendation.script || recommendation.symbol}
                  status={recommendation.status}
                  tradeRecommendation={
                    recommendation.tradeRecommendationId === 1
                      ? "Buy"
                      : "Sell"
                  }
                  entryDate={recommendation.createdAt}
                  exitDate={recommendation.exitDate}
                  entry={recommendation.recoPriceLow}
                  target={recommendation.targetOne}
                  stopLoss={recommendation.stopLoss}
                  potential_profits={recommendation.potential_profits}
                  
                  perspective={recommendation.tradeTypeName}
                  token={priceKey}
                  ltp={Number(recommendation.value ?? recommendation.ltp)}
                  prev_close={recommendation.prevClose ?? recommendation.prev_close}
                  exitTypeId={recommendation.exitTypeId}
                  exitPriceLow={recommendation.exitPriceLow}
                  recoPriceLow={recommendation.recoPriceLow}
                  isLocked={
                    Number(currentRole) === 1 &&
                    !allowedScriptTypes.includes(Number(recommendation.scriptTypeId || selectedCategory?.scriptTypeId))
                  }
                  isin={recommendation.isin}
                  tradeable={recommendation.tradeable}
                  exchange={recommendation.exchange}
                />
              );
            })
          )}
        </ScrollView>

      </SafeAreaView>

      {/* <BottomTabBar /> */}
    </>
  );
};

export default TradeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: global.colors.background,
  },
  topSliders: {
    backgroundColor: global.colors.background,
    elevation: 10, // Android shadow
    shadowColor: global.colors.textPrimary,
    shadowOffset: { width: 0, height: 2 }, // bottom direction
    shadowOpacity: 0.2,
    shadowRadius: 3,

    // hide top shadow impact
    marginTop: -3,
    paddingTop: 3,
    marginBottom: 10,
  },

  tradeContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
  },

  filterContainer: {
    display: "flex",
    flexDirection: "row",
    gap: 3,
    justifyContent: "flex-start",
    alignItems: "center",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 30,
  },

  scrollContainer: {
    paddingBottom: 70,
    paddingHorizontal: 12,
  },

  noData: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    color: global.colors.textSecondary,
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
    marginTop: 225,
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
    paddingVertical: 5,
    paddingHorizontal: 10,
  },

  dropdownText: {
    fontSize: 14,
    color: global.colors.textPrimary,
    borderBottomWidth: 0.5,
    borderBottomColor: global.colors.border,
  },

  filterRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  filterLabel: {
    fontSize: 12,
    color: global.colors.textPrimary,
    fontWeight: "600",
  },
});
