import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAlert } from "../context/AlertContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useRealtimePrices } from "../hooks/useRealtimePrices";
import { subscribeSymbols, unsubscribeDelayed } from "../ws/marketSubscriptions";

import { apiUrl } from "../utils/apiUrl";
import { getDeviceId } from "../utils/deviceId";
import { useAuth } from "../context/AuthContext";

import OrderInputNew from "./OrderInputNew";

const { width } = Dimensions.get("window");

export default function TradeOrderFormNative({
  symbol,
  token,
  name,
  price: initialPrice = "0",
  quantity: initialQty = "1",
  target: initialTarget = "0",
  stoploss: initialStoploss = "0",
  exchange = "NSE",
  internaltype = "Fresh",
  orderid,
  onClose,
  onOrderPlaced,
}) {
  const navigation = useNavigation();
  const { authToken } = useAuth();
  const { showSuccess, showError } = useAlert();
  const { prices } = useRealtimePrices();

  // -- State --
  const [transactionType, setTransactionType] = useState("BUY"); // BUY or SELL
  const [selectedExchange, setSelectedExchange] = useState(exchange);
  const [productType, setProductType] = useState("INTRADAY"); // INTRADAY, MARGIN, DELIVERY

  // Prices
  const [nseLtp, setNseLtp] = useState("0.00");
  const [bseLtp, setBseLtp] = useState("0.00");

  // Inputs
  const [price, setPrice] = useState(String(initialPrice));
  const [qty, setQty] = useState(String(initialQty));
  const [target, setTarget] = useState(String(initialTarget));
  const [stopLoss, setStopLoss] = useState(String(initialStoploss));

  // Funds & Charges
  const [balance, setBalance] = useState(0);
  const [orderValue, setOrderValue] = useState(0);
  const [brokerage, setBrokerage] = useState(50); // Using 50 as default shown in image
  const [charges, setCharges] = useState(0);
  const [taxes, setTaxes] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);

  const [loading, setLoading] = useState(false);
  const [isUserTypedPrice, setIsUserTypedPrice] = useState(false);
  const [userTypedTime, setUserTypedTime] = useState(null);

  // Formatting helpers
  const format2 = (num) => Number(num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const format0 = (num) => Number(num || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  // --- Effects ---

  // 1. Fetch LTP Loop (Fallback for WS or initial load)
  const fetchLtp = async () => {
    try {
      if (isUserTypedPrice && userTypedTime && Date.now() - userTypedTime < 60000) return;

      const res = await fetch(
        `${apiUrl}/api/buyshare/search?symbol=${symbol}&exchange=${selectedExchange}`,
        { headers: { Authorization: "Bearer " + authToken } },
      );
      const data = await res.json();

      if (data.success) {
        const ltp = parseFloat(data.ltp || 0).toFixed(2);
        if (selectedExchange === "NSE") setNseLtp(ltp);
        else setBseLtp(ltp);

        if (!isUserTypedPrice || price === "0") {
          setPrice(ltp);
        }
      }
    } catch (err) {
      console.log("LTP Error:", err.message);
    }
  };

  useEffect(() => {
    fetchLtp();
    const t = setInterval(fetchLtp, 5000);
    return () => clearInterval(t);
  }, [selectedExchange, symbol, isUserTypedPrice]);

  // Sync WS price
  useEffect(() => {
    const key = symbol?.toUpperCase().trim();
    const rtData = prices?.[key] || prices?.[key + '-EQ'] || prices?.[`${selectedExchange}:${key}`] || {};
    const rtPrice = rtData?.price;
    if (!rtPrice || rtPrice <= 0) return;

    const ltpStr = parseFloat(rtPrice).toFixed(2);
    if (selectedExchange === 'NSE') setNseLtp(ltpStr);
    else setBseLtp(ltpStr);

    if (!isUserTypedPrice || price === "0") {
      setPrice(ltpStr);
    }
  }, [prices, symbol, selectedExchange]);

  // 2. Fetch Funds
  const fetchFunds = async () => {
    try {
      const res = await fetch(
        `${apiUrl}/api/fundandmargin/get?segment=${productType}`,
        { headers: { Authorization: "Bearer " + authToken } },
      );
      const data = await res.json();
      if (data.success) {
        setBalance(Number(data.amountAvail || 0));
      }
    } catch (err) {
      console.log("Fund API error:", err.message);
    }
  };

  useEffect(() => {
    fetchFunds();
  }, [productType, authToken]);

  // 3. Brokerage & Charges
  const fetchCharges = async () => {
    try {
      const P = parseFloat(price) || parseFloat(selectedExchange === "NSE" ? nseLtp : bseLtp) || 0;
      const Q = parseInt(qty) || 0;
      if (Q <= 0) return;

      const url = `${apiUrl}/api/brokerage/calculate?price=${P}&quantity=${Q}&segment=${productType}&symbol=${symbol}&exchange=${selectedExchange}`;

      const res = await fetch(url, {
        headers: { Authorization: "Bearer " + authToken },
      });
      const data = await res.json();
      if (data.success) {
        setBrokerage(Number(data.angelOneBrokerage || 50));
        setCharges(Number(data.externalCharges || 0));
        setTaxes(Number(data.taxes || 0));
      }
    } catch (err) {
      console.log("Brokerage Error:", err.message);
    }
  };

  useEffect(() => {
    fetchCharges();
  }, [price, qty, productType, selectedExchange, nseLtp, bseLtp]);

  // 4. Calculations
  useEffect(() => {
    const p = parseFloat(price) || parseFloat(selectedExchange === "NSE" ? nseLtp : bseLtp) || 0;
    const q = parseInt(qty) || 0;
    const ov = p * q;
    setOrderValue(ov);

    const totalCharges = brokerage + charges + taxes;
    setClosingBalance(balance - (ov + totalCharges));
  }, [price, qty, balance, brokerage, charges, taxes, nseLtp, bseLtp, selectedExchange]);

  // --- Handlers ---
  const handlePriceChange = (val) => {
    setIsUserTypedPrice(true);
    setUserTypedTime(Date.now());
    setPrice(val);
  };

  const placeOrder = async () => {
    setLoading(true);
    try {
      if (!authToken) {
        showError("Alert", "Please login to place orders.");
        return;
      }

      const userId = await AsyncStorage.getItem("userId");
      const deviceId = await getDeviceId();
      const p = parseFloat(price) || 0;
      const isModify = internaltype?.toLowerCase() === "modify";

      const payload = {
        variety: "NORMAL",
        tradingsymbol: symbol,
        symboltoken: token || "",
        transactiontype: transactionType,
        exchange: selectedExchange,
        ordertype: p === 0 ? "MARKET" : "LIMIT",
        producttype: productType,
        duration: "DAY",
        price: p,
        squareoff: "0",
        stoploss: parseFloat(stopLoss || 0),
        quantity: parseFloat(qty),
        scripconsent: "yes",
      };

      if (isModify) {
        payload.orderid = orderid;
      }

      const endpoint = isModify ? "/api/order/modify" : "/api/order/place";
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + authToken,
          userid: userId,
          device_mac: deviceId,
          internaltype: internaltype,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.angelResponse?.message === "SUCCESS" || data.success) {
        showSuccess("Success", isModify ? "Order Modified Successfully." : "Order Placed Successfully.");
        if (onOrderPlaced) onOrderPlaced();
        if (onClose) onClose();
      } else {
        showError("Alert", data.message || "Failed to process order.");
      }
    } catch (err) {
      showError("Alert", err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentPrice = selectedExchange === "NSE" ? nseLtp : bseLtp;
  const rtData = prices?.[symbol] || prices?.[symbol + '-EQ'] || {};
  const changeVal = rtData.change || 0;
  const changePct = rtData.changePercent || 0;
  const isPositive = changeVal >= 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Place Order</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={global.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stock Info Card */}
        <View style={styles.stockCard}>
          <View style={styles.stockInfoLeft}>
            <Text style={styles.stockName}>{name || symbol}</Text>
            <Text style={styles.stockSymbol}>{symbol}</Text>
          </View>
          <View style={styles.stockInfoRight}>
            <Text style={styles.currentPrice}>₹ {format2(currentPrice)}</Text>
            <Text style={[styles.priceChange, { color: isPositive ? global.colors.success : global.colors.error }]}>
              {isPositive ? "+" : ""} ₹{format2(changeVal)} ({format2(changePct)}%)
            </Text>
          </View>
        </View>

        {/* Buy/Sell Togggles & Exchange */}
        <View style={styles.actionRow}>
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleBtn, transactionType === "BUY" && styles.buyActive]} 
              onPress={() => setTransactionType("BUY")}
            >
              <Text style={[styles.toggleText, transactionType === "BUY" && styles.activeText]}>Buy</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, transactionType === "SELL" && styles.sellActive]} 
              onPress={() => setTransactionType("SELL")}
            >
              <Text style={[styles.toggleText, transactionType === "SELL" && styles.activeText]}>Sell</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.exchangeSelector} onPress={() => setSelectedExchange(selectedExchange === "NSE" ? "BSE" : "NSE")}>
            <Text style={styles.exchangeText}>{selectedExchange}</Text>
            <Ionicons name="chevron-down" size={16} color={global.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Product Type Tabs */}
        <View style={styles.tabContainer}>
          {["INTRADAY", "MARGIN", "DELIVERY"].map((type) => (
            <TouchableOpacity 
              key={type} 
              style={[styles.tab, productType === type && styles.activeTab]} 
              onPress={() => setProductType(type)}
            >
              <Text style={[styles.tabText, productType === type && styles.activeTabText]}>
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Inputs Grid */}
        <View style={styles.inputGrid}>
          <OrderInputNew label="Price" value={price} onChange={handlePriceChange} style={styles.gridInput} />
          <OrderInputNew label="Quantity" value={qty} onChange={setQty} style={styles.gridInput} />
          <OrderInputNew label="Target" value={target} onChange={setTarget} style={styles.gridInput} />
          <OrderInputNew label="Stop Loss" value={stopLoss} onChange={setStopLoss} style={styles.gridInput} />
        </View>

        {/* Financial Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Balance available</Text>
              <Text style={styles.summaryValue}>₹{format0(balance)}</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Order value</Text>
              <Text style={styles.summaryValue}>₹{format0(orderValue)}</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Brokerage</Text>
              <Text style={styles.summaryValue}>₹{format0(brokerage)}</Text>
            </View>
          </View>

          <View style={[styles.summaryRow, { marginTop: 20 }]}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Charges</Text>
              <Text style={styles.summaryValue}>₹{format0(charges + taxes)}</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Closing balance</Text>
              <Text style={styles.summaryValue}>₹{format0(closingBalance)}</Text>
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={() => { fetchFunds(); fetchLtp(); fetchCharges(); }}>
              <Ionicons name="refresh" size={24} color={global.colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.orderBtn} onPress={placeOrder} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.orderBtnText}>Order {">>"}</Text>
          )}
        </TouchableOpacity>
        <View style={styles.angelContainer}>
           <Image source={require("../../assets/angelone.png")} style={styles.angelLogo} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: global.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: global.colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: global.colors.textPrimary,
  },
  closeBtn: {
    padding: 5,
  },
  scrollContent: {
    padding: 20,
  },
  stockCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // Elevation for Android
    elevation: 4,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 20,
  },
  stockName: {
    fontSize: 18,
    fontWeight: "700",
    color: global.colors.textPrimary,
  },
  stockSymbol: {
    fontSize: 12,
    color: global.colors.textSecondary,
    marginTop: 4,
    textTransform: "uppercase",
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: global.colors.textPrimary,
    textAlign: "right",
  },
  priceChange: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "right",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 4,
    flex: 1,
    marginRight: 15,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  buyActive: {
    backgroundColor: global.colors.success,
  },
  sellActive: {
    backgroundColor: global.colors.error,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: global.colors.textSecondary,
  },
  activeText: {
    color: "#FFF",
  },
  exchangeSelector: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: global.colors.border,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#FFF",
  },
  exchangeText: {
    fontSize: 14,
    fontWeight: "700",
    color: global.colors.textPrimary,
    marginRight: 5,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: global.colors.border,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: "#E6E0F5", // Light purple as in mockup
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: global.colors.textSecondary,
  },
  activeTabText: {
    color: global.colors.secondary,
    fontWeight: "700",
  },
  inputGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridInput: {
    width: "48%",
  },
  summarySection: {
    marginTop: 10,
    paddingVertical: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: global.colors.textSecondary,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "700",
    color: global.colors.textPrimary,
  },
  refreshBtn: {
    justifyContent: "center",
    alignItems: "center",
    padding: 5,
  },
  footer: {
    padding: 20,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  orderBtn: {
    flex: 1,
    backgroundColor: global.colors.secondary,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    // Elevation
    shadowColor: global.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  orderBtnText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
  angelContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: global.colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  angelLogo: {
    width: 35,
    height: 35,
    resizeMode: "contain",
  },
});
