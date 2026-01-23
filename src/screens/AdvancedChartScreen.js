import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";
import { useRoute, useNavigation } from "@react-navigation/native";
import { ArrowLeft } from "lucide-react-native";
import { apiUrl, wsUrl } from "../utils/apiUrl";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const COLLAPSED_HEIGHT = 40;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.75; // Increased height for form

import TradeOrderFormNew from "../components/TradeOrderFormNew";
import TradeOrderTabs from "../components/Trade/TradeOrderTabs";
import OrdersList from "../components/OrdersList";
import PositionsList from "../components/PositionsList";
import PortfolioScreen from "./PortfolioScreen";

const AdvancedChartScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { symbol } = route.params || { symbol: "NASDAQ:AAPL" };

  const chartSymbol = symbol;

  const webViewRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const animation = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
  const [chartInterval, setChartInterval] = useState(null); // Wait for async storage
  const [injectionScript, setInjectionScript] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepareChart = async () => {
      try {
        // 1. Load Interval
        let interval = "1";
        const savedInterval = await AsyncStorage.getItem("@chart_interval");
        if (savedInterval) interval = savedInterval;
        setChartInterval(interval);

        // 2. Load Cached Data for ANY instant render
        // Fuzzy Lookup: Try strict match, then normalized match, then -EQ variations
        const candidates = [
          chartSymbol, // Exact match
          chartSymbol.includes(":") ? chartSymbol : `NSE:${chartSymbol}`, // Ensure Prefix
          chartSymbol.replace("-EQ", ""), // Remove EQ
          `NSE:${chartSymbol.replace("NSE:", "").replace("-EQ", "")}`, // Prefix + No EQ
          `${chartSymbol}-EQ`, // Add EQ
          `NSE:${chartSymbol}-EQ`, // Prefix + Add EQ
        ];

        let cachedData = null;
        let foundKey = "";

        for (const candidate of candidates) {
          const key = `@chart_cache_${candidate}_${interval}`;
          const data = await AsyncStorage.getItem(key);
          if (data) {
            cachedData = data;
            foundKey = key;
            break;
          }
        }

        if (cachedData) {
          console.log(
            "⚡ [AdvancedChart] Found cached data size:",
            cachedData.length,
            "for key:",
            foundKey,
          );
          const script = `
            window.INITIAL_CHART_DATA = ${cachedData};
            true; // note: returns true to terminate
          `;
          setInjectionScript(script);
        } else {
          console.log("⚠️ [AdvancedChart] No cache found for:", chartSymbol);
        }
      } catch (e) {
        console.error("Error preparing chart:", e);
        setChartInterval("1");
      } finally {
        setIsReady(true);
      }
    };
    prepareChart();
  }, [chartSymbol]);

  // Cleanup when user navigates away from this screen
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      // Screen is focused - chart will load normally
      console.log('📊 AdvancedChart focused');
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      // Screen lost focus - cleanup WebView
      console.log('🔴 AdvancedChart blur - cleaning up');
      if (webViewRef.current) {
        // Stop any ongoing chart operations
        webViewRef.current.injectJavaScript(`
          if (window.tvWidget) {
            try {
              window.tvWidget.remove();
            } catch(e) {}
          }
          true;
        `);
      }
    });

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  // Tabs State
  const [activeTab, setActiveTab] = useState(1);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // No navigation, just switch view
  };

  const handleMessage = (event) => {
    const { data } = event.nativeEvent;
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === "INTERVAL_CHANGED") {
        AsyncStorage.setItem("@chart_interval", parsed.interval);
        // Optional: Update state if you want to reflect it immediately,
        // though the chart already has it.
        setChartInterval(parsed.interval);
      }
    } catch (e) {
      console.log("Raw message from Chart:", data);
    }
  };

  const injectSymbol = () => {
    if (chartSymbol && webViewRef.current) {
      const script = `
            if (window.tvWidget) {
                window.tvWidget.activeChart().setSymbol('${chartSymbol}');
            }
            `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  const toggleDrawer = () => {
    const toValue = isExpanded ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT;

    Animated.timing(animation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();

    setIsExpanded(!isExpanded);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar with Back Button & Tabs */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            marginRight: 10,
            backgroundColor: "#210F47",
            padding: 8,
            borderRadius: 20,
          }}
        >
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <TradeOrderTabs activeTab={activeTab} onTabChange={handleTabChange} />
        </View>
      </View>

      {/* Render Content Based on Tab */}
      <View style={styles.contentContainer}>
        {activeTab === 1 && (
          <>
            {/* Main Chart */}
            {isReady && chartInterval && (
              <WebView
                ref={webViewRef}
                source={{
                  uri: `${apiUrl}/charting_library-master/mobile_white.html?symbol=${chartSymbol}&interval=${chartInterval}`,
                }}
                style={styles.webview}
                originWhitelist={["*"]}
                onMessage={handleMessage}
                onLoadEnd={injectSymbol}
                injectedJavaScriptBeforeContentLoaded={injectionScript}
              />
            )}

            {/* Animated Bottom Sheet */}
            <Animated.View style={[styles.bottomSheet, { height: animation }]}>
              <TouchableWithoutFeedback onPress={toggleDrawer}>
                <View style={styles.handleContainer}>
                  <View style={styles.handle} />
                  <Text style={styles.handleText}>
                    {isExpanded ? "Hide Trade" : "Trade Order"}
                  </Text>
                </View>
              </TouchableWithoutFeedback>

              <View style={styles.drawerContent}>
                <TradeOrderFormNew
                  symbol={chartSymbol.replace("NSE:", "").replace("BSE:", "")}
                  exchange={chartSymbol.startsWith("BSE:") ? "BSE" : "NSE"}
                  onOrderPlaced={() => {
                    // Alert.alert("Success", "Order Placed"); // Form handles alert usually, or we can enable this
                    toggleDrawer(); // Close after order
                  }}
                />
              </View>
            </Animated.View>
          </>
        )}

        {activeTab === 2 && (
          <View style={{ flex: 1 }}>
            <OrdersList />
          </View>
        )}

        {activeTab === 3 && (
          <View style={{ flex: 1 }}>
            <PositionsList />
          </View>
        )}

        {activeTab === 4 && (
          <View style={{ flex: 1 }}>
            <PortfolioScreen />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 50,
    paddingLeft: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
    position: "relative",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  handleContainer: {
    height: COLLAPSED_HEIGHT,
    width: "100%",
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#ccc",
    borderRadius: 2,
    marginBottom: 4,
  },
  handleText: {
    fontSize: 10,
    color: "#666",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  drawerContent: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
});

export default AdvancedChartScreen;
