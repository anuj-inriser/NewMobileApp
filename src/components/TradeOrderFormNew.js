import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAlert } from "../context/AlertContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";

import { apiUrl } from "../utils/apiUrl";
import { getDeviceId } from "../utils/deviceId";
import { useAuth } from "../context/AuthContext";

import NseBseRadioBox from "./NseBseRadioBox";
import OrderTopMenu from "./OrderTopMenu";
import OrderInputNew from "./OrderInputNew"; // New Input Component

export default function TradeOrderFormNew({
  symbol,
  token,
  exchange = "NSE",
  onOrderPlaced,
}) {
  const navigation = useNavigation();
  const { authToken } = useAuth();
  const { showSuccess, showError } = useAlert();
  // -- State --
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
      if (
        isUserTypedPrice &&
        userTypedTime &&
        Date.now() - userTypedTime < 60000
      ) {
        return;
      }

      const ex = selected;
      const res = await fetch(
        `${apiUrl}/api/buyshare/search?symbol=${symbol}&exchange=${ex}`,
        { headers: { Authorization: "Bearer " + authToken } },
      );
      const data = await res.json();

      if (data.success) {
        const ltp = parseFloat(data.ltp || 0).toFixed(2);
        if (ex === "NSE") setNseLtp(`₹${ltp}`);
        else setBseLtp(`₹${ltp}`);

        if (!isUserTypedPrice || price === "0") {
          // Auto-fill logic could go here if desired
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
        { headers: { Authorization: "Bearer " + authToken } },
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
      const symbolToken = token || "";
      let liveLtp =
        parseFloat(
          selected === "NSE"
            ? nseLtp.replace("₹", "")
            : bseLtp.replace("₹", ""),
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

    if (p < 0) errors.push("Price cannot be negative.");
    if (p > 0) {
      const lower = ltp * 0.8;
      const upper = ltp * 1.2;
      if (p < lower || p > upper) {
        errors.push(`Limit price must be within 20% of LTP`);
      }
    }
    if (q <= 0) errors.push("Quantity must be greater than 0.");

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
        showError(
          "Alert",
          "Please login to place orders."
        );
        return;
      }
      if (!isOrderValid) {
        setShowTooltip(true);
        return;
      }

      const userId = await AsyncStorage.getItem("userId");
      const deviceId = await getDeviceId();
      const p = parseFloat(price?.trim() || "0");

      const payload = {
        variety: "NORMAL",
        tradingsymbol: symbol,
        symboltoken: token || "",
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
          internaltype: "Fresh",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.angelResponse?.message === "SUCCESS") {
        showSuccess(
          "Success",
          "Order Placed Successfully."
        );
        if (onOrderPlaced) onOrderPlaced();
      } else {
        showError(
          "Alert",
          JSON.stringify(data)
        );
      }
    } catch (err) {
      showError(
        "Alert",
        err.message
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* 
        NOTE: Removed Top Drag Handle from styling here as it's typically part of parent component (BottomSheet).
        If needed, parent controls padding.
      */}

      {/* --- NSE/BSE & Menu --- */}
      <View style={styles.topSection}>
        {/* Toggle */}
        <View style={styles.toggleRow}>
          <NseBseRadioBox
            selected={selected}
            nseLtp={nseLtp}
            bseLtp={bseLtp}
            onSelect={setSelected}
          />
        </View>
        {/* Order Type Tabs */}
        <View style={styles.menuRow}>
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
          {/* Row 1 */}
          <OrderInputNew
            label="Price"
            value={price}
            onChange={handleUserPriceInput}
            isValid={isPriceValid}
            onWarningPress={() => setShowTooltip(true)}
          />
          <OrderInputNew
            label="Quantity"
            value={qty}
            onChange={(v) => handleNumericInput(v, setQty)}
            isValid={isQtyValid}
            onWarningPress={() => setShowTooltip(true)}
          />
          {/* Row 2 */}
          <OrderInputNew
            label="Target"
            value={target}
            onChange={(v) => handleNumericInput(v, setTarget)}
            isValid={isTargetValid}
            onWarningPress={() => setShowTooltip(true)}
          />
          <OrderInputNew
            label="Stop Loss"
            value={stopLoss}
            onChange={(v) => handleNumericInput(v, setStopLoss)}
            isValid={isStopLossValid}
            onWarningPress={() => setShowTooltip(true)}
          />
        </View>

        {/* --- Summary --- */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Balance available</Text>
              <Text style={styles.summaryValue}>₹{format2(balance)}</Text>
            </View>
            <View>
              <Text style={styles.summaryLabel}>Order value</Text>
              <Text style={styles.summaryValue}>₹{format2(orderValue)}</Text>
            </View>
            <View>
              <Text style={styles.summaryLabel}>Brokerage</Text>
              <Text style={styles.summaryValue}>₹50</Text>
              {/* {format2(parseFloat(brokerage))} - Using hardcoded 50 from image for now or dynamic? sticking to dynamic if possible but styling matches image */}
            </View>
          </View>

          <View style={[styles.summaryRow, { marginTop: 15 }]}>
            <View>
              <Text style={styles.summaryLabel}>Charges</Text>
              <Text style={styles.summaryValue}>
                ₹
                {format2(
                  parseFloat(brokerage) +
                  parseFloat(charges) +
                  parseFloat(taxes),
                )}
              </Text>
            </View>
            <View>
              <Text style={styles.summaryLabel}>Closing balance</Text>
              <Text style={styles.summaryValue}>
                ₹{format2(closingBalance)}
              </Text>
            </View>
            <View style={{ justifyContent: "center" }}>
              <TouchableOpacity
                onPress={() => {
                  fetchFunds(segment);
                  fetchLtp();
                  fetchBrokerage();
                }}
              >
                <Ionicons name="refresh" size={24} color={global.colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* --- Actions --- */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.btn, styles.buyBtn]}
          onPress={() => placeOrder("BUY")}
        >
          <Text style={styles.btnText}>Buy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.sellBtn]}
          onPress={() => placeOrder("SELL")}
        >
          <Text style={styles.btnText}>Sell</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={24} color={global.colors.textPrimary} />
        </TouchableOpacity>

        {/* Angel Logo / Icon Placeholder from image */}
        <View style={styles.logoCircle}>
          {/* Use an icon or text if image not available */}
          <Text style={{ fontSize: 10, fontWeight: "bold", color: global.colors.warning }}>
            A
          </Text>
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
    backgroundColor: global.colors.background,
    paddingTop: 10,
  },
  topSection: {
    marginBottom: 10,
  },
  toggleRow: {
    marginBottom: 10,
  },
  menuRow: {
    marginBottom: 5,
  },
  formScroll: {
    paddingHorizontal: 10,
    flex: 1,
  },
  inputsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  summaryContainer: {
    borderWidth: 1,
    borderColor: global.colors.border,
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    backgroundColor: global.colors.background,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: global.colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: global.colors.textPrimary,
  },
  actionRow: {
    flexDirection: "row",
    paddingBottom: 20,
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
  },
  btn: {
    flex: 2,
    height: 50,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  buyBtn: {
    backgroundColor: global.colors.success,
  },
  sellBtn: {
    backgroundColor: global.colors.error,
  },
  btnText: {
    color: global.colors.background,
    fontSize: 18,
    fontWeight: "600",
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: global.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: global.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: global.colors.background,
  },
  modalBg: {
    flex: 1,
    backgroundColor: global.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: global.colors.background,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  errorText: { fontSize: 13, marginBottom: 4, color: global.colors.textPrimary, },
  modalBtn: {
    marginTop: 15,
    paddingVertical: 10,
    backgroundColor: global.colors.secondary,
    borderRadius: 8,
  },
  modalBtnText: { color: global.colors.background, textAlign: "center", fontSize: 14 },
});