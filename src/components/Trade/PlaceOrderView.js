import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import { apiUrl } from "../../utils/apiUrl";
import TradeOrderFormNew from "../TradeOrderFormNew";
import { X} from 'lucide-react-native';

const SCREEN_HEIGHT = Dimensions.get("window").height;
const COLLAPSED_HEIGHT = 40;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.75;

const PlaceOrderView = ({ symbol }) => {
  const navigation = useNavigation();
  const chartSymbol = symbol;

  const webViewRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const animation = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
  const [chartInterval, setChartInterval] = useState(null);
  const [injectionScript, setInjectionScript] = useState("");
  const [isReady, setIsReady] = useState(false);

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
          const script = `
            window.INITIAL_CHART_DATA = ${cachedData};
            true;
          `;
          setInjectionScript(script);
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

  // Handle Focus/Blur to pause/resume chart if needed (or cleanup)
  useEffect(() => {
    const unsubscribeBlur = navigation.addListener("blur", () => {
      // Screen lost focus - cleanup WebView or stop operations
      // Note: Since we are in a tab that might be hidden, we handle this carefully
      if (webViewRef.current) {
        // Optional: Freeze chart or stop updates
      }
    });

    return unsubscribeBlur;
  }, [navigation]);

  const handleMessage = (event) => {
    const { data } = event.nativeEvent;
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === "INTERVAL_CHANGED") {
        AsyncStorage.setItem("@chart_interval", parsed.interval);
        setChartInterval(parsed.interval);
      }
    } catch (e) {
      // console.log("Raw message:", data);
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

  const handleClose = () => {
    Animated.timing(animation, {
      toValue: COLLAPSED_HEIGHT,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsExpanded(false);
  };

  return (
    <View style={styles.container}>
      {isReady && chartInterval && (
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

      {/* Animated Bottom Sheet */}
      <Animated.View style={[styles.bottomSheet, { height: animation }]}>
        <TouchableWithoutFeedback onPress={toggleDrawer}>
          <View style={[styles.handleContainer, { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingRight: 15 }]}>
            <Text
              style={{
                fontSize: 10,
                color: global.colors.textSecondary,
                fontWeight: "600",
                textTransform: "uppercase",
                paddingLeft: 10,
              }}
            >
              Place Order
            </Text>
            {isExpanded && (
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <X size={20} color={global.colors.textPrimary} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableWithoutFeedback>

        <View style={styles.drawerContent}>
          <TradeOrderFormNew
            symbol={chartSymbol.replace("NSE:", "").replace("BSE:", "")}
            exchange={chartSymbol.startsWith("BSE:") ? "BSE" : "NSE"}
            onOrderPlaced={() => {
              toggleDrawer();
            }}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: global.colors.background,
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  closeBtn: {
    padding: 5,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 75,
    left: 0,
    right: 0,
    backgroundColor: global.colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: global.colors.overlay,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  handleContainer: {
    height: COLLAPSED_HEIGHT,
    width: "100%",
    backgroundColor: global.colors.background,
    borderTopLeftRadius: 16,
    paddingVertical: 10,

    borderTopRightRadius: 50,
  },
  handleText: {
    textAlign: "left",
    fontSize: 10,
    color: global.colors.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  drawerContent: {
    flex: 1,
    padding: 20,
    backgroundColor: global.colors.background,
  },
});

export default PlaceOrderView;
