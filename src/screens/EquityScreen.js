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
import TopHeader from "../components/TopHeader";
// import BottomTabBar from "../components/BottomTabBar";
import MarketTabs from "../components/MarketTabs";
import Indices from "../components/Indices";
import { useRealtimePrices } from "../hooks/useRealtimePrices";
import {
  subscribeSymbols,
  unsubscribeDelayed,
} from "../ws/marketSubscriptions";
import { Ionicons } from "@expo/vector-icons";
import axiosInstance from "../api/axios";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { useDrawer } from "../context/DrawerContext";
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import SparklineChart from "../components/Sparkline";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";


const Sparkline = ({ color, isPositive }) => {
  // A simple smooth curve that either goes up or down
  const curveD = isPositive
    ? "M 0 35 C 20 35, 30 25, 45 25 S 60 5, 80 0 L 80 40 L 0 40 Z"
    : "M 0 5 C 20 5, 30 15, 45 15 S 60 35, 80 40 L 80 40 L 0 40 Z";

  const lineD = isPositive
    ? "M 0 35 C 20 35, 30 25, 45 25 S 60 5, 80 0"
    : "M 0 5 C 20 5, 30 15, 45 15 S 60 35, 80 40";

  return (
    <Svg width="80" height="40" viewBox="0 0 80 40">
      <Defs>
        <SvgLinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.3" />
          <Stop offset="1" stopColor={color} stopOpacity="0.0" />
        </SvgLinearGradient>
      </Defs>
      <Path d={curveD} fill="url(#grad)" />
      <Path d={lineD} fill="none" stroke={color} strokeWidth="2" />
    </Svg>
  );
};

