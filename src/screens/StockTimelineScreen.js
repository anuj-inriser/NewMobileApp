import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Animated,
  AppState,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BottomTabBar from '../components/BottomTabBar';
// import TopHeader from "../components/TopHeader";
import GainerLoserCard from "../components/GainerLoserCard";
import GlobalTopMenu from "../components/GlobalTopMenu";
import StockCard from "../components/StockCard";
// import SequenceCard from "../components/SequenceCard";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  subscribeSymbols,
  unsubscribeDelayed,
} from "../ws/marketSubscriptions";
import { useAllStocks } from "../hooks/useAllStocks";
import { useMarketMovers } from "../hooks/useMarketMovers";
// import { useCommunitySequences } from "../hooks/useCommunitySequences";
import { useCommunityPosts } from "../hooks/useCommunityPosts";
import { useUserLikes } from "../hooks/useUserLikes";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import Learning from "./Learning";
import ScannerTab from "../components/ScannerTab";
import { useWatchlistStocks } from "../hooks/useWatchlistStocks";

const StockTimelineScreen = () => {
  // 🔥 TOP MENU (Timeline / Posts / Messages)
  const [topTab, setTopTab] = useState("Timeline");

  // 🔥 STOCK MENU (Latest / Watchlists / Gainers / Losers)
  const [stockTab, setStockTab] = useState("Latest");

  const {
    stocks: allStocks,
    loading: stocksLoading,
    hasMore,
    loadMore,
  } = useAllStocks(5);
  const { data: moversData, loading: moversLoading } = useMarketMovers();
  /* 
  const {
    sequences,
    loading: sequencesLoading,
    error: sequenceError,
    loadMore: loadMoreSequences,
    hasMore: sequencesHasMore,
  } = useCommunitySequences(5);
  */

  // 🔥 SEQUENCE NAVIGATION STATE
  const [selectedSequenceId, setSelectedSequenceId] = useState(null);
  const [sequenceName, setSequenceName] = useState("");

  // 🔥 WATCHLIST NAVIGATION STATE
  const [selectedWatchlistId, setSelectedWatchlistId] = useState(null);
  const [watchlistName, setWatchlistName] = useState("");
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const {
    posts: sequencePosts,
    loading: postsLoading,
    error: postsError,
    refetch: refetchPosts,
  } = useCommunityPosts(selectedSequenceId);

  // 🔥 LIKE SYSTEM
  const { userId } = useAuth();
  const { userLikes, fetchUserLikes } = useUserLikes();

  // 🔥 WATCHLIST STOCK HOOK
  const {
    stocks: watchlistSwipeStocks,
    loading: watchlistSwipeLoading,
    refetch: refetchWatchlistSwipe
  } = useWatchlistStocks(selectedWatchlistId);

  // Animation State
  const scrollY = useRef(new Animated.Value(0)).current;

  const [tabMenuHeight, setTabMenuHeight] = useState(60);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (userId) {
      fetchUserLikes(userId);
    }
  }, [userId]);

  /* const handlePlaySequence = (sequence) => {
    setSelectedSequenceId(sequence.id);
    setSequenceName(sequence.sequence_name || sequence.title || "Viewing Sequence");
    setCurrentPostIndex(0);
    setTopTab("Timeline"); // Move to Timeline tab to show posts
  }; */

  // Helper function to get symbol from script_id
  const getSymbolFromScriptId = (scriptId) => {
    if (!scriptId) return "Unknown Stock";
    const stock = allStocks.find(
      (s) => s.token === scriptId || String(s.token) === String(scriptId)
    );
    return stock ? stock.symbol || stock.name : `${scriptId}`;
  };

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentPostIndex(viewableItems[0].index || 0);
    }
  }).current;

  // Sample Watchlist (later API se aa jayega)
  const watchlistStocks = allStocks.slice(0, 10);

  const truncateWords = (str, numWords) => {
    if (!str) return null;
    const words = str.split(" ");
    if (words.length <= numWords) return str;
    return words.slice(0, numWords).join(" ") + " ...";
  };

  // 🔥 STOCK TAB LOGIC
  const getStockData = () => {
    const defaultStats = { likes: "0", dislikes: "0", comments: "0" };

    switch (stockTab) {
      case "Latest":
        return allStocks.map((stock) => ({
          ...stock,
          analysis: truncateWords(stock.news_description, 10) || "",
          news_title: stock.news_title || "",
          news_date: stock.news_date,
          news_items: stock.news_items, // Pass news array from backend
          stats: stock.stats || defaultStats,
        }));

      case "Watchlists":
        return watchlistStocks.map((stock) => ({
          ...stock,
          analysis: truncateWords(stock.news_description, 10) || "",
          news_title: stock.news_title || "",
          news_date: stock.news_date,
          stats: stock.stats || defaultStats,
        }));

      case "Gainers":
        return (moversData?.gainers || []).map((item) => ({
          ...item,
          stats: defaultStats,
        }));

      case "Losers":
        return (moversData?.losers || []).map((item) => ({
          ...item,
          stats: defaultStats,
        }));

      default:
        return allStocks.map((stock) => ({
          ...stock,
          analysis: truncateWords(stock.news_description, 10) || "",
          news_title: stock.news_title || "",
          news_date: stock.news_date,
          stats: stock.stats || defaultStats,
        }));
    }
  };

  const subscribedRef = useRef(new Set());

  // 🔥 Memoize stockData to prevent unnecessary re-renders
  const stockData = useMemo(
    () => getStockData(),
    [allStocks, stockTab, watchlistStocks, moversData]
  );

  // 🔥 Refetch Data on Focus
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchUserLikes(userId);
      }
      if (userId) {
        fetchUserLikes(userId);
      }
      if (selectedSequenceId) {
        refetchPosts();
      }
      if (selectedWatchlistId) {
        refetchWatchlistSwipe();
      }
    }, [userId, selectedSequenceId, selectedWatchlistId])
  );

  const getTimelineSymbols = () => {
    if (!stockData?.length && !watchlistSwipeStocks?.length) return [];
    if (topTab === "News" || (topTab === "Sequence" && !selectedSequenceId && !selectedWatchlistId)) return [];

    let syms = [];
    if (selectedWatchlistId) {
      syms = watchlistSwipeStocks.map(s => s.token || s.script_id || s.symbol);
    } else {
      syms = stockData.map((s) => s.token ?? s.symboltoken ?? s.script_id ?? s.id ?? null);
    }

    return syms.filter(Boolean);
  };

  const subscribeIncremental = (symbols, page, context) => {
    const newOnes = symbols.filter((s) => !subscribedRef.current.has(s));

    if (!newOnes.length) return;

    newOnes.forEach((s) => subscribedRef.current.add(s));

    subscribeSymbols(newOnes, page, context);
  };

  // 🔥 Subscription Logic
  useFocusEffect(
    useCallback(() => {
      const page = "StockTimelineScreen";
      const context = `${topTab}-${stockTab}`;

      const symbols = getTimelineSymbols();

      if (!symbols.length) {
        console.log(`⏭ SKIP SUBSCRIBE → ${page}::${context}`);
        return;
      }

      // 🔥 incremental subscribe
      const newOnes = symbols.filter((s) => !subscribedRef.current.has(s));

      if (newOnes.length) {
        newOnes.forEach((s) => subscribedRef.current.add(s));
        subscribeSymbols(newOnes, page, context);
      }

      const appSub = AppState.addEventListener("change", (state) => {
        if (state !== "active") {
          unsubscribeDelayed(Array.from(subscribedRef.current), page, context);
        }
      });

      return () => {
        unsubscribeDelayed(Array.from(subscribedRef.current), page, context);
        subscribedRef.current.clear();
        appSub?.remove();
      };
    }, [stockData, watchlistSwipeStocks, topTab, stockTab, selectedSequenceId, selectedWatchlistId])
  );

  // 🔥 Vertical Stock Pagination Layout - Dynamic for all devices
  const [listHeight, setListHeight] = useState(0);
  const ITEM_HEIGHT = listHeight > 0 ? listHeight : 600; // Fallback to avoid 0 height

  const renderStockItem = ({ item }) => (
    <View style={{ height: ITEM_HEIGHT }}>
      <StockCard
        stock={item}
        contentType="stock" // Explicitly stock
        userReaction={userLikes[`stock_${item.id}`]} // Composite key
        fullScreen={true}
      />
    </View>
  );

  const renderGainerLoserItem = ({ item }) => (
    <GainerLoserCard
      symbol={item.symbol}
      name={item.name}
      price={item.price}
      change={item.change}
      percentChange={item.percentChange}
    />
  );

  const handleLoadMore = () => {
    if (
      (stockTab === "Latest" || stockTab === "Watchlists") &&
      !stocksLoading &&
      hasMore
    ) {
      loadMore();
    }
  };

  // Animation Interpolation
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  // Mock State for BottomTabBar
  const mockTabBarState = {
    index: 2, 
    routes: [
      { name: "Equity", key: "Equity" },
      { name: "NewsScreen", key: "NewsScreen" },
      { name: "StockTimelineScreen", key: "StockTimelineScreen" },
      { name: "Trade", key: "Trade" },
      { name: "AdvancedChart", key: "AdvancedChart" }, 
    ],
  };

  return (
    <View style={{ flex: 1, backgroundColor: global.colors.background }}>
      <SafeAreaView style={styles.container}>
        <View>{/* <TopHeader /> */}</View>

        {/* <GlobalTopMenu
          tabs={[
            { id: "Timeline", name: "Timeline" },
            { id: "Sequence", name: "Scanner" },
          ]}
          activeTab={{ id: topTab }}
          onTabChange={(tab) => setTopTab(tab.id)}
          showFilter={false}
          hideShadow={topTab === "Sequence"}
          onLayout={(e) => setTabMenuHeight(e.nativeEvent.layout.height)}
        /> */}

        {/* 🔥 MAIN CONTENT AREA */}
        <View 
          style={{ flex: 1, paddingBottom: 0 }} 
          onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
        >
          {listHeight > 0 && (
            topTab === "Sequence" ? (
            selectedSequenceId ? (
              postsLoading ? (
                <ActivityIndicator
                  size="large"
                  color={global.colors.secondary}
                  style={{ marginTop: 20 }}
                />
              ) : (
                <>
                  <TouchableOpacity
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      zIndex: 100,
                      backgroundColor: global.colors.surface,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 3,
                      elevation: 5,
                      opacity: 0.8,
                    }}
                    onPress={() => {
                      setSelectedSequenceId(null);
                      setSequenceName("");
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Ionicons name="arrow-back" size={20} color={global.colors.secondary} />
                      <Text
                        style={{
                          marginLeft: 10,
                          fontWeight: "700",
                          color: global.colors.secondary,
                        }}
                      >
                        {sequenceName}
                      </Text>
                    </View>
                    {/* <Ionicons name="close-circle" size={24} color="#210F47" /> */}
                  </TouchableOpacity>
                  <Animated.FlatList
                    key="sequence-posts-list"
                    data={sequencePosts || []}
                    renderItem={({ item, index }) => {
                      const stockInfo = allStocks.find(
                        (s) =>
                          String(s.token) === String(item.content_script_id)
                      );
                      return (
                        <View style={{ height: ITEM_HEIGHT }}>
                          {/* DEBUG LOG */}
                          {/* {console.log(`Rendering Item ${index}: News Items Count:`, item.news_items?.length)} */}
                          <StockCard
                            stock={{
                              id: item.content_id,
                              token:
                                item.content_script_id ||
                                stockInfo?.token ||
                                item.token,
                              name:
                                item.stock_name ||
                                item.content_symbol ||
                                getSymbolFromScriptId(item.content_script_id),
                              symbol:
                                item.content_symbol ||
                                item.stock_name ||
                                stockInfo?.symbol ||
                                "Unknown",
                              price: 430.92,
                              ltp: 430.92,
                              change: 45.3,
                              changePercent: 11.77,
                              // Prioritize News Description/Title from Backend Enrichment
                              // If backend successfully found news (via script_id/tags match), show that.
                              // Otherwise fallback to post content/title, then generic watchlist info.
                              analysis:
                                truncateWords(
                                  item.news_description ||
                                  item.content ||
                                  stockInfo?.news_description,
                                  10
                                ) || "",
                              news_title:
                                item.news_title ||
                                item.title ||
                                stockInfo?.news_title ||
                                "",
                              news_date:
                                item.news_date ||
                                item.created_at ||
                                stockInfo?.news_date,
                              news_items: item.news_items, // Pass full array for navigation
                              content_script_timeframe:
                                item.content_script_timeframe,
                              stats: {
                                likes: item.likes_count || 0,
                                dislikes: item.dislikes_count || 0,
                                comments: item.comments_count || 0,
                              },
                            }}
                            postNumber={`${index + 1}/${sequencePosts.length
                              }`}
                            contentType="post"
                            userReaction={
                              userLikes[`post_${item.content_id}`]
                            }
                            fullScreen={true}
                          />
                        </View>
                      );
                    }}
                    // Header removed from here to top overlay
                    keyExtractor={(item) => item.content_id.toString()}
                    pagingEnabled
                    snapToAlignment="start"
                    decelerationRate="fast"
                    snapToInterval={ITEM_HEIGHT}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    showsVerticalScrollIndicator={false}
                    onScroll={handleScroll}
                    contentContainerStyle={{ flexGrow: 0 }}
                  />
                </>
              )
            ) : selectedWatchlistId ? (
              watchlistSwipeLoading ? (
                <ActivityIndicator
                  size="large"
                  color={global.colors.secondary}
                  style={{ marginTop: 20 }}
                />
              ) : (
                <>
                  <TouchableOpacity
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      zIndex: 100,
                      backgroundColor: global.colors.surface,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 3,
                      elevation: 5,
                      opacity: 0.8,
                    }}
                    onPress={() => {
                      setSelectedWatchlistId(null);
                      setWatchlistName("");
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons name="arrow-back" size={20} color={global.colors.secondary} />
                      <Text
                        style={{
                          marginLeft: 10,
                          fontWeight: "700",
                          color: global.colors.secondary,
                        }}
                      >
                        {watchlistName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <Animated.FlatList
                    key="watchlist-swipe-list"
                    data={watchlistSwipeStocks || []}
                    renderItem={renderStockItem}
                    keyExtractor={(item) => (item.id || item.token || Math.random()).toString()}
                    pagingEnabled
                    snapToAlignment="start"
                    decelerationRate="fast"
                    snapToInterval={ITEM_HEIGHT}
                    showsVerticalScrollIndicator={false}
                    onScroll={handleScroll}
                  />
                </>
              )
            ) : (
              <ScannerTab
                onScannerSelect={(scanner) => {
                  setSelectedWatchlistId(null);
                  setSelectedSequenceId(scanner.id);
                  setSequenceName(scanner.sequence_name || scanner.name || "Viewing Sequence");
                }}
                onWatchlistSelect={(wl) => {
                  setSelectedSequenceId(null);
                  setSelectedWatchlistId(wl.id);
                  setWatchlistName(wl.name);
                }}
              />
            )
          ) : topTab === "News" ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: global.colors.textSecondary }}>News feed coming soon...</Text>
            </View>
          ) : stockTab === "Gainers" || stockTab === "Losers" ? (
            moversLoading ? (
              <ActivityIndicator
                size="large"
                color={global.colors.secondary}
                style={{ marginTop: 20 }}
              />
            ) : (
              <Animated.FlatList
                data={stockData}
                renderItem={renderGainerLoserItem}
                keyExtractor={(item) => item.id || item.symbol}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingBottom: 20,
                  marginTop: 10,
                }}
                showsVerticalScrollIndicator={true}
                onScroll={handleScroll}
              />
            )
          ) : (
            <View style={{ flex: 1 }}>

              <Animated.FlatList
                key="stock-timeline-list"
                data={stockData}
                renderItem={renderStockItem}
                keyExtractor={(item) => item.id}
                pagingEnabled
                snapToAlignment="start"
                decelerationRate="fast"
                snapToInterval={ITEM_HEIGHT}
                onScroll={handleScroll}
                contentContainerStyle={{ flexGrow: 0 }}
                getItemLayout={(data, index) => ({
                  length: ITEM_HEIGHT,
                  offset: ITEM_HEIGHT * index,
                  index,
                })}
                showsVerticalScrollIndicator={false}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  stocksLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={global.colors.secondary}
                      style={{ padding: 20 }}
                    />
                  ) : null
                }
              />

            </View>
            )
          )}
        </View>
      </SafeAreaView>

      <BottomTabBar 
          state={mockTabBarState} 
          navigation={useNavigation()} 
          descriptors={{}} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  topSliders: {
    backgroundColor: global.colors.background,
    elevation: 10,
    shadowColor: global.colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    paddingTop: 3,
    marginBottom: 10,
  },
  container: {
    flex: 1,
    backgroundColor: global.colors.background,
  },
});

export default StockTimelineScreen;
