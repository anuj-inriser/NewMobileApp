import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
  Modal,
  Pressable,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";
import { apiUrl } from "../../utils/apiUrl";
import TradeOrderScreen from "../../screens/TradeOrderScreen";
import GlobalSubTabMenu from "../GlobalSubTabMenu";
import { useRealtimePrices } from "../../hooks/useRealtimePrices";
import { Ionicons } from "@expo/vector-icons";
import { useDrawer } from "../../context/DrawerContext";
import TradeOrderFormNative from "../TradeOrderFormNative";
import axiosInstance from "../../api/axios";
import TextInput from "../TextInput";
import { useWatchlistRefresh } from "../../context/WatchlistContext";
import { useAlert } from "../../context/AlertContext";
import CancelIcon from "../../../assets/cancelicon.png";
import watchlistIcon from "../../../assets/dropdownwatchlist.png";
import rupeeIcon from "../../../assets/trademenu.png";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const COLLAPSED_HEIGHT = 30;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.75;

const StockInfoView = ({ token, symbol, isin, hideOverview = false, isInsideSlider = false, closeSlider, onFullScreenToggle, isFullScreen }) => {

  // console.log("isin - > Stockinforview", isin)
  const { prices } = useRealtimePrices();
  const { selectedSymbol, defaultTab, drawerMetadata, openStockInfoDrawer } = useDrawer();
  const [stockInfo, setStockInfo] = useState([])
  const { showError } = useAlert();
  const { triggerRefresh } = useWatchlistRefresh();

  const [masterData, setMasterData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [watchlistModalVisible, setWatchlistModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [watchlists, setWatchlists] = useState([]);
  const [loadingWatchlists, setLoadingWatchlists] = useState(false);
  const [userId, setUserId] = useState(null);
  const [addingToWishlist, setAddingToWishlist] = useState({});
  const [searchText, setSearchText] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  const WISHLIST_API = `${apiUrl}/api/wishlistcontrol`;

  // Tabs State
  const subTabs = [
    { tradeTypeId: 'overview', tradeTypeName: 'Overview' },
    { tradeTypeId: 'futures', tradeTypeName: 'Futures' },
    { tradeTypeId: 'options', tradeTypeName: 'Options Chain' },
    { tradeTypeId: 'orderdepth', tradeTypeName: 'OrderDepth' },
    { tradeTypeId: 'placeorder', tradeTypeName: 'Place Order' },
    { tradeTypeId: 'chart', tradeTypeName: 'Chart' },
  ].filter(tab => !(hideOverview && tab.tradeTypeId === 'overview'));

  const initialTab = subTabs.find(t => t.tradeTypeId === defaultTab) || subTabs[0];
  const [activeSubTab, setActiveSubTab] = useState(initialTab);

  // Sync tab whenever the drawer is opened with a specific defaultTab
  useEffect(() => {
    const tab = subTabs.find(t => t.tradeTypeId === defaultTab) || subTabs[0];
    setActiveSubTab(tab);
  }, [defaultTab]);

  // Chart Logic
  const chartSymbol = selectedSymbol?.symbol || symbol;
  const tokenValue = selectedSymbol?.token || token;
  const isinValue = selectedSymbol?.isin || isin;

  const webViewRef = useRef(null);
  const [chartInterval, setChartInterval] = useState(null);
  const [injectionScript, setInjectionScript] = useState("");
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    const prepareChart = async () => {
      try {
        let interval = "1";
        const savedInterval = await AsyncStorage.getItem("@chart_interval");
        if (savedInterval) interval = savedInterval;
        setChartInterval(interval);

        const candidates = [
          chartSymbol,
          chartSymbol.includes(":") ? chartSymbol : `NSE:${chartSymbol}`,
          chartSymbol.replace("-EQ", ""),
          `NSE:${chartSymbol.replace("NSE:", "").replace("-EQ", "")}`,
          `${chartSymbol}-EQ`,
          `NSE:${chartSymbol}-EQ`,
        ];

        let cachedData = null;
        for (const candidate of candidates) {
          const key = `@chart_cache_${candidate}_${interval}`;
          const data = await AsyncStorage.getItem(key);
          if (data) {
            cachedData = data;
            break;
          }
        }

        if (cachedData) {
          const script = `window.INITIAL_CHART_DATA = ${cachedData}; true;`;
          setInjectionScript(script);
        }
      } catch (e) {
        setChartInterval("1");
      } finally {
        setIsChartReady(true);
      }
    };
    prepareChart();
  }, [chartSymbol]);

  const handleMessage = (event) => {
    const { data } = event.nativeEvent;
    try {
      const parsed = typeof data === 'string' && data.startsWith('{') ? JSON.parse(data) : { type: data };
      if (parsed.type === "INTERVAL_CHANGED") {
        AsyncStorage.setItem("@chart_interval", parsed.interval);
        setChartInterval(parsed.interval);
      } else if (parsed.type === "TOGGLE_FULLSCREEN" || data === "TOGGLE_FULLSCREEN") {
        if (onFullScreenToggle) {
          onFullScreenToggle(!isFullScreen);
        }
      }
    } catch (e) {
      if (data === "TOGGLE_FULLSCREEN" && onFullScreenToggle) {
        onFullScreenToggle(!isFullScreen);
      }
    }
  };

  const injectSymbol = () => {
    if (chartSymbol && webViewRef.current) {
      const script = `if (window.tvWidget) { window.tvWidget.activeChart().setSymbol('${chartSymbol}'); }`;
      webViewRef.current.injectJavaScript(script);
    }
  };
  // Drawer Logic
  const [isExpanded, setIsExpanded] = useState(false);
  const animation = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;

  const toggleDrawer = () => {
    const toValue = isExpanded ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT;
    Animated.timing(animation, { toValue, duration: 300, useNativeDriver: false }).start();
    setIsExpanded(!isExpanded);
  };

  const handleClose = () => {
    Animated.timing(animation, { toValue: COLLAPSED_HEIGHT, duration: 300, useNativeDriver: false }).start();
    setIsExpanded(false);
  };

  const fetchStockInfoData = async () => {
    try {
      const res = await axiosInstance.get('/indicesNew/stockinfodata');

      if (res.data.data) {
        setStockInfo(res.data.data)
      }
    } catch (error) {
      console.error(error?.response?.message || 'Error fetching data')
    }
  }

  useEffect(() => {
    fetchStockInfoData();
  }, [])

  const loadUserId = async () => {
    try {
      const uid = await AsyncStorage.getItem("userId");
      setUserId(uid);
    } catch (err) {
      console.log("User ID load error:", err);
    }
  };

  const fetchMaster = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/scripts`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      if (data.status === true && Array.isArray(data.data)) {
        setMasterData(data.data);
      } else {
        setMasterData([]);
      }
    } catch (err) {
      console.error("Master Load Error:", err.message || err);
      setMasterData([]);
    }
  };

  useEffect(() => {
    fetchMaster();
    loadUserId();
  }, []);

  const searchFilter = (text) => {
    setSearchText(text);
    if (!text.trim()) {
      setFiltered([]);
      return;
    }

    const lower = text.toLowerCase();
    const results = masterData.filter((item) => {
      return (
        (item.script_name && item.script_name.toLowerCase().includes(lower)) ||
        (item.script_id && item.script_id.toLowerCase().includes(lower)) ||
        (item.exchange && item.exchange.toLowerCase().includes(lower))
      );
    });

    setFiltered(results.slice(0, 8));
  };

  const fetchWatchlists = async () => {
    if (!userId) return;
    setLoadingWatchlists(true);
    try {
      const res = await axiosInstance.get(`${WISHLIST_API}?user_id=${userId}`);
      const listData = res?.data?.data || [];
      setWatchlists(
        listData.map((item) => ({
          id: item.wishlist_id,
          name: item.wishlist_name,
          user: item.user_id,
        })),
      );
    } catch (err) {
      console.log("Watchlist fetch error:", err);
      setWatchlists([]);
    }
    setLoadingWatchlists(false);
  };

  const closeWatchlistModal = () => {
    setWatchlistModalVisible(false);
    setSelectedItem(null);
  };

  const handleAddToWatchlist = async (wishlist) => {
    if (!selectedItem || !wishlist || !userId) return;

    if (addingToWishlist[wishlist.id]) return;
    setAddingToWishlist((prev) => ({ ...prev, [wishlist.id]: true }));

    const payload = {
      script_id: selectedItem.script_id,
      user_id: parseInt(userId, 10),
      wishlist_id: parseInt(wishlist.id, 10),
    };

    try {
      const stocksRes = await axiosInstance.get(`${apiUrl}/api/wishlistcontrol/stocks`, {
        params: { wishlist_id: parseInt(wishlist.id, 10) },
      });
      const count = Array.isArray(stocksRes?.data?.data) ? stocksRes.data.data.length : 0;
      if (count >= 20) {
        showError("Error", "Each watchlist can have maximum 20 stocks.");
        return;
      }

      const response = await axiosInstance.post(
        `${apiUrl}/api/wishlistcontrol/add`,
        payload,
      );

      if (response.status === 201 || response.status === 200 || response.status === 409) {
        const msg = response.data.message || "Added to watchlist";
        if (msg === "Added to watchlist") {
          triggerRefresh(parseInt(wishlist.id, 10));
        } else {
          showError("Error", msg);
        }
        closeWatchlistModal();
      } else {
        showError("Error", response.data.message || "Failed");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to add";
      showError("Error", msg);
    } finally {
      setAddingToWishlist((prev) => ({ ...prev, [wishlist.id]: false }));
    }
  };

  useEffect(() => {
    if (watchlistModalVisible) {
      fetchWatchlists();
    }
  }, [watchlistModalVisible, userId, addingToWishlist]);

  const mergeWithRealtime = (list, prices) => {
    const mergedPrices = {};

    list.forEach((item) => {
      const rt = prices[item.token] || item.ltp;
      if (!rt) return;

      const price = rt.price || rt;

      const prevClose =
        item.prevClose ||
        rt.prevClose ||
        rt.open ||
        item.value ||
        item.prev_close ||
        price;

      const change = price - prevClose;
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

      mergedPrices[item.token] = {
        price,
        change,
        changePercent,
        timestamp:
          rt.timestamp ||
          rt.exchange_timestamp ||
          item.timestamp ||
          item.exchange_timestamp,
        exchange_timestamp: rt.exchange_timestamp || item.exchange_timestamp,
      };
    });

    return mergedPrices;
  };

  const displayPrices = useMemo(() => {
    return mergeWithRealtime(stockInfo, prices);
  }, [stockInfo, prices]);


  // Info Content Logic
  const stockData = displayPrices[tokenValue];

  const price = stockData?.price || 0;
  const change = stockData?.change || 0;
  const changePercent = stockData?.changePercent || 0;
  const isPositive = change >= 0;

  return (
    <View style={styles.container}>
      {/* Fullscreen Minimize Button */}
      {isFullScreen && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => onFullScreenToggle && onFullScreenToggle(false)}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={global.colors.background}
          />
        </TouchableOpacity>
      )}

      {/* Custom Header (Slider only) */}
      {!isFullScreen && isInsideSlider && (
        <View
          style={styles.sliderHeader}
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        >
          <TouchableOpacity onPress={closeSlider} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color={global.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerInfoContainer}>
            <Text style={styles.headerSymbol}>{symbol}</Text>
            <View style={styles.headerPriceRow}>
              <Text style={styles.headerPrice}>{`₹${Number(price || 0).toFixed(2)}`}</Text>
              <Text style={[styles.headerChange, { color: isPositive ? global.colors.success : global.colors.error }]}>
                {`${isPositive ? '+' : ''}${Number(change || 0).toFixed(2)} (${Number(changePercent || 0).toFixed(2)}%)`}
              </Text>
            </View>
          </View>
          {/* <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {
              const next = !searchVisible;
              setSearchVisible(next);
              if (!next) {
                setFiltered([]);
                setSearchText("");
                Keyboard.dismiss();
              }
            }}
          >
            <Ionicons name="search" size={24} color={global.colors.textPrimary} />
          </TouchableOpacity> */}
        </View>
      )}

      {!isFullScreen && isInsideSlider && searchVisible && (
        <View
          style={[
            styles.searchArea,
            headerHeight ? { top: headerHeight } : null,
          ]}
        >
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={16}
                color={global.colors.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                placeholder="Search"
                placeholderTextColor={global.colors.textSecondary}
                style={styles.searchInput}
                value={searchText}
                onChangeText={searchFilter}
                autoFocus={true}
              />
              {(filtered.length > 0 || searchText.length > 0) && (
                <TouchableOpacity
                  onPress={() => {
                    setFiltered([]);
                    setSearchText("");
                    Keyboard.dismiss();
                  }}
                >
                  <Image source={CancelIcon} style={styles.iconImage} resizeMode="contain" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {filtered.length > 0 && (
            <View style={styles.dropdownWrapper}>
              <ScrollView style={styles.dropdownScroll}>
                {filtered.map((item) => (
                  <TouchableOpacity
                    key={item.script_id}
                    style={styles.dropdownRow}
                  >
                    <Text style={styles.dropdownText} numberOfLines={1}>
                      {item.exchange}
                      {item.script_id ? ` : ${item.script_id}` : ""}
                    </Text>

                    <View style={styles.rightIcons}>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedItem(item);
                          setWatchlistModalVisible(true);
                        }}
                      >
                        <Image
                          source={watchlistIcon}
                          style={styles.iconImage2}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    </View>
                    <View>
                      <TouchableOpacity
                        onPress={() => {
                          openStockInfoDrawer(item.token, item.script_id, "placeorder", item.isin, {
                            name: item.script_name,
                            tradeable: item.tradeable,
                            exchange: item.exchange
                          });
                        }}
                      >
                        <Image
                          source={rupeeIcon}
                          style={[styles.iconImage]}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}
      {/* Sub Menu */}

      {!isFullScreen && (
        <View style={styles.subMenuContainer}>
          <GlobalSubTabMenu
            tabs={subTabs}
            activeTab={activeSubTab}
            onTabChange={setActiveSubTab}
            hideShadow={true}
          />
        </View>
      )}


      <View style={styles.contentContainer}>
        {/* Chart Tab - Default */}
        <View style={{ flex: 1, display: activeSubTab.tradeTypeId === 'chart' ? 'flex' : 'none' }}>
          {isChartReady && chartInterval && (
            <WebView
              ref={webViewRef}
              source={{
                uri: `${apiUrl}/api/charting_library-master/mobile_white.html?symbol=${chartSymbol}&interval=${chartInterval}&backend=${apiUrl}`,
              }}
              style={styles.webview}
              originWhitelist={["*"]}
              onMessage={handleMessage}
              onLoadEnd={injectSymbol}
              injectedJavaScriptBeforeContentLoaded={injectionScript}
            />
          )}
        </View>

        {/* Overview Tab (Updated to match screenshot) */}
        {!isFullScreen && activeSubTab.tradeTypeId === 'overview' && (
          <ScrollView contentContainerStyle={styles.infoScroll} showsVerticalScrollIndicator={false}>
            {/* Range Card */}
            <View style={styles.rangeCard}>
              {/* Day Range */}
              <View style={styles.rangeRow}>
                <Text style={styles.rangeLabel}>Day Range</Text>
                <View style={styles.rangeBarContainer}>
                  <Text style={styles.rangeValueLow}>{stockData?.low?.toFixed(2) || '0.00'} <Text style={{ color: global.colors.error, fontSize: 10, fontWeight: '400' }}>Low</Text></Text>
                  <View style={styles.rangeProgressBg}>
                    <View style={[styles.rangeProgressFill, {
                      left: `${Math.min(100, Math.max(0, ((price - (stockData?.low || 0)) / ((stockData?.high || 1) - (stockData?.low || 0))) * 100))}%`
                    }]} />
                  </View>
                  <Text style={styles.rangeValueHigh}>{stockData?.high?.toFixed(2) || '0.00'} <Text style={{ color: global.colors.success, fontSize: 10, fontWeight: '400' }}>High</Text></Text>
                </View>
              </View>

              {/* 52 Week Range */}
              <View style={[styles.rangeRow, { marginTop: 20 }]}>
                <Text style={styles.rangeLabel}>52 Week Range</Text>
                <View style={styles.rangeBarContainer}>
                  <Text style={styles.rangeValueLow}>{String(stockData?.low52?.toFixed(2) ?? stockData?.low?.toFixed(2) ?? '0.00')} <Text style={{ color: global.colors.error, fontSize: 10, fontWeight: '400' }}>Low</Text></Text>
                  <View style={styles.rangeProgressBg}>
                    <View style={[styles.rangeProgressFill, {
                      left: `${Math.min(100, Math.max(0, ((price - (stockData?.low52 || stockData?.low || 0)) / ((stockData?.high52 || stockData?.high || 1) - (stockData?.low52 || stockData?.low || 0))) * 100))}%`
                    }]} />
                  </View>
                  <Text style={styles.rangeValueHigh}>{String(stockData?.high52?.toFixed(2) ?? stockData?.high?.toFixed(2) ?? '0.00')} <Text style={{ color: global.colors.success, fontSize: 10, fontWeight: '400' }}>High</Text></Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Bid/Ask etc. */}
              <View style={styles.bidAskRow}>
                <View style={styles.bidAskCol}>
                  <Text style={styles.bidAskLabel}>Volume</Text>
                  <Text style={styles.bidAskValue}>{stockData?.volume?.toLocaleString() || '--'}</Text>
                </View>
                <View style={styles.bidAskCol}>
                  <Text style={styles.bidAskLabelCentered}>Bid</Text>
                  <Text style={[styles.bidAskValueCentered, { color: global.colors.success }]}>{stockData?.bid?.toFixed(2) || '--'}</Text>
                </View>
                <View style={styles.bidAskCol}>
                  <Text style={styles.bidAskLabelRight}>Ask</Text>
                  <Text style={[styles.bidAskValueRight, { color: global.colors.error }]}>{stockData?.ask?.toFixed(2) || '--'}</Text>
                </View>
              </View>
            </View>

            {/* Detailed Stats Card */}
            <View style={styles.statsListCard}>
              {[
                { label: "Open", value: stockData?.open?.toFixed(2) },
                { label: "High", value: stockData?.high?.toFixed(2) },
                { label: "All Time High", value: stockData?.high52?.toFixed(2) || stockData?.high?.toFixed(2) },
                { label: "Previous Close", value: stockData?.prevClose?.toFixed(2) },
                { label: "Low", value: stockData?.low?.toFixed(2) },
                { label: "All Time Low", value: stockData?.low52?.toFixed(2) || stockData?.low?.toFixed(2) },
                { label: "Volume", value: stockData?.volume?.toLocaleString() },
                { label: "Book Value/Share", value: stockData?.bookValue?.toFixed(2) || "150.17" },
                { label: "Dividend Yield", value: stockData?.divYield?.toFixed(2) || "0.75" },
              ].map((item, idx) => (
                <View key={idx} style={[styles.statsListRow, idx !== 0 && styles.statsListBorder]}>
                  <Text style={styles.statsLabel}>{item.label}</Text>
                  <Text style={styles.statsValue}>{item.value || '--'}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}


        {/* Place Order Tab */}
        {!isFullScreen && activeSubTab.tradeTypeId === 'placeorder' && (
          <View style={styles.orderFormContainer}>
            {/* <TradeOrderScreen
              symbol={symbol}
              token={token}
              isin={isin}
              name={drawerMetadata.name || symbol}
              price={drawerMetadata.price || 0}
              internaltype="Place"
              exchange={drawerMetadata.exchange}
            /> */}
            <TradeOrderScreen
              symbol={chartSymbol}
              token={tokenValue}
              isin={isinValue}
              name={drawerMetadata?.name || chartSymbol}
              price={drawerMetadata?.price || 0}
              quantity={drawerMetadata?.quantity}
              stoploss={drawerMetadata?.stoploss}
              internaltype={drawerMetadata?.internaltype || "Place"}
              exchange={drawerMetadata?.exchange}
              orderid={drawerMetadata?.orderid}
              producttype={drawerMetadata?.producttype}
              transactiontype={drawerMetadata?.transactiontype}
            />
            {/* <TradeOrderFormNative
              symbol={symbol}
              token={stockData.token || stockData.id || symbol}
              name={drawerMetadata.name || symbol}
              price={drawerMetadata.price || price}
              quantity={drawerMetadata.quantity || 1}
              target={drawerMetadata.target}
              stoploss={drawerMetadata.stoploss}
              onClose={() => setActiveSubTab(subTabs[0])}
            /> */}
          </View>
        )}
      </View>

      {/* Animated Bottom Sheet */}
      {/* { activeSubTab.tradeTypeId === 'chart' && (
      <Animated.View style={[styles.bottomSheet, { height: animation }]}>
        <TouchableWithoutFeedback onPress={toggleDrawer}>
          <View style={styles.handleContainer}>
            <Text style={styles.handleLabel}>Place Order</Text>
            {isExpanded && (
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <X size={20} color={global.colors.textPrimary} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableWithoutFeedback>

        <View style={styles.drawerContent}>
      
 
  </View>
      </Animated.View>
      )} */}

      <Modal
        transparent
        visible={watchlistModalVisible}
        animationType="fade"
        onRequestClose={closeWatchlistModal}
      >
        <Pressable
          style={styles.watchlistOverlay}
          onPress={closeWatchlistModal}
        >
          <Pressable
            style={styles.watchlistPopup}
            onStartShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}
          >
            <View style={styles.watchlistTitleBar}>
              <Text style={styles.watchlistTitleText}>Add to Watchlist</Text>
            </View>

            {loadingWatchlists ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator
                  size="small"
                  color={global.colors.secondary}
                />
              </View>
            ) : watchlists.length > 0 ? (
              <ScrollView style={{ maxHeight: 300 }}>
                {watchlists.map((wl) => (
                  <TouchableOpacity
                    key={wl.id}
                    style={[
                      styles.watchlistRow,
                      addingToWishlist[wl.id] && { opacity: 0.6 },
                    ]}
                    disabled={addingToWishlist[wl.id]}
                    onPress={() => handleAddToWatchlist(wl)}
                  >
                    <Text style={styles.watchlistRowText}>
                      {wl.name}
                      {addingToWishlist[wl.id] && (
                        <ActivityIndicator
                          size="small"
                          color={global.colors.secondary}
                          style={{ marginLeft: 8 }}
                        />
                      )}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={{ padding: 20, alignItems: "center" }}>
                <Text
                  style={{
                    color: global.colors.textSecondary,
                    textAlign: "center",
                  }}
                >
                  No watchlists found. Please create one from your profile.
                </Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: global.colors.background },
  subMenuContainer: { paddingHorizontal: 10, paddingTop: 5, paddingBottom: 5 },
  contentContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  webview: { flex: 1, backgroundColor: "transparent" },
  divider: { height: 1, backgroundColor: global.colors.border, marginVertical: 15 },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerBtn: { padding: 4 },
  headerInfoContainer: { alignItems: 'center', flex: 1 },
  headerSymbol: { fontSize: 16, fontWeight: '800', color: global.colors.textPrimary, textTransform: 'uppercase' },
  headerPriceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  headerPrice: { fontSize: 13, fontWeight: '700', color: global.colors.textPrimary, marginRight: 6 },
  headerChange: { fontSize: 11, fontWeight: '600' },
  searchArea: {
    backgroundColor: "#F8F8F8",
    zIndex: 10,
    elevation: 10,
    position: "absolute",
    left: 0,
    right: 0,
  },
  searchRow: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6,
    backgroundColor: "#F8F8F8",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: global.colors.background,
    borderRadius: 30,
    marginHorizontal: 10,
    paddingHorizontal: 10,
    elevation: 1,
    height: 35,
    borderWidth: 1,
    borderColor: global.colors.border,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: global.colors.textPrimary,
    paddingVertical: 0,
  },
  dropdownWrapper: {
    backgroundColor: global.colors.background,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: global.colors.border,
    zIndex: 11,
    elevation: 11,
  },
  dropdownScroll: {
    maxHeight: 300,
  },
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: global.colors.border,
  },
  dropdownText: {
    fontSize: 15,
    color: global.colors.textPrimary,
    flex: 1,
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 25,
  },
  iconImage: {
    width: 20,
    height: 20,
  },
  iconImage2: {
    width: 20,
    height: 20,
    marginRight: 20,
  },

  infoScroll: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 100 },
  rangeCard: {
    backgroundColor: '#F0EDED',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
  },
  rangeRow: { marginBottom: 10 },
  rangeLabel: { fontSize: 13, color: global.colors.textSecondary, marginBottom: 8, fontWeight: '500' },
  rangeBarContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rangeValueLow: { fontSize: 13, fontWeight: '700', color: global.colors.textPrimary, width: 80 },
  rangeValueHigh: { fontSize: 13, fontWeight: '700', color: global.colors.textPrimary, width: 80, textAlign: 'right' },
  rangeProgressBg: { flex: 1, height: 4, backgroundColor: '#CCC', marginHorizontal: 10, borderRadius: 2, position: 'relative' },
  rangeProgressFill: { position: 'absolute', width: 20, height: 4, backgroundColor: '#21184F', borderRadius: 2 },

  bidAskRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  bidAskCol: { flex: 1 },
  bidAskLabel: { fontSize: 12, color: global.colors.textSecondary, marginBottom: 4 },
  bidAskLabelCentered: { fontSize: 12, color: global.colors.textSecondary, marginBottom: 4, textAlign: 'center' },
  bidAskLabelRight: { fontSize: 12, color: global.colors.textSecondary, marginBottom: 4, textAlign: 'right' },
  bidAskValue: { fontSize: 14, fontWeight: '700', color: global.colors.textPrimary },
  bidAskValueCentered: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  bidAskValueRight: { fontSize: 14, fontWeight: '700', textAlign: 'right' },

  statsListCard: {
    backgroundColor: '#F0EDED',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statsListRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  statsListBorder: {
    borderTopWidth: 1,
    borderTopColor: '#DCDCDC',
  },
  statsLabel: { fontSize: 14, color: global.colors.textSecondary, fontWeight: '500' },
  statsValue: { fontSize: 14, color: global.colors.textPrimary, fontWeight: '700' },
  watchlistOverlay: {
    flex: 1,
    backgroundColor: global.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  watchlistPopup: {
    width: 280,
    backgroundColor: global.colors.background,
    borderRadius: 12,
    padding: 16,
    maxHeight: 400,
  },
  watchlistTitleBar: {
    marginBottom: 12,
    alignItems: "center",
  },
  watchlistTitleText: {
    fontSize: 16,
    fontWeight: "600",
  },
  watchlistRow: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: global.colors.border,
  },
  watchlistRowText: {
    fontSize: 15,
    color: global.colors.textPrimary,
  },

  bottomSheet: {
    position: "absolute",
    bottom: -5,
    left: 0,
    right: 0,
    backgroundColor: global.colors.background,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
    zIndex: 100,
  },
  handleContainer: {
    height: 65,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
    backgroundColor: global.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: global.colors.border,
  },
  handleLabel: {
    fontSize: 11,
    color: global.colors.secondary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  drawerContent: { flex: 1, padding: 16 },
  closeBtn: { padding: 4 },
  orderFormContainer: {
    flex: 1,
    backgroundColor: global.colors.background,
  },
  fullscreenBackBtn: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 1000,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default StockInfoView;