const LeftBuyAction = () => (
  <View style={styles.leftAction}>
    <Text style={styles.buyText}>Buy ››</Text>
  </View>
);
// ✅ MarketCapList Component (inline for now)
const MarketCapList = ({ data, exchange, category, navigation, onBuy, refreshing,
  onRefresh, }) => {
  const renderItem = ({ item }) => {
    // const isPositive = item.change >= 0;
    // const color = isPositive ? global.colors.success : global.colors.error;

    const isPositive = item.change > 0;

    let color = global.colors.textSecondary; // grey for 0

    if (item.change > 0) {
      color = global.colors.success;
    } else if (item.change < 0) {
      color = global.colors.error;
    }

    return (
      <TouchableOpacity
        style={styles.marketCapItem}
        onPress={() =>
          navigation.navigate("Stocks", {
            exchange,
            from: "Market Cap",
            filterIndex: item.name,
            headerData: item,
            headerCategory: "Market Cap"
          })
        }
      >
        <View style={styles.infoContainer}>
          <Text style={styles.marketCapName}>{item.name}</Text>
          <Text style={styles.marketCapSymbol}>{item.symbol}</Text>
        </View>
        <SparklineChart symbol={item.symbol} color={color} />
        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            ₹{Number(item.value || 0).toLocaleString("en-IN", {
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
      keyExtractor={(item, index) =>
        `${exchange}-${category}-${item.group_name}-${index}`
      }
      renderItem={renderItem}
      contentContainerStyle={styles.marketCapList}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
};

// ✅ SectorsList Component
const SectorsList = ({ data, exchange, category, navigation, refreshing, onRefresh }) => {
  const renderItem = ({ item }) => {
    // const isPositive = item.change >= 0;
    // const color = isPositive ? global.colors.success : global.colors.error;

    const isPositive = item.change > 0;

    let color = global.colors.textSecondary; // grey for 0

    if (item.change > 0) {
      color = global.colors.success;
    } else if (item.change < 0) {
      color = global.colors.error;
    }
    return (
      <TouchableOpacity
        style={styles.marketCapItem}
        onPress={() =>
          navigation.navigate("Stocks", {
            exchange,
            from: "Sectors",
            filterIndex: item.name,
            headerData: item,
            headerCategory: "Sectors"
          })
        }
      >
        <View style={styles.infoContainer}>
          <Text style={styles.marketCapName}>{item.name}</Text>
          <Text style={styles.marketCapSymbol}>{item.symbol}</Text>
        </View>
        <SparklineChart symbol={item.symbol} color={color} />
        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            ₹{Number(item.value || 0).toLocaleString("en-IN", {
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
      keyExtractor={(item, index) =>
        `${exchange}-${category}-${item.group_name}-${index}`
      }
      renderItem={renderItem}
      contentContainerStyle={[styles.marketCapList, { paddingBottom: 80 }]}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
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
      contentContainerStyle={[styles.marketCapList, { paddingBottom: 80 }]}
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
      if (selectedCategory === "Sectors")
        await fetchSectors(selectedExchange)
      else if (selectedCategory === "Market Cap")
        await fetchMarketCap()
      else if (selectedCategory === "Themes")
        await fetchThemes()
      else if (selectedCategory === "Indices") {
        await indicesQuery.refetch()
      }

    } catch (error) {

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
    if (selectedCategory === "Market Cap" || selectedCategory === "Indices" || selectedCategory === "Sectors") {
      return ["All", "Gainers", "Losers"];
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
      setSelectedCategory(swipeCategories[currentIndex + 1]);
      setShowPreview(false);
    }
    // Swipe right (distance < -50): Move to previous tab (left to right motion)
    else if (distance < -50 && currentIndex > 0) {
      setSelectedCategory(swipeCategories[currentIndex - 1]);
      setShowPreview(false);
    }
  };

  const handleBuyFromHome = useCallback(
    (item) => {
      navigation.navigate("TradeOrder", {
        symbol: item.sumbol,
        token: item.token,
        name: item.name,
        internaltype: "Place",
      });
    },
    [navigation, selectedExchange]
  );
  const getCurrentTokens = () => {
    if (selectedCategory === "Indices") {
      return allData.map((i) => i.token).filter(Boolean);
    }

    if (selectedCategory === "Market Cap") {
      return marketCapData.map((i) => i.token).filter(Boolean);
    }

    if (selectedCategory === "Sectors") {
      return sectorsData.map((i) => i.token).filter(Boolean);
    }

    if (selectedCategory === "Themes") {
      return themesData.map((i) => i.token).filter(Boolean);
    }

    return [];
  };
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
  //  useFocusEffect(
  //   useCallback(() => {
  //     const page = "EquityScreen";
  //     const context = selectedCategory; // 🔥 VERY IMPORTANT
  //     const symbols = getCurrentSymbols();

  //     if (!symbols.length) return;

  //     // 🟢 Screen active → subscribe
  //     console.log("[Subscribe] Tokens on focus:", symbols); // <-- log here
  //     subscribeSymbols(symbols, page, context);

  //     const appStateSub = AppState.addEventListener("change", (state) => {
  //       if (state !== "active") {
  //         // ⏱ app background → delayed unsubscribe
  //         unsubscribeDelayed(symbols, page, context);
  //       } else {
  //         // 🔄 app foreground again → cancel unsubscribe
  //         console.log("[Resubscribe] Tokens on foreground:", symbols); // <-- log here
  //         subscribeSymbols(symbols, page, context);
  //       }
  //     });

  //     return () => {
  //       // 🚫 screen blur (navigate away OR tab switch)
  //       // ❗ direct unsubscribe nahi, sirf delay
  //       console.log("[Unsubscribe delayed] Tokens:", symbols); // <-- log here
  //       unsubscribeDelayed(symbols, page, context);
  //       appStateSub?.remove();
  //     };
  //   }, [
  //     selectedCategory,
  //     selectedExchange,
  //     allData,
  //     marketCapData,
  //     sectorsData,
  //     themesData,
  //   ])
  // );

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
      marketCapData,
      sectorsData,
      themesData,
    ])
  );
  // useEffect(() => {
  //   const symbols = allData.map((i) => i.symbol).filter(Boolean);
  //   if (!symbols.length) return;

  //   const key = `${selectedCategory}-${selectedExchange}`;
  //   if (subscribedRef.current[key]) return;

  //   console.log("[Subscribe Effect] Tokens:", symbols); // <-- log here
  //   subscribeSymbols(symbols, "EquityScreen", selectedCategory);
  //   subscribedRef.current[key] = true;

  //   return () => {
  //     console.log("[Unsubscribe Effect delayed] Tokens:", symbols); // <-- log here
  //     unsubscribeDelayed(symbols, "EquityScreen", selectedCategory);
  //   };
  // }, [allData, selectedCategory, selectedExchange]);
  // useEffect(() => {
  //   if (subscribedOnceRef.current) return;

  //   const symbols = getCurrentSymbols();
  //   if (!symbols.length) return;

  //   const page = "EquityScreen";
  //   const context = selectedCategory;


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


  // useEffect(() => {
  //   const symbols = allData.map(i => i.symbol).filter(Boolean);
  //   if (!symbols.length) return;

  //   const key = `${selectedCategory}-${selectedExchange}`;
  //   if (subscribedRef.current[key]) return;

  //   subscribeSymbols(symbols, "EquityScreen", selectedCategory);
  //   subscribedRef.current[key] = true;

  //   return () => {
  //     unsubscribeDelayed(symbols, "EquityScreen", selectedCategory);
  //   };
  // }, [allData, selectedCategory, selectedExchange]);



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

  // ✅ Indices Fetch 

  const fetchIndices = async ({ queryKey: [, exchange] }) => {
    try {
      const url =
        exchange === "BSE"
          ? "/indicesNew/bse"
          : "/indicesNew/nse";

      const response = await axiosInstance.get(url);

      return response.data.data;

    } catch (error) {
      console.error(
        error?.response?.data?.message || "Error fetching indices"
      );
      throw error;
    }
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
  // ✅ Stable reference: useMemo prevents new [] on every render (infinite loop fix)
  const allData = useMemo(() => indicesQuery.data ?? [], [indicesQuery.data]);
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
  // const applySortToData = (sortType, data) => {
  //   let sorted = [...data];

  //   const getChangePercent = (item) => {
  //     const value = Number(item.ltp || 0);
  //     console.log("value", value)
  //     const prevClose = Number(item.prev_close || 0);
  //     console.log("prev", prevClose)
  //     const change = prevClose > 0 ? value - prevClose : 0;
  //     console.log("change", change)
  //     const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
  //     console.log("percent ", changePercent)
  //     return changePercent;
  //   };

  //   if (sortType === "A-Z") {
  //     sorted.sort((a, b) => {
  //       const nameA = (a.symbol || "").toUpperCase();
  //       const nameB = (b.symbol || "").toUpperCase();
  //       return nameA.localeCompare(nameB);
  //     });
  //   } else if (sortType === "Z-A") {
  //     sorted.sort((a, b) => {
  //       const nameA = (a.symbol || "").toUpperCase();
  //       const nameB = (b.symbol || "").toUpperCase();
  //       return nameB.localeCompare(nameA);
  //     });
  //   }
  //   if (sortType === "High-Low") {
  //     sorted.sort((a, b) => getChangePercent(a) - getChangePercent(b));
  //   }
  //   else if (sortType === "Low-High") {
  //     sorted.sort((a, b) => getChangePercent(b) - getChangePercent(a));
  //   }

  //   return sorted;
  // };

  const applySortToData = (sortType, data) => {
    let sorted = [...data];

    const getChangePercent = (item) => {
      const value = Number(item.ltp || 0);
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
      }

      else if (filterType === "Losers") {
        filtered = filtered
          .filter((item) => getChangePercent(item) < 0)
          .sort((a, b) => getChangePercent(a) - getChangePercent(b));
      }

      return filtered;
    };

    if (selectedCategory === "Market Cap") {
      setMarketCapData(
        filterType === "All"
          ? originalMarketCapData
          : processData(originalMarketCapData)
      );
    }

    else if (selectedCategory === "Indices") {
      setAllIndicesData(
        filterType === "All"
          ? originalAllIndicesData
          : processData(originalAllIndicesData)
      );
    }

    else if (selectedCategory === "Sectors") {
      setSectorsData(
        filterType === "All"
          ? originalSectorsData
          : processData(originalSectorsData)
      );
    }
  };

  const handleViewAllIndices = () => {
    setSelectedCategory("Indices");
    setShowPreview(false);
  };

  const { openStockInfoDrawer } = useDrawer();

  const handleIndexPress = (index) => {
    navigation.navigate("Stocks", {
      exchange: selectedExchange,
      from: "Indices",
      filterIndex: index.name,
      headerData: index,
      headerCategory: "Indices"
    });
  };

  // ✅ Swipe right → View chart directly
  const handleSwipeToChart = (index) => {
    openStockInfoDrawer(index.symbol);
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
            token: item.token,
            prevClose,
            change,
            changePercent,
            timestamp: item.timestamp || item.exchange_timestamp,
            exchange_timestamp: item.exchange_timestamp,
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
          refreshing={refreshing}
          onRefresh={onRefresh}
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
            token: item.token,
            value,
            prevClose,
            change,
            changePercent,
            timestamp: item.timestamp || item.exchange_timestamp,
            exchange_timestamp: item.exchange_timestamp,
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
          refreshing={refreshing}
          onRefresh={onRefresh}
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
          // onSwipeToChart={handleSwipeToChart}
          externalData={allIndicesData}
          maxItems={showPreview ? 5 : undefined}
          refreshing={refreshing}
          onRefresh={onRefresh}
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
  companyName: { fontSize: 14, fontWeight: "600" },
  symbol: { fontSize: 11, color: global.colors.textSecondary },
});