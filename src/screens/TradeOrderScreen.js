import React, { useState, useEffect, useRef } from "react";
import {
  Image,
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  BackHandler, Platform
} from "react-native";
import { useAlert } from "../context/AlertContext";
import { WebView } from "react-native-webview";
import { useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import SwipeButton from "rn-swipe-button";
import { apiUrl } from "../utils/apiUrl";
import TopOrderHeader from "../components/TopOrderHeader";
import NseBseRadioBox from "../components/NseBseRadioBox";
import OrderTopMenu from "../components/OrderTopMenu";
import OrderInputBox from "../components/OrderInputBox";
// import OrderDropdownBox from "../components/OrderDropdownBox";
import { getDeviceId } from "../utils/deviceId";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
export default function TradeOrderScreen({ navigation, hideHeader: propHideHeader }) {
  const route = useRoute();
  const hideHeader = propHideHeader || route.params?.hideHeader;

  const { showSuccess, showError } = useAlert();
  const { authToken } = useAuth();
  const { setAuthData } = useAuth();
  const [validationErrors, setValidationErrors] = useState([]);
  const [showTooltip, setShowTooltip] = useState(false);

  const runValidations = () => {
    const errors = [];

    // Clean numeric LTP
    const cleanLtp = (raw) => {
      if (!raw) return 0;
      return Number(String(raw).replace(/[^\d.]/g, "")) || 0;
    };

    const p = parseFloat(price?.trim() || "0");
    const q = parseInt(qty?.trim() || "0");
    const tg = parseFloat(target?.trim() || "0");
    const sl = parseFloat(stopLoss?.trim() || "0");

    const ltp = cleanLtp(selected === "NSE" ? nseLtp : bseLtp);

    const br = parseFloat(brokerage || 0);
    const ch = parseFloat(charges || 0);
    const tx = parseFloat(taxes || 0);
    const bal = parseFloat(balance || 0);

    // PRICE cannot be negative
    if (p < 0) {
      errors.push("Price cannot be negative.");
    }

    // LIMIT PRICE validation (Market order allowed)
    if (p > 0) {
      const lower = ltp * 0.8;
      const upper = ltp * 1.2;

      if (p < lower || p > upper) {
        errors.push(
          `Limit price must be within 20% of LTP (${lower.toFixed(2)} - ${upper.toFixed(2)})`,
        );
      }
    }

    // QUANTITY
    if (q <= 0) errors.push("Quantity must be greater than 0.");

    const totalCost = p * q + br + ch + tx;
    if (totalCost > bal)
      errors.push(
        "Insufficient balance. Order value + charges exceed available funds.",
      );

    // TARGET
    if (tg > 0 && tg < ltp) errors.push(`Target cannot be below LTP (${ltp}).`);

    // STOP LOSS
    if (sl > 0 && sl > ltp)
      errors.push(`Stop Loss cannot be above LTP (${ltp}).`);

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleAngelOneNavigation = async (navState) => {
    const { url } = navState;

    if (url.includes("auth_token") && url.includes("feed_token")) {
      try {
        const urlObj = new URL(url);
        const auth_token = urlObj.searchParams.get("auth_token");
        const feed_token = urlObj.searchParams.get("feed_token");
        const refresh_token = urlObj.searchParams.get("refresh_token");

        // Save in AuthContext
        await setAuthData({
          authToken: auth_token,
          feedToken: feed_token,
          refreshToken: refresh_token,
        });

        // Close modal
        setShowAngelOneModal(false);

        // Force refresh of page → triggers new token usage
        setSwipeKey(Date.now());
        showSuccess(
          "Success",
          "Angel One login successfully."
        );
      } catch (e) {
        console.log("Token parse error:", e);
      }
    }
  };

  const [showAngelOneModal, setShowAngelOneModal] = useState(false);

  const angelOneUrl = "https://smartapi.angelone.in/publisher-login?api_key=IG8g0BMf&state=tradepage";

  const handleUserPriceInput = (val) => {
    setIsUserTypedPrice(true);
    setUserTypedTime(Date.now());
    setPrice(val);
  };
  const [isPriceValid, setIsPriceValid] = useState(true);
  const [isQtyValid, setIsQtyValid] = useState(true);
  const [isTargetValid, setIsTargetValid] = useState(true);
  const [isStopLossValid, setIsStopLossValid] = useState(true);

  // ⭐ Map incoming producttype → valid segment
  const mapProductTypeToSegment = (type) => {
    if (!type) return "INTRADAY";

    const t = type.toString().trim().toUpperCase();

    if (["INTRADAY", "MIS"].includes(t)) return "INTRADAY";
    if (["DELIVERY", "CNC"].includes(t)) return "DELIVERY";
    if (["MARGIN", "NRML"].includes(t)) return "MARGIN";

    return "INTRADAY";
  };

  // const route = useRoute();
  const {
    symbol: passedSymbol,
    token: passedToken,
    name: passedName,
    price: passedPrice,
    quantity: passedQuantity,
    stoploss: passedStopLoss,
    target: passedTarget,
    producttype: passedProductType,
    internaltype = internaltype,
    orderid: passedOrderId,
  } = route.params || {};
  const swipeRef = useRef(null);
  const [selectedMenu, setSelectedMenu] = useState("Intraday");

  const [selected, setSelected] = useState("NSE");
  const [segment, setSegment] = useState("INTRADAY");

  const [selectedSegmentType, setSelectedSegmentType] = useState("");
  const [nseLtp, setNseLtp] = useState("0.00");
  const [bseLtp, setBseLtp] = useState("0.00");
  const format2 = (num) => {
    return parseFloat(num || 0).toFixed(2);
  };
  const format4 = (num) => {
    return parseFloat(num || 0).toFixed(4);
  };

  const [price, setPrice] = useState("0");
  const [qty, setQty] = useState("1");
  const [taxes, setTaxes] = useState("0");
  const [isUserTypedPrice, setIsUserTypedPrice] = useState(false);
  const [userTypedTime, setUserTypedTime] = useState(null);

  const [balance, setBalance] = useState("0");
  const [orderValue, setOrderValue] = useState("0");

  const [brokerage, setBrokerage] = useState("0");
  const [charges, setCharges] = useState("0");

  const [closingBalance, setClosingBalance] = useState("0");
  const [isOrderValid, setIsOrderValid] = useState(false);
  const [target, setTarget] = useState("0");
  const [stopLoss, setStopLoss] = useState("0");
  const [swipeKey, setSwipeKey] = useState(Date.now());

  const symbol = passedSymbol || "WELENT-EQ";
  const fetchBrokerage = async () => {
    try {
      const symbolToken = passedToken || "";

      // ⭐ Get current LTP
      let liveLtp =
        parseFloat(
          selected === "NSE"
            ? nseLtp.replace("₹", "")
            : bseLtp.replace("₹", ""),
        ) || 0;

      // ⭐ Price to send → If user price = 0 → use LTP
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
  // ADD THIS useEffect AFTER your existing useEffects
  useEffect(() => {
    let backHandler;

    if (showAngelOneModal && Platform.OS === 'android') {
      backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        setShowAngelOneModal(false);
        return true; // Prevent default back behavior
      });
    }

    return () => {
      if (backHandler) backHandler.remove();
    };
  }, [showAngelOneModal]);
  useEffect(() => {
    const p = parseFloat(price || 0);
    const q = parseInt(qty || 0);
    const tg = parseFloat(target || 0);
    const sl = parseFloat(stopLoss || 0);

    const rawLtp = selected === "NSE" ? nseLtp : bseLtp;
    const ltp = Number(String(rawLtp).replace(/[^\d.]/g, "")) || 0;

    // ⭐ PRICE VALIDATION (same as runValidations)
    if (p === 0) {
      setIsPriceValid(true); // MARKET order always valid
    } else {
      const lower = ltp * 0.8;
      const upper = ltp * 1.2;
      setIsPriceValid(p >= lower && p <= upper);
    }

    // QTY
    setIsQtyValid(q > 0);

    // TARGET (must be above LTP if > 0)
    setIsTargetValid(tg === 0 || tg > ltp);

    // STOP LOSS (must be below LTP if > 0)
    setIsStopLossValid(sl === 0 || sl < ltp);
  }, [price, qty, target, stopLoss, nseLtp, bseLtp, selected]);

  // BROKERAGE AUTO UPDATE
  useEffect(() => {
    if (qty) {
      fetchBrokerage();
    }
  }, [price, qty, segment, selected, nseLtp, bseLtp]);

  // -------------------------
  // 🔢 ORDER VALUE + Closing balance
  // -------------------------
  useEffect(() => {
    let p = parseFloat(price) || 0;
    const q = parseInt(qty) || 0;

    // ⭐ If price is 0 → use LTP (market order)
    const ltp =
      parseFloat(
        selected === "NSE" ? nseLtp.replace("₹", "") : bseLtp.replace("₹", ""),
      ) || 0;

    if (p === 0) {
      p = ltp;
    }

    const ov = p * q;
    setOrderValue(ov);

    const cb = balance - (ov + brokerage + taxes + charges);
    setClosingBalance(cb);
  }, [price, qty, nseLtp, bseLtp, balance, brokerage, charges, taxes]);

  const modifyOrder = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const deviceId = await getDeviceId();

      const p = parseFloat(price?.trim() || "0");

      const payload = {
        variety: "NORMAL",
        orderid: passedOrderId,
        tradingsymbol: symbol,
        symboltoken: passedToken,
        exchange: selected,

        ordertype: p === 0 ? "MARKET" : "LIMIT",

        producttype: segment,
        duration: "DAY",
        transactiontype: "BUY",
        squareoff: 0,
        stoploss: parseFloat(stopLoss || 0),

        price: p === 0 ? 0 : p,
        quantity: String(qty),
      };

      const res = await fetch(`${apiUrl}/api/order/modify`, {
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

      if (data.success) {
        showSuccess(
          "Success",
          "Order Modified Successfully."
        );
        navigation.navigate("App", {
          screen: "MainTabs",
          params: { screen: "OrdersScreen", params: { defaultTab: 2 } },
        });
      } else {
        showError(
          "Error",
          data.message || "Failed to modify order"
        );
      }
    } catch (err) {
      showError(
        "Error",
        err.message
      );
    }
  };

  const placeOrder = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const deviceId = await getDeviceId();

      // ⭐ FIX: price empty → 0
      const p = parseFloat(price?.trim() || "0");

      const payload = {
        variety: "NORMAL",
        tradingsymbol: symbol,
        symboltoken: passedToken,
        transactiontype: "BUY",
        exchange: selected,

        // ⭐ FIXED: now p works properly
        ordertype: p === 0 ? "MARKET" : "LIMIT",

        producttype: segment,
        duration: "DAY",

        // Market order must send 0 price
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
          internaltype: internaltype,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.angelResponse?.message === "SUCCESS") {
        showSuccess(
          "Success",
          "Order Placed Successfully."
        );
        navigation.navigate("App", {
          screen: "MainTabs",
          params: { screen: "OrdersScreen", params: { defaultTab: 2 } },
        });
      } else {
        showError(
          "Error",
          JSON.stringify(data)
        );
      }
    } catch (err) {
      showError(
        "Error",
        err.message
      );
    }
  };

  useEffect(() => {
    if (!isUserTypedPrice) return;

    const timer = setTimeout(() => {
      setIsUserTypedPrice(false); // Allow LTP auto update again
    }, 3000);

    return () => clearTimeout(timer);
  }, [isUserTypedPrice]);

  const handleNumericInput = (val, setter) => {
    // Allow only numbers and decimal
    if (val !== "" && isNaN(val)) return;

    // If empty => keep 0
    if (val === "" || val === null) {
      setter("0");
      return;
    }

    // ⭐ MAIN FIX:
    // If current textbox shows "0", and user types something:
    // Example: val = "06" → we convert to "6"
    if (val.length > 1 && val.startsWith("0") && !val.startsWith("0.")) {
      val = val.replace(/^0+/, ""); // remove all leading zeros
      if (val === "") val = "0";
    }

    setter(val);
  };

  // -------------------------
  // 🔄 FETCH LTP
  // -------------------------
  const fetchLtp = async () => {
    try {
      // If user typed recently (within 1 minute), don't overwrite price
      if (
        isUserTypedPrice &&
        userTypedTime &&
        Date.now() - userTypedTime < 60000
      ) {
        return; // Do NOT update price from LTP
      }

      const ex = selected;
      const res = await fetch(
        `${apiUrl}/api/buyshare/search?symbol=${symbol}&exchange=${ex}`,
        {
          headers: {
            Authorization: "Bearer " + authToken,
          },
        },
      );
      const data = await res.json();
      console.log("LTP API Response:", data);

      if (data.success) {
        const rawLtp = data.ltp || data.price || data.value || 0;
        const ltp = parseFloat(rawLtp).toFixed(2);

        if (ex === "NSE") setNseLtp(`₹${ltp}`);
        else setBseLtp(`₹${ltp}`);
      } else {
        // If API fails, show placeholder
        console.warn("LTP API failed:", data.message);
        if (ex === "NSE") setNseLtp("₹0.00");
        else setBseLtp("₹0.00");
      }
    } catch (err) {
      console.log("LTP Error:", err.message);
      // Set fallback on error
      if (selected === "NSE") setNseLtp("₹0.00");
      else setBseLtp("₹0.00");
    }
  };

  useEffect(() => {
    fetchLtp();
    const t = setInterval(fetchLtp, 3000);
    return () => clearInterval(t);
  }, [selected, symbol]);

  // Autofill passed values when screen loads
  useEffect(() => {
    if (passedPrice) setPrice(String(passedPrice));
    if (passedQuantity) setQty(String(passedQuantity));
    if (passedTarget) setTarget(String(passedTarget));
    if (passedStopLoss) setStopLoss(String(passedStopLoss));

    if (passedProductType) {
      const mappedSeg = mapProductTypeToSegment(passedProductType);
      setSegment(mappedSeg);

      // ⭐ UI menu ke liye human readable text
      if (mappedSeg === "INTRADAY") setSelectedMenu("Intraday");
      else if (mappedSeg === "DELIVERY") setSelectedMenu("Delivery");
      else if (mappedSeg === "MARGIN") setSelectedMenu("Margin");
    }

    // Prevent LTP from overriding the initial price immediately
    if (passedPrice) {
      setIsUserTypedPrice(true);
      setUserTypedTime(Date.now());
    }
  }, []);

  const fetchFunds = async (segmentType) => {
    setSelectedSegmentType(segmentType);
    try {
      const res = await fetch(
        `${apiUrl}/api/fundandmargin/get?segment=${segmentType}`,
        {
          headers: {
            Authorization: "Bearer " + authToken,
          },
        },
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

  const combinedCharges = parseFloat(charges || 0) + parseFloat(taxes || 0);

  useEffect(() => {
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

  const isModifyMode = internaltype?.toLowerCase() === "modify";
  const content = (
    <>
      {!hideHeader && (
        <TopOrderHeader title={symbol} onBack={() => navigation.goBack()} />
      )}
      <KeyboardAwareScrollView
        extraHeight={300}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.radioContainer}>
            <NseBseRadioBox
              selected={selected}
              nseLtp={nseLtp}
              bseLtp={bseLtp}
              onSelect={setSelected}
            />
          </View>

          <View style={styles.menuContainer}>
            {/* <OrderTopMenu
            items={menuItems}
            defaultSelected="Intraday"
            onSelect={handleSegmentChange}
          /> */}
            <OrderTopMenu
              items={menuItems}
              defaultSelected={selectedMenu} // ⭐ now fully controlled
              onSelect={(name) => {
                setSelectedMenu(name); // UI highlight
                handleSegmentChange(name); // backend / logic mapping
              }}
            />
          </View>

          <View style={styles.inputsWrapper}>
            <OrderInputBox
              label="Price"
              value={price}
              onChange={(v) => handleNumericInput(v, setPrice)}
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

            {/* <Text>{internaltype}</Text> */}

            {/* <OrderDropdownBox
            label="Order Type"
            options={["Market", "Limit", "SL_Limit", "SL_Market"]}
            zIndex={3000}
            zIndexInverse={2000}
          />

          <OrderDropdownBox
            label="Variety"
            options={["Normal", "StopLoss", "Robo"]}
            zIndex={2000}
            zIndexInverse={1000}
          /> */}
          </View>
        </ScrollView>
      </KeyboardAwareScrollView>
      <View style={styles.bottomContainer}>
        <View style={styles.summaryContainer}>
          <View style={styles.row}>
            <Text style={styles.label}>Balance available</Text>
            <Text style={styles.value}>₹{format4(balance)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Order value</Text>
            <Text style={styles.value}>₹{format2(orderValue)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Brokerage</Text>
            <Text style={styles.value}>₹{format2(brokerage)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Charges</Text>
            <Text style={styles.value}>₹{format2(combinedCharges)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Closing balance</Text>
            <Text style={styles.value}>₹{format2(closingBalance)}</Text>
          </View>
          <Ionicons
            name="refresh"
            size={20}
            color={global.colors.secondary}
            style={styles.refreshIcon}
            onPress={() => {
              fetchFunds(selectedSegmentType);
              fetchLtp();
              fetchBrokerage();
            }}
          />
        </View>
        {/* SWIPE BUTTON */}
        <View style={{ position: "relative", width: "100%" }}>
          <SwipeButton
            key={swipeKey}
            disabled={false}
            title="Swipe right to buy >>"
            titleColor={global.colors.secondary}
            titleFontSize={14}
            railBackgroundColor={global.colors.background}
            railFillBackgroundColor={global.colors.background}
            thumbIconBackgroundColor={global.colors.success}
            thumbIconBorderColor="transparent"
            railFillBorderColor="transparent"
            disabledThumbIconBackgroundColor={global.colors.success}
            disabledRailBackgroundColor={global.colors.background}
            containerStyles={{
              borderRadius: 25,
              height: 52,
              width: "100%",
              backgroundColor: global.colors.background,
            }}
            thumbIconComponent={() => (
              <Text style={{ color: global.colors.background, fontWeight: "700" }}>Buy</Text>
            )}
            onSwipeSuccess={() => {
              if (!authToken) {
                setShowAngelOneModal(true);
                setSwipeKey(Date.now());
                return;
              }
              if (!isOrderValid) {
                setShowTooltip(true);
                setSwipeKey(Date.now());
                return;
              }


              if (internaltype?.toLowerCase() === "modify") {
                modifyOrder();
              } else {
                placeOrder();
              }
              setSwipeKey(Date.now());
            }}
          />

          <TouchableOpacity
            onPress={() => setShowAngelOneModal(true)}
            style={{
              position: "absolute",
              right: 12,
              top: 14,
              zIndex: 10,
            }}
          >
            <Image
              source={require("../../assets/angelone.png")}
              style={{
                width: 35,
                height: 35,
                resizeMode: "contain",
              }}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showTooltip}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTooltip(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: global.colors.overlay,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "85%",
              backgroundColor: global.colors.background,
              borderRadius: 12,
              padding: 20,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 10, color: global.colors.textPrimary }}>
              ⚠ Order Issues
            </Text>

            {validationErrors.map((e, i) => (
              <Text
                key={i}
                style={{ fontSize: 14, marginBottom: 6, color: global.colors.textSecondary }}
              >
                • {e}
              </Text>
            ))}

            <TouchableOpacity
              onPress={() => setShowTooltip(false)}
              style={{
                marginTop: 15,
                paddingVertical: 10,
                backgroundColor: global.colors.secondary,
                borderRadius: 8,
              }}
            >
              <Text
                style={{ color: global.colors.background, textAlign: "center", fontSize: 16 }}
              >
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* ANGEL ONE OVERLAY - REPLACES MODAL */}
      {showAngelOneModal && (
        <View style={styles.angelOneOverlay}>
          <TouchableOpacity
            style={styles.angelOneCloseButton}
            onPress={() => setShowAngelOneModal(false)}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={styles.angelOneCloseText}>✕</Text>
          </TouchableOpacity>

          <WebView
            source={{ uri: angelOneUrl }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            useWebKit={true}
            onNavigationStateChange={handleAngelOneNavigation}

            // 🔑 CRITICAL ANDROID FIXES:
            androidLayerType="hardware"        // Prevents WebView disappearing on keyboard open
            nestedScrollEnabled={true}         // Allows proper scrolling with keyboard
            thirdPartyCookiesEnabled={true}    // Required for Angel One auth
            originWhitelist={['*']}            // Allows OAuth redirects

            style={styles.webView}
            // Prevent keyboard from shrinking WebView
            contentInsetAdjustmentBehavior="automatic"
          />
        </View>
      )}
      {/* <Modal
        visible={showAngelOneModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAngelOneModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 40,
              right: 20,
              zIndex: 999,
              backgroundColor: "#eee",
              width: 36,
              height: 36,
              borderRadius: 18,
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => setShowAngelOneModal(false)}
          >
            <Text style={{ fontSize: 18 }}>✕</Text>
          </TouchableOpacity>

          <WebView
            source={{
              uri: "https://smartapi.angelone.in/publisher-login?api_key=IG8g0BMf&state=tradeorder",
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            useWebKit={true}
            onNavigationStateChange={handleAngelOneNavigation}
          />
        </View>
      </Modal> */}
    </>
  );

  if (hideHeader) {
    return (
      <View style={styles.container}>
        {content}
      </View>
    );
  }

  return (
    <SafeAreaView edges={["left", "top"]} style={styles.container}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1,  backgroundColor: global.colors.background },
  scrollContent: { alignItems: "center", paddingBottom: 160 },
  radioContainer: { marginTop: 10 },
  menuContainer: { width: "100%", marginTop: 10 },
  inputsWrapper: { marginTop: 10 },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
   backgroundColor: global.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 15,
  },
  summaryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
    gap: 10,
  },
  row: { width: "30%", marginBottom: 4 },
  label: { fontSize: 12, color: global.colors.textSecondary },
  value: { fontSize: 13, fontWeight: "600", color: global.colors.textPrimary },
  refreshIcon: { marginLeft: "auto" },
  // ADD THESE TO YOUR styles OBJECT
  angelOneOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: global.colors.background,
    zIndex: 9999, // Must be highest to cover all UI
  },
  angelOneCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40, // Adjust for iOS status bar
    right: 20,
    zIndex: 10000,
    backgroundColor: '#eee',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  angelOneCloseText: {
    fontSize: 24,
    fontWeight: '300',
    color: '#333',
  },
  webView: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 80 : 60, // Space for close button + status bar
  },
});
