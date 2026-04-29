import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Animated,
  AppState,
  useWindowDimensions,
  Modal,
} from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";

import BottomTabBar from '../components/BottomTabBar';
// import TopHeader from "../components/TopHeader";
import GainerLoserCard from "../components/GainerLoserCard";
// import GlobalTopMenu from "../components/GlobalTopMenu";
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
import { useScanResults } from "../hooks/useScansResult";

const StockTimelineScreen = () => {
  // 🔥 TOP MENU (Timeline / Posts / Messages)
  const [topTab, setTopTab] = useState("Sequence");

  // 🔥 STOCK MENU (Latest / Watchlists / Gainers / Losers)
  const [stockTab, setStockTab] = useState("Latest");

  const {
    stocks: allStocks,
    loading: stocksLoading,
    hasMore,
    loadMore,
  } = useAllStocks(100);
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

  // 🔥 SCAN RESULTS HOOK
  const {
    data: scanResults,
    isLoading: scanResultsLoading,
    refetch: refetchScanResults
  } = useScanResults(selectedSequenceId);

  const sequenceData = useMemo(() => {
    if (!selectedSequenceId) return [];

    if (scanResults && scanResults.length > 0) {
      return scanResults.map((item, index) => {
        const stockInfo = allStocks.find(
          (s) => String(s.token) === String(item.token)
        );
        return {
          isScan: true,
          content_id: item.id || `scan_${index}`,
          content_script_id: item.token,
          content_symbol: item.symbol || stockInfo?.symbol,
          stock_name: stockInfo?.name || item.symbol || "Unknown",
          news_description: stockInfo?.news_description || "",
          news_title: stockInfo?.news_title || "",
          news_date: stockInfo?.news_date,
          news_items: stockInfo?.news_items,
          likes_count: 0,
          dislikes_count: 0,
          comments_count: 0,
          isin: stockInfo?.isin,
          tradeable: stockInfo?.tradeable,
        };
      });
    }

    return sequencePosts || [];
  }, [selectedSequenceId, sequencePosts, scanResults, allStocks]);

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
    [allStocks, stockTab, moversData]
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
        refetchScanResults();
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
  // const mockTabBarState = {
  //   index: 2, 
  //   routes: [
  //     { name: "Equity", key: "Equity" },
  //     { name: "NewsScreen", key: "NewsScreen" },
  //     { name: "StockTimelineScreen", key: "StockTimelineScreen" },
  //     { name: "Trade", key: "Trade" },
  //     { name: "AdvancedChart", key: "AdvancedChart" }, 
  //   ],
  // };

  return (
    <View style={{ flex: 1,backgroundColor: global.colors.background }}>
      <View style={styles.container}>
        {/* <View><TopHeader /></View> */}

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
          style={{ flex: 1}} 
          onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
        >
          {listHeight > 0 && (
            topTab === "Sequence" ? (
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
                keyExtractor={(item, index) => `${item.symbol || 'mover'}-${index}`}
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
      </View>

      {/* <BottomTabBar 
          state={mockTabBarState} 
          navigation={useNavigation()} 
          descriptors={{}} 
      /> */}

      {/* 🔥 OVERLAY MODAL FOR SEQUENCE/WATCHLIST RESULTS */}
      <Modal
        visible={!!selectedSequenceId || !!selectedWatchlistId}
        animationType="slide"
        onRequestClose={() => {
          setSelectedSequenceId(null);
          setSelectedWatchlistId(null);
        }}
      >
        <View style={{ flex: 1, backgroundColor: global.colors.background }}>
          <SafeAreaView style={{ flex: 1 }}>
            {/* Header inside Modal */}
            <View style={{ 
              flexDirection: 'row',  
              alignItems: 'center', 
              padding: 15, 
            }}>
              <TouchableOpacity onPress={() => {
                setSelectedSequenceId(null);
                setSelectedWatchlistId(null);
              }}>
                <Ionicons name="arrow-back" size={24} color={global.colors.textPrimary} />
              </TouchableOpacity>
              <Text style={{ 
                marginLeft: 15, 
                fontSize: 18, 
                fontWeight: '700', 
                color: global.colors.textPrimary 
              }}>
                {sequenceName || watchlistName}
              </Text>
            </View>

            {/* Content inside Modal */}
            <View style={{ flex: 1 }}>
              {selectedSequenceId ? (
                postsLoading || scanResultsLoading ? (
                  <ActivityIndicator size="large" color={global.colors.secondary} style={{ marginTop: 20 }} />
                ) : postsError ? (
                  <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
                    <Ionicons name="alert-circle-outline" size={48} color={global.colors.error} />
                    <Text style={{ color: global.colors.textPrimary, marginTop: 10, textAlign: 'center' }}>
                      Failed to load posts.
                    </Text>
                  </View>
                ) : (
                  <Animated.FlatList
                    data={sequenceData}
                    renderItem={({ item, index }) => {
                      const stockInfo = allStocks.find(s => String(s.token) === String(item.content_script_id));
                      return (
                        <View style={{ height: ITEM_HEIGHT }}>
                          <StockCard
                            stock={{
                              id: item.content_id,
                              token: item.content_script_id || stockInfo?.token || item.token,
                              name: item.stock_name || item.content_symbol || getSymbolFromScriptId(item.content_script_id),
                              symbol:
                                item.content_symbol ||
                                stockInfo?.symbol ||
                                item.stock_name ||
                                "Unknown",
                              price: stockInfo?.price || 0,
                              ltp: stockInfo?.ltp || 0,
                              change: stockInfo?.change || 0,
                              changePercent: stockInfo?.changePercent || 0,
                              analysis: truncateWords(item.news_description || item.content || stockInfo?.news_description, 10) || "",
                              news_title: item.news_title || item.title || stockInfo?.news_title || "",
                              news_date: item.news_date || item.created_at || stockInfo?.news_date,
                              news_items: item.news_items,
                              content_script_timeframe: item.content_script_timeframe,
                              stats: {
                                likes: item.likes_count || 0,
                                dislikes: item.dislikes_count || 0,
                                comments: item.comments_count || 0,
                              },
                              isin: item.isin || stockInfo?.isin,
                              tradeable: item.tradeable || stockInfo?.tradeable,
                              exchange: stockInfo?.exchange
                            }}
                            onRupeePress={() => {
                              setSelectedSequenceId(null);
                              setSelectedWatchlistId(null);
                            }}
                            postNumber={`${index + 1}/${sequenceData.length}`}
                            contentType="post"
                            userReaction={userLikes[`post_${item.content_id}`]}
                            fullScreen={true}
                          />
                        </View>
                      );
                    }}
                    keyExtractor={(item, index) => item?.content_id?.toString() || index.toString()}
                    pagingEnabled
                    snapToAlignment="start"
                    decelerationRate="fast"
                    snapToInterval={ITEM_HEIGHT}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    showsVerticalScrollIndicator={false}
                    onScroll={handleScroll}
                    contentContainerStyle={{ flexGrow: 0 }}
                    getItemLayout={(data, index) => ({
                      length: ITEM_HEIGHT,
                      offset: ITEM_HEIGHT * index,
                      index,
                    })}
                  />
                )
              ) : selectedWatchlistId ? (
                watchlistSwipeLoading ? (
                  <ActivityIndicator size="large" color={global.colors.secondary} style={{ marginTop: 20 }} />
                ) : (
                  <Animated.FlatList
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
                )
              ) : null}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
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
    top:10,
    flex: 1,
    backgroundColor: global.colors.background,
  },
});

export default StockTimelineScreen;