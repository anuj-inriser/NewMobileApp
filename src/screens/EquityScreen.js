import React, { useState, useCallback, useEffect, useRef } from "react";
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
import TopHeader from "../components/TopHeader";
// import BottomTabBar from "../components/BottomTabBar";
import MarketTabs from "../components/MarketTabs";
import Indices from "../components/Indices";
import { useRealtimePrices } from "../hooks/useRealtimePrices";
import { apiUrl } from "../utils/apiUrl";
import {
  subscribeSymbols,
  unsubscribeDelayed,
} from "../ws/marketSubscriptions";
import { Ionicons } from "@expo/vector-icons";
import axiosInstance from "../api/axios";
import Swipeable from "react-native-gesture-handler/Swipeable";

const LeftBuyAction = () => (
  <View style={styles.leftAction}>
    <Text style={styles.buyText}>Buy ››</Text>
  </View>
);
// ✅ MarketCapList Component (inline for now)
const MarketCapList = ({ data, exchange, category, navigation, onBuy }) => {
  const handleBuy = (item) => {
    navigation.navigate("Trade", {
      symbol: item.symbol,
      exchange,
      side: "BUY",
    });
  };
  const renderItem = ({ item }) => {
    const isPositive = item.change >= 0;
    const displayChange =
      typeof item.change === "number"
        ? Math.abs(item.change).toFixed(2)
        : "0.00";

    const displayPercent =
      typeof item.changePercent === "number"
        ? Math.abs(item.changePercent).toFixed(2)
        : "0.00";

    // Right swipe action - "View Chart"
    const renderRightActions = () => (
      <View style={styles.rightAction}>
        <Ionicons name="bar-chart-outline" size={20} color={global.colors.background} />
        <Text style={styles.actionText}>Chart</Text>
      </View>
    );

    return (
      <Swipeable
        renderRightActions={renderRightActions}
        onSwipeableRightOpen={() =>
          navigation.navigate("AdvancedChart", {
            symbol: item.symbol,
          })
        }
        overshootRight={false}
      >
        <View style={styles.cardWrapper}>
          <TouchableOpacity style={styles.card} activeOpacity={0.9}
            onPress={() =>
              navigation.navigate("Stocks", {
                exchange,
                from: "Market Cap",
                filterIndex: item.name,
              })
            }
          >
            <View style={styles.infoContainer}>
              <Text style={styles.companyName}>
                {item.symbol}
              </Text>
              <Text style={styles.symbol}>{item.group_name || item.name}</Text>
            </View>

            <View style={styles.verticalCardRight}>
              <Text style={[
                styles.verticalPrice
              ]}>
                ₹{item.value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </Text>

              <Text
                style={[
                  styles.verticalChange,
                  isPositive ? styles.positive : styles.negative,
                ]}
              >
                ₹{displayChange} ({displayPercent}%)
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </Swipeable>
    );
  };

  return (
    <FlatList
      data={data}
      keyExtractor={(item, index) =>
        `${exchange}-${category}-${item.group_name}-${index}`
      }
      renderItem={renderItem}
      contentContainerStyle={styles.marketCapList}
      showsVerticalScrollIndicator={false}
    />
  );
};

// ✅ SectorsList Component
const SectorsList = ({ data, exchange, category, navigation }) => {
  const renderItem = ({ item }) => {
    const isPositive = item.change >= 0;
    const displayChange =
      typeof item.change === "number"
        ? Math.abs(item.change).toFixed(2)
        : "0.00";

    const displayPercent =
      typeof item.changePercent === "number"
        ? Math.abs(item.changePercent).toFixed(2)
        : "0.00";

    // Right swipe action - "View Chart"
    const renderRightActions = () => (
      <View style={styles.rightAction}>
        <Ionicons name="bar-chart-outline" size={24} color={global.colors.background} />
        <Text style={styles.actionText}>Chart</Text>
      </View>
    );

    return (
      <Swipeable
        renderRightActions={renderRightActions}
        onSwipeableRightOpen={() =>
          navigation.navigate("AdvancedChart", {
            symbol: item.symbol,
          })
        }
        overshootRight={false}
      >
        <View style={styles.cardWrapper}>
          <TouchableOpacity
            s style={styles.card} activeOpacity={0.9}
            onPress={() =>
              navigation.navigate("Stocks", {
                exchange,
                from: "Sectors",
                filterIndex: item.name, // e.g., "IT"
              })
            }
          >
            <View style={styles.infoContainer}>
              <Text style={styles.companyName}>
                {item.symbol}
              </Text>
              <Text style={styles.symbol}>{item.group_name || item.name}</Text>
            </View>

            <View style={styles.verticalCardRight}>
              <Text style={styles.verticalPrice}>
                ₹{item.value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </Text>

              <Text
                style={[
                  styles.verticalChange,
                  isPositive ? styles.positive : styles.negative,
                ]}
              >
                ₹{displayChange} ({displayPercent}%)
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </Swipeable>
    );
  };

  return (
    <FlatList
      data={data}
      keyExtractor={(item, index) =>
        `${exchange}-${category}-${item.group_name}-${index}`
      }
      renderItem={renderItem}
      contentContainerStyle={styles.marketCapList}
      showsVerticalScrollIndicator={false}
    />
  );
};

// ✅ ThemesList Component
const ThemesList = ({ data, exchange, category, navigation }) => {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.marketCapItem}
      onPress={() =>
        navigation.navigate("Stocks", {
          exchange,
          from: "Themes",
          filterIndex: item.name, // e.g., "Defence"
        })
      }
    >
      <View>
        <Text style={styles.marketCapName}>{item.name}</Text>
        <Text style={styles.marketCapSymbol}>{exchange}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={data}
      keyExtractor={(item, index) =>
        `${exchange}-${category}-${item.group_name}-${index}`
      }
      renderItem={renderItem}
      contentContainerStyle={styles.marketCapList}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default function EquityScreen() {
  const navigation = useNavigation();
  // const subscribedOnceRef = useRef(false);
  const subscribedRef = useRef({});

  const { prices: realtimePrices } = useRealtimePrices();
  const route = useRoute();
  // const [selectedExchange, setSelectedExchange] = useState("NSE");
  // const [selectedCategory, setSelectedCategory] = useState("Indices");
  const { initialCategory, initialExchange } = route.params || {};
  const [selectedExchange, setSelectedExchange] = useState(
    initialExchange || "NSE"
  );
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory || "Indices"
  );
  const [showPreview, setShowPreview] = useState(true);

  // ✅ Market Cap, Sectors, and Themes States
  const [marketCapData, setMarketCapData] = useState([]);
  const [sectorsData, setSectorsData] = useState([]);
  const [themesData, setThemesData] = useState([]);
  const [isMarketCapLoading, setIsMarketCapLoading] = useState(false);
  const [isSectorsLoading, setIsSectorsLoading] = useState(false);
  const [isThemesLoading, setIsThemesLoading] = useState(false);
  const [marketCapError, setMarketCapError] = useState(null);
  const [sectorsError, setSectorsError] = useState(null);
  const [themesError, setThemesError] = useState(null);

  // ✅ Sort and Filter States
  const [sortOpen, setSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState("Default");
  const [originalMarketCapData, setOriginalMarketCapData] = useState([]);
  const [originalSectorsData, setOriginalSectorsData] = useState([]);
  const [allIndicesData, setAllIndicesData] = useState([]);
  const [originalAllIndicesData, setOriginalAllIndicesData] = useState([]);

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
  }, [route.params]); // ✅ Remove selectedCategory/selectedExchange from deps


  const sortOptions = ["A-Z", "Z-A", "High-Low", "Low-High"];

  // Get filter options based on selected category
  const getFilterOptions = () => {
    if (selectedCategory === "Market Cap" || selectedCategory === "Indices" || selectedCategory === "Sectors") {
      return ["All", "High Gainers", "High Losers"];
    }
    return ["All"];
  };

  const filterOptions = getFilterOptions();

  // ✅ Swipe Navigation Setup - Using touch tracking instead of PanResponder
  const swipeCategories = ["Indices", "Market Cap", "Sectors"];
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
      console.log("Swiping left to:", swipeCategories[currentIndex + 1]);
      setSelectedCategory(swipeCategories[currentIndex + 1]);
      setShowPreview(false);
    }
    // Swipe right (distance < -50): Move to previous tab (left to right motion)
    else if (distance < -50 && currentIndex > 0) {
      console.log("Swiping right to:", swipeCategories[currentIndex - 1]);
      setSelectedCategory(swipeCategories[currentIndex - 1]);
      setShowPreview(false);
    }
  };

  const handleBuyFromHome = useCallback(
    (item) => {
      console.log("item", item);
      navigation.navigate("TradeOrder", {
        symbol: item.sumbol,
        token: item.token,
        name: item.name,
        internaltype: "Place",
      });
    },
    [navigation, selectedExchange]
  );

  const getCurrentSymbols = () => {
    if (!Array.isArray(allData)) return [];

    if (selectedCategory === "Indices") {
      return allData.map(i => i.symbol || i.name).filter(Boolean);
    }
    if (selectedCategory === "Indices") {
      return allData.map((i) => i.symbol || i.name);
    }

    if (selectedCategory === "Market Cap") {
      return marketCapData.map((i) => i.symbol || i.group_name);
    }

    if (selectedCategory === "Sectors") {
      return sectorsData.map((i) => i.symbol || i.group_name);
    }

    if (selectedCategory === "Themes") {
      return themesData.map((i) => i.symbol || i.name);
    }

    return [];
  };
  useFocusEffect(
    useCallback(() => {
      let backPressCount = 0;
      let timeout;

      const onBackPress = () => {
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
    }, [])
  );

  // useFocusEffect(
  //   useCallback(() => {
  //     let backPressCount = 0;
  //     let timeout;

  //     const onBackPress = () => {
  //       if (backPressCount === 0) {
  //         backPressCount = 1;
  //         ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);
  //         timeout = setTimeout(() => {
  //           backPressCount = 0;
  //         }, 2000);
  //         return true; // prevent exit
  //       } else {
  //         clearTimeout(timeout);
  //         BackHandler.exitApp(); // ✅ exits app
  //         return false;
  //       }
  //     };

  //     const backHandler = BackHandler.addEventListener(
  //       "hardwareBackPress",
  //       onBackPress
  //     );

  //     return () => {
  //       backHandler.remove();
  //       clearTimeout(timeout);
  //     };
  //   }, [])
  // );
  useFocusEffect(
    useCallback(() => {
      const page = "EquityScreen";
      const context = selectedCategory; // 🔥 VERY IMPORTANT
      const symbols = getCurrentSymbols();

      if (!symbols.length) return;

      // 🟢 Screen active → subscribe
      subscribeSymbols(symbols, page, context);

      const appStateSub = AppState.addEventListener("change", (state) => {
        if (state !== "active") {
          // ⏱ app background → delayed unsubscribe
          unsubscribeDelayed(symbols, page, context);
        } else {
          // 🔄 app foreground again → cancel unsubscribe
          subscribeSymbols(symbols, page, context);
        }
      });

      return () => {
        // 🚫 screen blur (navigate away OR tab switch)
        // ❗ direct unsubscribe nahi, sirf delay
        unsubscribeDelayed(symbols, page, context);
        appStateSub?.remove();
      };
    }, [
      selectedCategory,
      selectedExchange,
      allData,
      marketCapData,
      sectorsData,
      themesData,
    ])
  );
  useEffect(() => {
    const symbols = allData.map(i => i.symbol).filter(Boolean);
    if (!symbols.length) return;

    const key = `${selectedCategory}-${selectedExchange}`;
    if (subscribedRef.current[key]) return;

    subscribeSymbols(symbols, "EquityScreen", selectedCategory);
    subscribedRef.current[key] = true;

    return () => {
      unsubscribeDelayed(symbols, "EquityScreen", selectedCategory);
    };
  }, [allData, selectedCategory, selectedExchange]);

  // useEffect(() => {
  //   if (subscribedOnceRef.current) return;

  //   const symbols = getCurrentSymbols();
  //   if (!symbols.length) return;

  //   const page = "EquityScreen";
  //   const context = selectedCategory;

  //   console.log("🚀 AUTO SUBSCRIBE (DATA READY)", symbols);

  //   subscribeSymbols(symbols, page, context);
  //   subscribedOnceRef.current = true;
  // }, [
  //   selectedCategory,
  //   selectedExchange,
  //   allData,
  //   marketCapData,
  //   sectorsData,
  //   themesData,
  // ]);


  useEffect(() => {
    const symbols = allData.map(i => i.symbol).filter(Boolean);
    if (!symbols.length) return;

    const key = `${selectedCategory}-${selectedExchange}`;
    if (subscribedRef.current[key]) return;

    subscribeSymbols(symbols, "EquityScreen", selectedCategory);
    subscribedRef.current[key] = true;

    return () => {
      unsubscribeDelayed(symbols, "EquityScreen", selectedCategory);
    };
  }, [allData, selectedCategory, selectedExchange]);

  // ✅ Fetch Market Cap Data
  const fetchMarketCap = useCallback(async (exchange) => {
    setIsMarketCapLoading(true);
    setMarketCapError(null);
    try {
      const url =
        exchange === "BSE"
          ? `/indicesNew/bsemarketcap`
          : `/indicesNew/nsemarketcap`;
      const response = await axiosInstance.get(url);
      if (!response.status) throw new Error(`HTTP ${response.status}`);
      const result = response.data;
      const data = result.data || [];
      setMarketCapData(data);
      setOriginalMarketCapData(data);
      setSelectedSort("Default");
    } catch (err) {
      setMarketCapError(err.message || "Failed to load market cap data");
    } finally {
      setIsMarketCapLoading(false);
    }
  }, []);

  // ✅ Fetch Sectors Data
  const fetchSectors = useCallback(async (exchange) => {
    setIsSectorsLoading(true);
    setSectorsError(null);
    try {
      const url =
        exchange === "BSE"
          ? `/indicesNew/bsesector`
          : `/indicesNew/nsesector`;
      // const response = await fetch(url);
      const response = await axiosInstance.get(url)
      if (!response.status) throw new Error(`HTTP ${response.status}`);
      const result = response.data;
      const data = result.data || [];
      setSectorsData(data);
      setOriginalSectorsData(data);
      setSelectedSort("Default");
    } catch (err) {
      setSectorsError(err.message || "Failed to load sectors data");
    } finally {
      setIsSectorsLoading(false);
    }
  }, []);

  // ✅ Fetch Themes Data
  const fetchThemes = useCallback(async (exchange) => {
    setIsThemesLoading(true);
    setThemesError(null);
    try {
      const url =
        exchange === "BSE"
          ? `/indicesNew/bsetheme`
          : `/indicesNew/nsetheme`;
      // const response = await fetch(url);
      const response = await axiosInstance.get(url)
      if (!response.status) throw new Error(`HTTP ${response.status}`);
      const result = response.data;
      setThemesData(result.data || []);
    } catch (err) {
      setThemesError(err.message || "Failed to load themes data");
    } finally {
      setIsThemesLoading(false);
    }
  }, []);

  // ✅ Initialize Original Indices Data when allData loads
  // useEffect(() => {
  //   if (allData && allData.length > 0) {
  //     setOriginalAllIndicesData(allData);
  //     setAllIndicesData(allData);
  //   }
  // }, [allData]);

  // useEffect(() => {
  //   setAllIndicesData(allData);
  //   setOriginalAllIndicesData(allData);
  // }, [allData, selectedExchange]);


  // ✅ Refetch Market Cap, Sectors, and Themes when exchange changes & tab is active
  useEffect(() => {
    if (selectedCategory === "Market Cap") {
      fetchMarketCap(selectedExchange);
    } else if (selectedCategory === "Sectors") {
      fetchSectors(selectedExchange);
    } else if (selectedCategory === "Themes") {
      fetchThemes(selectedExchange);
    }
  }, [
    selectedExchange,
    selectedCategory,
    fetchMarketCap,
    fetchSectors,
    fetchThemes,
  ]);

  // ✅ Indices Fetch (unchanged)
  const fetchIndices = async ({ queryKey }) => {
    const [, exchange] = queryKey;
    const url =
      exchange === "BSE"
        ? `/indicesNew/bse`
        : `/indicesNew/nse`;

    // const response = await fetch(url);
    const response = await axiosInstance.get(url)
    if (!response.status) throw new Error(`API failed: ${response.status}`);
    const result = response.data;
    return result.data; // must be array
  };



  // const { data: allData = [], isLoading: loading } = useQuery({
  //   queryKey: ["indices", selectedExchange],
  //   queryFn: fetchIndices,
  //   retry: false,
  //   refetchOnMount: true,
  //   refetchOnWindowFocus: false,

  //   onSuccess: (data) => {
  //     if (subscribedOnceRef.current) return;
  //     if (!data?.length) return;

  //     const symbols = data.map((i) => i.symbol || i.name).filter(Boolean);
  //     if (!symbols.length) return;

  //     console.log("🚀 LOGIN AUTO SUBSCRIBE (INDICES)", symbols);

  //     subscribeSymbols(symbols, "EquityScreen", "Indices");
  //     subscribedOnceRef.current = true;
  //   },
  // });

  const indicesQuery = useQuery({
    queryKey: ["indices", selectedExchange],
    queryFn: fetchIndices,
    retry: false,
    staleTime: 0,                 // 🔥 force fresh
    refetchOnMount: "always",     // 🔥 ALWAYS fire
    refetchOnWindowFocus: false,
  });
  const allData = indicesQuery.data || [];
  const loading = indicesQuery.isLoading;
  useEffect(() => {
    if (allData && allData.length > 0) {
      setAllIndicesData(allData);
      setOriginalAllIndicesData(allData);
    }
  }, [allData, selectedExchange]);


  // ✅ Handlers
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setShowPreview(false);

    if (
      category === "Market Cap" &&
      marketCapData.length === 0 &&
      !isMarketCapLoading
    ) {
      fetchMarketCap(selectedExchange);
    }

    if (
      category === "Sectors" &&
      sectorsData.length === 0 &&
      !isSectorsLoading
    ) {
      fetchSectors(selectedExchange);
    }

    if (
      category === "Themes" &&
      themesData.length === 0 &&
      !isThemesLoading
    ) {
      fetchThemes(selectedExchange);
    }
  };

  const handleExchangeChange = (exchange) => setSelectedExchange(exchange);

  // ✅ Sort Logic
  const applySortToData = (sortType, data) => {
    let sorted = [...data];

    if (sortType === "A-Z") {
      sorted.sort((a, b) => {
        const nameA = (a.group_name || a.name || "").toUpperCase();
        const nameB = (b.group_name || b.name || "").toUpperCase();
        return nameA.localeCompare(nameB);
      });
    } else if (sortType === "Z-A") {
      sorted.sort((a, b) => {
        const nameA = (a.group_name || a.name || "").toUpperCase();
        const nameB = (b.group_name || b.name || "").toUpperCase();
        return nameB.localeCompare(nameA);
      });
    } else if (sortType === "High-Low") {
      sorted.sort((a, b) => Number(b.ltp || 0) - Number(a.ltp || 0));
    } else if (sortType === "Low-High") {
      sorted.sort((a, b) => Number(a.ltp || 0) - Number(b.ltp || 0));
    }

    return sorted;
  };

  const handleSort = (sortType) => {
    setSelectedSort(sortType);
    setSortOpen(false);

    if (selectedCategory === "Market Cap") {
      setMarketCapData(applySortToData(sortType, originalMarketCapData));
    } else if (selectedCategory === "Sectors") {
      setSectorsData(applySortToData(sortType, originalSectorsData));
    } else if (selectedCategory === "Indices") {
      setAllIndicesData(applySortToData(sortType, originalAllIndicesData));
    }
  };

  const handleFilterByType = (filterType) => {
    setIsFilterOpen(false);

    if (selectedCategory === "Market Cap") {
      let filtered = [...originalMarketCapData];

      if (filterType === "High Gainers") {
        // Filter market caps with positive change (high gainers)
        filtered = filtered.filter((item) => {
          const ltp = realtimePrices[item.symbol]?.ltp || item.ltp || 0;
          const oi = realtimePrices[item.symbol]?.oi || item.oi || item.close || 0;
          const change = ((ltp - oi) / oi) * 100;
          return change > 0;
        });
        // Sort by change descending
        filtered.sort((a, b) => {
          const ltpA = realtimePrices[a.symbol]?.ltp || a.ltp || 0;
          const oiA = realtimePrices[a.symbol]?.oi || a.oi || a.close || 0;
          const changeA = ((ltpA - oiA) / oiA) * 100;

          const ltpB = realtimePrices[b.symbol]?.ltp || b.ltp || 0;
          const oiB = realtimePrices[b.symbol]?.oi || b.oi || b.close || 0;
          const changeB = ((ltpB - oiB) / oiB) * 100;

          return changeB - changeA;
        });
      } else if (filterType === "High Losers") {
        // Filter market caps with negative change (high losers)
        filtered = filtered.filter((item) => {
          const ltp = realtimePrices[item.symbol]?.ltp || item.ltp || 0;
          const oi = realtimePrices[item.symbol]?.oi || item.oi || item.close || 0;
          const change = ((ltp - oi) / oi) * 100;
          return change < 0;
        });
        // Sort by change ascending (most negative first)
        filtered.sort((a, b) => {
          const ltpA = realtimePrices[a.symbol]?.ltp || a.ltp || 0;
          const oiA = realtimePrices[a.symbol]?.oi || a.oi || a.close || 0;
          const changeA = ((ltpA - oiA) / oiA) * 100;

          const ltpB = realtimePrices[b.symbol]?.ltp || b.ltp || 0;
          const oiB = realtimePrices[b.symbol]?.oi || b.oi || b.close || 0;
          const changeB = ((ltpB - oiB) / oiB) * 100;

          return changeA - changeB;
        });
      } else {
        // "All" - reset to original
        filtered = originalMarketCapData;
      }

      setMarketCapData(filtered);
    } else if (selectedCategory === "Indices") {
      let filtered = [...originalAllIndicesData];

      if (filterType === "High Gainers") {
        // Filter indices with positive change (high gainers)
        filtered = filtered.filter((item) => {
          const ltp = realtimePrices[item.symbol]?.ltp || item.ltp || 0;
          const oi = realtimePrices[item.symbol]?.oi || item.oi || item.close || 0;
          const change = ((ltp - oi) / oi) * 100;
          return change > 0;
        });
        // Sort by change descending
        filtered.sort((a, b) => {
          const ltpA = realtimePrices[a.symbol]?.ltp || a.ltp || 0;
          const oiA = realtimePrices[a.symbol]?.oi || a.oi || a.close || 0;
          const changeA = ((ltpA - oiA) / oiA) * 100;

          const ltpB = realtimePrices[b.symbol]?.ltp || b.ltp || 0;
          const oiB = realtimePrices[b.symbol]?.oi || b.oi || b.close || 0;
          const changeB = ((ltpB - oiB) / oiB) * 100;

          return changeB - changeA;
        });
      } else if (filterType === "High Losers") {
        // Filter indices with negative change (high losers)
        filtered = filtered.filter((item) => {
          const ltp = realtimePrices[item.symbol]?.ltp || item.ltp || 0;
          const oi = realtimePrices[item.symbol]?.oi || item.oi || item.close || 0;
          const change = ((ltp - oi) / oi) * 100;
          return change < 0;
        });
        // Sort by change ascending (most negative first)
        filtered.sort((a, b) => {
          const ltpA = realtimePrices[a.symbol]?.ltp || a.ltp || 0;
          const oiA = realtimePrices[a.symbol]?.oi || a.oi || a.close || 0;
          const changeA = ((ltpA - oiA) / oiA) * 100;

          const ltpB = realtimePrices[b.symbol]?.ltp || b.ltp || 0;
          const oiB = realtimePrices[b.symbol]?.oi || b.oi || b.close || 0;
          const changeB = ((ltpB - oiB) / oiB) * 100;

          return changeA - changeB;
        });
      } else {
        // "All" - reset to original
        filtered = originalAllIndicesData;
      }

      setAllIndicesData(filtered);
    } else if (selectedCategory === "Sectors") {
      let filtered = [...originalSectorsData];

      if (filterType === "High Gainers") {
        // Filter sectors with positive change (high gainers)
        filtered = filtered.filter((item) => {
          const ltp = realtimePrices[item.symbol]?.ltp || item.ltp || 0;
          const oi = realtimePrices[item.symbol]?.oi || item.oi || item.close || 0;
          const change = ((ltp - oi) / oi) * 100;
          return change > 0;
        });
        // Sort by change descending
        filtered.sort((a, b) => {
          const ltpA = realtimePrices[a.symbol]?.ltp || a.ltp || 0;
          const oiA = realtimePrices[a.symbol]?.oi || a.oi || a.close || 0;
          const changeA = ((ltpA - oiA) / oiA) * 100;

          const ltpB = realtimePrices[b.symbol]?.ltp || b.ltp || 0;
          const oiB = realtimePrices[b.symbol]?.oi || b.oi || b.close || 0;
          const changeB = ((ltpB - oiB) / oiB) * 100;

          return changeB - changeA;
        });
      } else if (filterType === "High Losers") {
        // Filter sectors with negative change (high losers)
        filtered = filtered.filter((item) => {
          const ltp = realtimePrices[item.symbol]?.ltp || item.ltp || 0;
          const oi = realtimePrices[item.symbol]?.oi || item.oi || item.close || 0;
          const change = ((ltp - oi) / oi) * 100;
          return change < 0;
        });
        // Sort by change ascending (most negative first)
        filtered.sort((a, b) => {
          const ltpA = realtimePrices[a.symbol]?.ltp || a.ltp || 0;
          const oiA = realtimePrices[a.symbol]?.oi || a.oi || a.close || 0;
          const changeA = ((ltpA - oiA) / oiA) * 100;

          const ltpB = realtimePrices[b.symbol]?.ltp || b.ltp || 0;
          const oiB = realtimePrices[b.symbol]?.oi || b.oi || b.close || 0;
          const changeB = ((ltpB - oiB) / oiB) * 100;

          return changeA - changeB;
        });
      } else {
        // "All" - reset to original
        filtered = originalSectorsData;
      }

      setSectorsData(filtered);
    }
  };

  const handleViewAllIndices = () => {
    setSelectedCategory("Indices");
    setShowPreview(false);
  };

  const handleIndexPress = (index) => {
    navigation.navigate("Stocks", {
      exchange: selectedExchange,
      from: "Indices",
      filterIndex: index.name,
    });
  };

  // ✅ Swipe right → View chart directly
  const handleSwipeToChart = (index) => {
    navigation.navigate("AdvancedChart", {
      symbol: index.symbol,
    });
  };

  // const getDataForCategory = () => {
  //   if (selectedCategory === "Indices") return allIndicesData;
  //   return [];
  // };

  // ✅ Render Content
  const renderContent = () => {
    // Market Cap Loading
    if (selectedCategory === "Market Cap" && isMarketCapLoading) {
      return (
        <View style={styles.placeholderContainer}>
          <ActivityIndicator size="large" color={global.colors.overlay} />
          <Text style={styles.loadingText}>
            Loading {selectedExchange} market cap...
          </Text>
        </View>
      );
    }

    // Market Cap Error
    if (selectedCategory === "Market Cap" && marketCapError) {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={styles.errorText}>⚠️ {marketCapError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchMarketCap(selectedExchange)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Market Cap Success
    if (selectedCategory === "Market Cap") {
      if (marketCapData.length === 0) {
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>
              No {selectedExchange} market cap data
            </Text>
          </View>
        );
      }
      const marketCapWithRealtime = mergeWithRealtime(
        marketCapData.map((item) => {
          const value = Number(item.ltp || 0);
          const prevClose = Number(item.prev_close || 0);
          const change = prevClose > 0 ? value - prevClose : 0;
          const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

          return {
            symbol: item.symbol || item.group_name,
            name: item.group_name,
            value,
            prevClose,
            change,
            changePercent,
            timestamp: new Date().toISOString(),
          };
        }),
        realtimePrices
      );

      return (
        <MarketCapList
          data={marketCapWithRealtime}
          exchange={selectedExchange}
          category={selectedCategory}
          navigation={navigation}
          onBuy={handleBuyFromHome}
        />
      );
    }

    // Sectors Loading
    if (selectedCategory === "Sectors" && isSectorsLoading) {
      return (
        <View style={styles.placeholderContainer}>
          <ActivityIndicator size="large" color={global.colors.overlay} />
          <Text style={styles.loadingText}>
            Loading {selectedExchange} sectors...
          </Text>
        </View>
      );
    }

    // Sectors Error
    if (selectedCategory === "Sectors" && sectorsError) {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={styles.errorText}>⚠️ {sectorsError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchSectors(selectedExchange)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Sectors Success
    if (selectedCategory === "Sectors") {
      if (sectorsData.length === 0) {
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>
              No {selectedExchange} sector data
            </Text>
          </View>
        );
      }
      const sectorsWithRealtime = mergeWithRealtime(
        sectorsData.map((item) => {
          const value = Number(item.ltp || 0);
          const prevClose = Number(item.prev_close || 0);
          const change = prevClose > 0 ? value - prevClose : 0;
          const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

          return {
            symbol: item.symbol || item.group_name,
            name: item.group_name,
            value,
            prevClose,
            change,
            changePercent,
            timestamp: new Date().toISOString(),
          };
        }),
        realtimePrices
      );

      return (
        <SectorsList
          data={sectorsWithRealtime}
          exchange={selectedExchange}
          category={selectedCategory}
          navigation={navigation}
        />
      );
    }

    // Themes Loading
    if (selectedCategory === "Themes" && isThemesLoading) {
      return (
        <View style={styles.placeholderContainer}>
          <ActivityIndicator size="large" color={global.colors.overlay} />
          <Text style={styles.loadingText}>
            Loading {selectedExchange} themes...
          </Text>
        </View>
      );
    }

    // Themes Error
    if (selectedCategory === "Themes" && themesError) {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={styles.errorText}>⚠️ {themesError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchThemes(selectedExchange)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Themes Success
    if (selectedCategory === "Themes") {
      if (themesData.length === 0) {
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>
              No {selectedExchange} theme data
            </Text>
          </View>
        );
      }
      return (
        <ThemesList
          data={themesData}
          exchange={selectedExchange}
          category={selectedCategory}
          navigation={navigation}
        />
      );
    }

    // Indices Success
    // if (selectedCategory === "Indices") {
    //   const data = getDataForCategory();
    //   return (
    //     <Indices
    //       exchange={selectedExchange}
    //       viewMode={showPreview ? "horizontal" : "vertical"}
    //       onViewAllPress={handleViewAllIndices}
    //       onIndexPress={handleIndexPress}
    //       onSwipeToChart={handleSwipeToChart}
    //       externalData={data}
    //       maxItems={showPreview ? 5 : undefined}
    //     />
    //   );
    // }

    if (selectedCategory === "Indices") {
      return (
        <Indices
          exchange={selectedExchange}
          viewMode={showPreview ? "horizontal" : "vertical"}
          onViewAllPress={handleViewAllIndices}
          onIndexPress={handleIndexPress}
          onSwipeToChart={handleSwipeToChart}
          externalData={allIndicesData}
          maxItems={showPreview ? 5 : undefined}
        />
      );
    }


    // Other Tabs (Sectors, Themes, etc.)
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>
          {selectedCategory} coming soon...
        </Text>
      </View>
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
          additionalTabs={["Sectors", "Themes"]} // Adding "Sectors" and "Themes" to the tabs
        />

        {/* Sort & Filter Bar for Market Cap, Sectors, and Indices */}
        {(selectedCategory === "Market Cap" || selectedCategory === "Sectors" || selectedCategory === "Indices") && (
          <View style={styles.sortFilterBar}>
            {/* Back Button for Market Cap and Sectors - LEFT */}
            {selectedCategory !== "Indices" && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setSelectedCategory("Indices");
                  setShowPreview(false);
                }}
              >
                <Ionicons name="arrow-back" size={22} color={global.colors.secondary} />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}

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
    const rt = realtimePrices[item.symbol];
    if (!rt) return item;

    const prevClose = item.prevClose || rt.prevClose || rt.open || item.value;

    const change = rt.price - prevClose;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return {
      ...item,
      value: rt.price,
      change,
      changePercent,
      timestamp: rt.timestamp,
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
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
  price: { fontSize: 15, fontWeight: "600", color: global.colors.textPrimary },
  change: { fontSize: 12, fontWeight: "600", marginTop: 4 },
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

  // Sort & Filter Bar
  sortFilterBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
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
    color: "#000",
    fontWeight: "600",
  },

  // Overlay and Dropdown
  overlay: {
    flex: 1,
    backgroundColor: global.colors.overlay,
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
    elevation: 2,
  },
  infoContainer: { flex: 1 },
  companyName: { fontSize: 14, fontWeight: "600" },
  symbol: { fontSize: 11, color: global.colors.textSecondary },
});