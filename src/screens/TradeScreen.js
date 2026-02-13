import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  AppState,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import TopHeader from "../components/TopHeader";
import TopMenuSlider from "../components/TopMenuSlider";
import { useRoute } from '@react-navigation/native';
import { SafeAreaView } from "react-native-safe-area-context";
// import BottomTabBar from '../components/BottomTabBar';
import { Ionicons } from '@expo/vector-icons';
import axiosInstance from "../api/axios";
import GlobalTopMenu from '../components/GlobalTopMenu';
import TradeCard from '../components/Trade/TradeCard';
import { useFocusEffect } from "@react-navigation/native";
import {
  subscribeSymbols,
  unsubscribeDelayed
} from "../ws/marketSubscriptions";
import { useRealtimePrices } from "../hooks/useRealtimePrices";
import GlobalSubTabMenu from "../components/GlobalSubTabMenu";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

const filterOptions = [
  "All",
  "Live",
  "Closed",
  "Target Hit",
  "Target Miss"
];

const TradeScreen = () => {
  const { prices } = useRealtimePrices();
  const route = useRoute();
  const { role } = useAuth();
  const didSubscribeRef = useRef(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedType, setSelectedType] = useState(null)
  // const [tradeRecommendations, setTradeRecommendations] = useState([]);
  // const [tradeCategories, setTradeCategories] = useState([]);
  // const [loadingCategories, setLoadingCategories] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");

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

  const handleFilterSelect = (option) => {
    setSelectedFilter(option);
    setIsFilterOpen(false);
  };
  const getSymbols = () => {
    return Array.from(
      new Set(tradeRecommendations.map((t) => t?.token).filter(Boolean)),
    );
  };

  useFocusEffect(
    useCallback(() => {
      const page = "Ideas";
      const context =
        selectedCategory?.scriptTypeName || selectedCategory?.name || "unknown";

      const symbols = getSymbols();

      if (!symbols.length) {
        console.log(`⏭ SKIP SUBSCRIBE → ${page}::${context} (no symbols)`);
        return;
      }

      console.log(`🟢 SUBSCRIBE → ${page}::${context}`, symbols);
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
    }, [tradeRecommendations, selectedCategory]),
  );

  const {
    data: tradeTypes = [],
  } = useQuery({
    queryKey: ["tradeTypes"],
    queryFn: async () => {
      const res = await axiosInstance.get("/tradetype");
      return res.data.data || [];
    },
    // staleTime: 1000 * 60 * 60,
  });


  const {
    data: tradeCategories = [],
    isLoading: loadingCategories,
  } = useQuery({
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
  });



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


  const {
    data: tradeRecommendations = [],
    isLoading: loadingRecommendations,
  } = useQuery({
    queryKey: [
      "tradeRecommendations",
      selectedCategory?.scriptTypeId,
      selectedFilter,
      selectedType?.tradeTypeId
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
        params.type = selectedType.tradeTypeId
      }

      const res = await axiosInstance.get("/traderecommendation/all", {
        params,
      });

      return res?.data?.data || [];
    },

    enabled: !!selectedCategory,

    // replaces your setInterval
    refetchInterval: 1000,

    refetchIntervalInBackground: true,
  });


  const displayStocks = useMemo(() => {
    return mergeWithRealtime(tradeRecommendations, prices);
  }, [tradeRecommendations, prices]);


  return (
    <>
      <SafeAreaView edges={["bottom"]} style={styles.container}>
        {/* <TopHeader /> */}
        <GlobalTopMenu
          tabs={tradeCategories}
          activeTab={selectedCategory}
          onTabChange={setSelectedCategory}
          showFilter={true}
          filterOptions={filterOptions}
          selectedFilter={selectedFilter}
          onFilterChange={handleFilterSelect}
        />
        <GlobalSubTabMenu
          tabs={tradeTypes}
          activeTab={selectedType}
          onTabChange={setSelectedType}
        />
        {/* <View style={styles.topSliders}>
          <View style={styles.tradeContainer}>
            <TradeTopMenuSlider
              tradeCategory={tradeCategories}
              selectedCategory={selectedCategory}
              onTabChange={(item) => setSelectedCategory(item)}
            />
            <TouchableOpacity
              style={styles.filterContainer}
              onPress={() => setIsFilterOpen(!isFilterOpen)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={selectedFilter !== "All" ? "funnel" : "funnel-outline"}
                size={15}
                color="#000"
                style={{ textShadowColor: "#000", textShadowRadius: 1 }}
              />
              <Text style={{ fontSize: 12 }}>Filter</Text>
            </TouchableOpacity>
          </View>

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
                    <Text style={styles.dropdownText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>

        </View> */}


        {tradeRecommendations.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: global.colors.textSecondary }}>
              No Trade Recommendations Found
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {displayStocks.map((recommendation) => {
              const liveData = prices[recommendation.token];
              return (
                <TradeCard
                  key={recommendation.tradeId}
                  script={recommendation.script_name}
                  script_id={recommendation.script}
                  status={recommendation.status}
                  tradeRecommendation={
                    recommendation.tradeRecommendationId === 1 ? "Buy" : "Sell"
                  }
                  entryDate={recommendation.createdAt}
                  exitDate={recommendation.exitDate}
                  entry={recommendation.recoPriceLow}
                  target={recommendation.targetOne}
                  stopLoss={recommendation.stopLoss}
                  potential_profits={recommendation.potential_profits}
                  perspective={recommendation.tradeTypeName}
                  token={recommendation.token}
                  ltp={Number(recommendation.ltp)}
                  prev_close={recommendation.prev_close}
                  exitTypeId={recommendation.exitTypeId}
                  exitPriceLow={recommendation.exitPriceLow}
                  recoPriceLow={recommendation.recoPriceLow}
                  isLocked={Number(role) === 1}
                />
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* <BottomTabBar /> */}
    </>
  );
};

export default TradeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: global.colors.background
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
    marginBottom: 10
  },

  tradeContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20
  },

  filterContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 3,
    justifyContent: 'flex-start',
    alignItems: 'center',
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
    marginTop: 90,
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
  }
});