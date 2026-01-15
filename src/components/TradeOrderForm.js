import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SwipeButton from "rn-swipe-button";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

import { apiUrl } from "../utils/apiUrl";
import { getDeviceId } from "../utils/deviceId";
import { useAuth } from "../context/AuthContext";

import NseBseRadioBox from "./NseBseRadioBox";
import OrderTopMenu from "./OrderTopMenu";
import OrderInputBox from "./OrderInputBox";

export default function TradeOrderForm({
  symbol,
  token, // Optional, if not passed we might need to look it up or rely on backend
  exchange = "NSE",
  onOrderPlaced, // Callback on success
}) {
  const navigation = useNavigation();
  const { authToken, setAuthData } = useAuth();

  // -- State from TradeOrderScreen --

  const [selected, setSelected] = useState(exchange); // NSE/BSE
  const [segment, setSegment] = useState("INTRADAY");
  const [selectedMenu, setSelectedMenu] = useState("Intraday");

  // Prices
  const [nseLtp, setNseLtp] = useState("0.00");
  const [bseLtp, setBseLtp] = useState("0.00");

  // Inputs
  const [price, setPrice] = useState("0");
  const [qty, setQty] = useState("1");
  const [target, setTarget] = useState("0");
  const [stopLoss, setStopLoss] = useState("0");

  // Validations
  const [validationErrors, setValidationErrors] = useState([]);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isPriceValid, setIsPriceValid] = useState(true);
  const [isQtyValid, setIsQtyValid] = useState(true);
  const [isTargetValid, setIsTargetValid] = useState(true);
  const [isStopLossValid, setIsStopLossValid] = useState(true);
  const [isOrderValid, setIsOrderValid] = useState(false);

  // Funds & Charges
  const [balance, setBalance] = useState("0");
  const [brokerage, setBrokerage] = useState("0");
  const [charges, setCharges] = useState("0");
  const [taxes, setTaxes] = useState("0");
  const [orderValue, setOrderValue] = useState("0");
  const [closingBalance, setClosingBalance] = useState("0");

  const [isUserTypedPrice, setIsUserTypedPrice] = useState(false);
  const [userTypedTime, setUserTypedTime] = useState(null);
  const [swipeKey, setSwipeKey] = useState(Date.now());
  const [showAngelOneModal, setShowAngelOneModal] = useState(false);

  // Formatting helpers
  const format2 = (num) => parseFloat(num || 0).toFixed(2);
  const format4 = (num) => parseFloat(num || 0).toFixed(4);

  // --- Mappings ---
  const menuItems = [
    { id: 1, name: "Intraday" },
    { id: 2, name: "Margin" },
    { id: 3, name: "Delivery" },
  ];

  const handleSegmentChange = (name) => {
    const map = {
      Intraday: "INTRADAY",
      Margin: "MARGIN",
      Delivery: "DELIVERY",
    };
    setSegment(map[name]);
  };

  // --- Effects ---

  // 1. Fetch LTP Loop
  const fetchLtp = async () => {
    try {
      // Don't overwrite if user typed recently
      if (
        isUserTypedPrice &&
        userTypedTime &&
        Date.now() - userTypedTime < 60000
      ) {
        return;
      }

      const ex = selected;
      // Note: Using 'symbol' prop. Ensure it matches what backend expects (e.g. RELIANCE-EQ)
      const res = await fetch(
        `${apiUrl}/api/buyshare/search?symbol=${symbol}&exchange=${ex}`,
        { headers: { Authorization: "Bearer " + authToken } }
      );
      const data = await res.json();

      if (data.success) {
        const ltp = parseFloat(data.ltp || 0).toFixed(2);
        if (ex === "NSE") setNseLtp(`₹${ltp}`);
        else setBseLtp(`₹${ltp}`);

        // Auto-update price field for Market orders (0) or if user hasn't typed
        if (!isUserTypedPrice || price === "0") {
          // Optional: Decide if we want to auto-fill input
          // For now, keeping logic similar to TradeOrderScreen but cleaner
        }
      }
    } catch (err) {
      console.log("LTP Error:", err.message);
    }
  };

  useEffect(() => {
    fetchLtp();
    const t = setInterval(fetchLtp, 3000);
    return () => clearInterval(t);
  }, [selected, symbol, isUserTypedPrice]);

  // 2. Fetch Funds
  const fetchFunds = async (segmentType) => {
    try {
      const res = await fetch(
        `${apiUrl}/api/fundandmargin/get?segment=${segmentType}`,
        { headers: { Authorization: "Bearer " + authToken } }
      );
      const data = await res.json();
      if (data.success) {
        setBalance(data.amountAvail || "0");
      }
    } catch (err) {
      console.log("Fund API error:", err.message);
    }
  };

  useEffect(() => {
    fetchFunds(segment);
  }, [segment]);

  // 3. Brokerage
  const fetchBrokerage = async () => {
    try {
      const symbolToken = token || ""; // Need token from somewhere ideally
      let liveLtp =
        parseFloat(
          selected === "NSE" ? nseLtp.replace("₹", "") : bseLtp.replace("₹", "")
        ) || 0;

      const P = parseFloat(price) === 0 ? liveLtp : parseFloat(price);

      const url = `${apiUrl}/api/brokerage/calculate?price=${P}&quantity=${qty}&segment=${segment}&symbol=${symbol}&symboltoken=${symbolToken}&exchange=${selected}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: "Bearer " + authToken,
          Accept: "application/json",
        },
      });
      const data = await res.json();
      if (data.success) {
        setBrokerage(data.angelOneBrokerage);
        setCharges(data.externalCharges);
        setTaxes(data.taxes);
      }
    } catch (err) {
      console.log("Brokerage Error:", err.message);
    }
  };

  useEffect(() => {
    if (qty) fetchBrokerage();
  }, [price, qty, segment, selected, nseLtp, bseLtp]);

  // 4. Calculations & Validations
  const runValidations = () => {
    const errors = [];
    const cleanLtp = (raw) => {
      if (!raw) return 0;
      return Number(String(raw).replace(/[^\d.]/g, "")) || 0;
    };

    const p = parseFloat(price?.trim() || "0");
    const q = parseInt(qty?.trim() || "0");
    const ltp = cleanLtp(selected === "NSE" ? nseLtp : bseLtp);
    const br = parseFloat(brokerage || 0);
    const ch = parseFloat(charges || 0);
    const tx = parseFloat(taxes || 0);
    const bal = parseFloat(balance || 0);

    if (p < 0) errors.push("Price cannot be negative.");
    if (p > 0) {
      // Limit order check
      const lower = ltp * 0.8;
      const upper = ltp * 1.2;
      if (p < lower || p > upper) {
        errors.push(`Limit price must be within 20% of LTP`);
      }
    }
    if (q <= 0) errors.push("Quantity must be greater than 0.");

    const totalCost = p * q + br + ch + tx;
    // if (totalCost > bal) errors.push("Insufficient balance.");
    // ^ Relaxed for display, but can enforce strict check

    setValidationErrors(errors);
    return errors.length === 0;
  };

  useEffect(() => {
    let p = parseFloat(price) || 0;
    const q = parseInt(qty) || 0;
    const ltp =
      parseFloat((selected === "NSE" ? nseLtp : bseLtp).replace("₹", "")) || 0;

    if (p === 0) p = ltp;

    const ov = p * q;
    setOrderValue(ov);
    const combined =
      parseFloat(brokerage || 0) +
      parseFloat(charges || 0) +
      parseFloat(taxes || 0);
    setClosingBalance(balance - (ov + combined));

    const ok = runValidations();
    setIsOrderValid(ok);
  }, [
    price,
    qty,
    target,
    stopLoss,
    balance,
    brokerage,
    charges,
    taxes,
    nseLtp,
    bseLtp,
  ]);

  // --- Input Handlers ---
  const handleNumericInput = (val, setter) => {
    if (val !== "" && isNaN(val)) return;
    if (val === "" || val === null) {
      setter("0");
      return;
    }
    if (val.length > 1 && val.startsWith("0") && !val.startsWith("0.")) {
      val = val.replace(/^0+/, "");
      if (val === "") val = "0";
    }
    setter(val);
  };

  const handleUserPriceInput = (val) => {
    setIsUserTypedPrice(true);
    setUserTypedTime(Date.now());
    handleNumericInput(val, setPrice);
  };

  useEffect(() => {
    if (!isUserTypedPrice) return;
    const timer = setTimeout(() => setIsUserTypedPrice(false), 3000);
    return () => clearTimeout(timer);
  }, [isUserTypedPrice]);

  // --- Place Order ---
  const placeOrder = async (transactionType = "BUY") => {
    try {
      if (!authToken) {
        Alert.alert("Login Required", "Please login to place orders.");
        return;
      }
      if (!isOrderValid) {
        setShowTooltip(true);
        setSwipeKey(Date.now());
        return;
      }

      const userId = await AsyncStorage.getItem("userId");
      const deviceId = await getDeviceId();
      const p = parseFloat(price?.trim() || "0");

      const payload = {
        variety: "NORMAL",
        tradingsymbol: symbol,
        symboltoken: token || "", // Need to handle missing token
        transactiontype: transactionType,
        exchange: selected,
        ordertype: p === 0 ? "MARKET" : "LIMIT",
        producttype: segment,
        duration: "DAY",
        price: p === 0 ? 0 : p,
        squareoff: "0",
        stoploss: parseFloat(stopLoss || 0),
        quantity: parseFloat(qty),
        scripconsent: "yes",
      };

      const res = await fetch(`${apiUrl}/api/order/place`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + authToken,
          userid: userId,
          device_mac: deviceId,
          internaltype: "Fresh", // Defaulting to fresh
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.angelResponse?.message === "SUCCESS") {
        Alert.alert("Success", "Order Placed Successfully.");
        if (onOrderPlaced) onOrderPlaced();
        // Reset or Navigate?
      } else {
        Alert.alert("Failed", JSON.stringify(data));
      }
      setSwipeKey(Date.now());
    } catch (err) {
      Alert.alert("Error", err.message);
      setSwipeKey(Date.now());
    }
  };

  return (
    <View style={styles.container}>
      {/* --- Switcher & Menu --- */}
      <View style={styles.topRow}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <NseBseRadioBox
            selected={selected}
            nseLtp={nseLtp}
            bseLtp={bseLtp}
            onSelect={setSelected}
          />
        </View>
        <View style={{ flex: 1.5 }}>
          <OrderTopMenu
            items={menuItems}
            defaultSelected={selectedMenu}
            onSelect={(name) => {
              setSelectedMenu(name);
              handleSegmentChange(name);
            }}
          />
        </View>
      </View>

      <ScrollView
        style={styles.formScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inputsGrid}>
          <OrderInputBox
            label="Price"
            value={price}
            onChange={handleUserPriceInput}
            isValid={isPriceValid}
            onWarningPress={() => setShowTooltip(true)}
          />
          <OrderInputBox
            label="Quantity"
            value={qty}
            onChange={(v) => handleNumericInput(v, setQty)}
            isValid={isQtyValid}
            onWarningPress={() => setShowTooltip(true)}
          />

          {/* Optional Fields - can hide to save space in bottom sheet */}
          <OrderInputBox
            label="Target"
            value={target}
            onChange={(v) => handleNumericInput(v, setTarget)}
            isValid={isTargetValid}
            onWarningPress={() => setShowTooltip(true)}
          />
          <OrderInputBox
            label="Stop Loss"
            value={stopLoss}
            onChange={(v) => handleNumericInput(v, setStopLoss)}
            isValid={isStopLossValid}
            onWarningPress={() => setShowTooltip(true)}
          />
        </View>

        {/* --- Summary --- */}
        <View style={styles.summaryBox}>
          <View style={styles.row}>
            <Text style={styles.label}>Balance: ₹{format4(balance)}</Text>
            <Text style={styles.label}>Req: ₹{format2(orderValue)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>
              Charges: ₹
              {format2(
                parseFloat(brokerage) + parseFloat(charges) + parseFloat(taxes)
              )}
            </Text>
            <Ionicons
              name="refresh"
              size={16}
              color="#210F47"
              onPress={() => {
                fetchFunds(segment);
                fetchLtp();
                fetchBrokerage();
              }}
            />
          </View>
        </View>
      </ScrollView>

      {/* --- Actions --- */}
      <View style={styles.actionRow}>
        <View style={{ flex: 1, paddingRight: 6 }}>
          <TouchableOpacity
            style={[styles.btn, styles.buyBtn]}
            onPress={() => placeOrder("BUY")}
          >
            <Text style={styles.btnText}>BUY</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, paddingLeft: 6 }}>
          <TouchableOpacity
            style={[styles.btn, styles.sellBtn]}
            onPress={() => placeOrder("SELL")}
          >
            <Text style={styles.btnText}>SELL</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- Tooltip Modal --- */}
      <Modal
        visible={showTooltip}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTooltip(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚠ Order Issues</Text>
            {validationErrors.map((e, i) => (
              <Text key={i} style={styles.errorText}>
                • {e}
              </Text>
            ))}
            <TouchableOpacity
              onPress={() => setShowTooltip(false)}
              style={styles.modalBtn}
            >
              <Text style={styles.modalBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  topRow: {
    flexDirection: "column", // Stack them for small width
    marginBottom: 10,
    gap: 10,
  },
  formScroll: {
    flex: 1,
  },
  inputsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  summaryBox: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: "#555",
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    paddingBottom: 20,
  },
  btn: {
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  buyBtn: {
    backgroundColor: "#4CAF50",
  },
  sellBtn: {
    backgroundColor: "#da3e30", // Red
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  errorText: { fontSize: 13, marginBottom: 4, color: "#333" },
  modalBtn: {
    marginTop: 15,
    paddingVertical: 10,
    backgroundColor: "#210F47",
    borderRadius: 8,
  },
  modalBtnText: { color: "#fff", textAlign: "center", fontSize: 14 },
});
