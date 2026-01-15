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
import { WebView } from "react-native-webview";
import { useRoute, useNavigation } from "@react-navigation/native";
import { ArrowLeft } from "lucide-react-native";
import { apiUrl, wsUrl } from "../utils/apiUrl";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const COLLAPSED_HEIGHT = 40;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.75; // Increased height for form

import TradeOrderForm from "../components/TradeOrderForm";

const AdvancedChartScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { symbol } = route.params || { symbol: "NASDAQ:AAPL" };

  const chartSymbol = symbol;

  const webViewRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const animation = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;

  const handleMessage = (event) => {
    const { data } = event.nativeEvent;
    try {
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
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{symbol}</Text>
      </View>

      {/* Main Chart */}
      <WebView
        ref={webViewRef}
        source={{
          uri: `${apiUrl}/charting_library-master/mobile_white.html?symbol=${chartSymbol}`,
        }}
        style={styles.webview}
        originWhitelist={["*"]}
        // javaScriptEnabled={true}
        // domStorageEnabled={true}
        onMessage={handleMessage}
        onLoadEnd={injectSymbol}
      />

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
          {/* Render Form when at least partially expanded or just always render (hidden by height) */}
          <TradeOrderForm
            symbol={chartSymbol.replace("NSE:", "").replace("BSE:", "")}
            exchange={chartSymbol.startsWith("BSE:") ? "BSE" : "NSE"}
            onOrderPlaced={() => {
              Alert.alert("Success", "Order Placed");
              toggleDrawer(); // Close after order
            }}
          />
        </View>
      </Animated.View>
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
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
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
    backgroundColor: "#fff",
  },
});

export default AdvancedChartScreen;
