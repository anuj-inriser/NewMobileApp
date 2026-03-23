import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Image,
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  BackHandler,
  Platform,
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
import { useNavigation } from "@react-navigation/native";
import { getDeviceId } from "../utils/deviceId";
import { useAuth } from "../context/AuthContext";
import { useRealtimePrices } from "../hooks/useRealtimePrices";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import OrderInputNew from "../components/OrderInputNew";
import axiosInstance from "../api/axios";
import { useDrawer } from "../context/DrawerContext";
// import DublearrowRight from "../../assets/dublearrowright.png";
import * as Device from "expo-device";
export default function TradeOrderScreen({
  hideHeader: propHideHeader,
  symbol: propSymbol,
  token: propToken,
  isin: propIsin,
  name: propName,
  price: propPrice,
  quantity: propQuantity,
  stoploss: propStoploss,
  target: propTarget,
  producttype: propProductType,
  transactiontype: propTransactionType,
  internaltype: propInternalType,
  orderid: propOrderId,
  exchange: propExchange,
  tradeable: propTradeable,
}) {
  const navigation = useNavigation();
  const { closeStockInfoDrawer } = useDrawer();
  const route = useRoute();
  const hideHeader = propHideHeader || route.params?.hideHeader;
  const [isSwiping, setIsSwiping] = useState(false);
  const { showSuccess, showError } = useAlert();
  const { authToken, setAuthData } = useAuth();
  const { prices } = useRealtimePrices();
  const [validationErrors, setValidationErrors] = useState([]);
  const [showTooltip, setShowTooltip] = useState(false);
  const isProcessingAuth = useRef(false);
  const [exchangeAvailability, setExchangeAvailability] = useState({
    NSE: false,
    BSE: false,
  });

  const {
    selectedIsin,
    drawerMetadata
  } = useDrawer();

  const { stoploss, name, tradeable } = drawerMetadata;
  const [tradeableState, setTradeableState] = useState(
    propTradeable ?? tradeable
  );

  const runValidations = () => {
    const errors = [];

    // -------- CLEAN LTP ----------
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

    // ⭐ MARKET order = p is 0, use LTP as effective price
    const effectivePrice = p === 0 ? ltp : p;

    // -----------------------------
    // 0. LTP GUARD
    //    nseLtp/bseLtp "₹0.00" format mein aata hai.
    //    Agar clean karne ke baad bhi 0 hai → data nahi aaya.
    //    Baaki saari LTP-based checks galat ho jaayengi → early return.
    // -----------------------------
    if (ltp === 0) {
      errors.push("Live price (LTP) not available. Please wait and try again.");
      setValidationErrors(errors);
      return false;
    }

    // -----------------------------
    // 1. PRICE
    // -----------------------------
    if (p < 0) {
      errors.push("Price cannot be negative.");
    }

    // LIMIT order range check — MARKET (p===0) skip hoga
    if (p > 0) {
      const lower = ltp * 0.8;
      const upper = ltp * 1.2;
      if (p < lower || p > upper) {
        errors.push(
          `Limit price must be within ±20% of LTP (₹${lower.toFixed(2)} – ₹${upper.toFixed(2)}).`
        );
      }
    }

    // -----------------------------
    // 2. QUANTITY
    // -----------------------------
    if (q <= 0) {
      errors.push("Quantity must be greater than 0.");
    }

    // -----------------------------
    // 3. BUY / SELL SPECIFIC
    // -----------------------------
    if (transactionType === "BUY") {
      // Target strictly above LTP
      if (tg > 0 && tg <= ltp) {
        errors.push(`Target must be above LTP (₹${ltp}). Current: ₹${tg}`);
      }
      // Stop Loss strictly below LTP
      if (sl > 0 && sl >= ltp) {
        errors.push(`Stop Loss must be below LTP (₹${ltp}). Current: ₹${sl}`);
      }
    }

    if (transactionType === "SELL") {
      // Target strictly below LTP
      if (tg > 0 && tg >= ltp) {
        errors.push(`Target must be below LTP (₹${ltp}). Current: ₹${tg}`);
      }
      // Stop Loss strictly above LTP
      if (sl > 0 && sl <= ltp) {
        errors.push(`Stop Loss must be above LTP (₹${ltp}). Current: ₹${sl}`);
      }
    }

    // -----------------------------
    // 4. TARGET vs STOP LOSS RELATION
    // -----------------------------
    if (tg > 0 && sl > 0) {
      if (transactionType === "BUY" && sl >= tg) {
        errors.push("Stop Loss must be less than Target for a BUY order.");
      }
      if (transactionType === "SELL" && sl <= tg) {
        errors.push("Stop Loss must be greater than Target for a SELL order.");
      }
    }

    // -----------------------------
    // 5. BALANCE CHECK
    //    BUY: effectivePrice use karo taaki MARKET order (p=0)
    //         mein bhi sahi cost calculate ho.
    //    SELL Intraday/Margin: broker side margin check hoti hai,
    //         client side skip karo.
    //    SELL Delivery: balance check relevant nahi (tum shares bech rahe ho),
    //         lekin order value sanity check rakh sakte hain.
    // -----------------------------
    if (transactionType === "BUY") {
      const totalCost = effectivePrice * q + br + ch + tx;
      if (totalCost > bal) {
        errors.push(
          `Insufficient balance. Required: ₹${totalCost.toFixed(2)}, Available: ₹${bal.toFixed(2)}.`
        );
      }
    }

    // -----------------------------
    // 6. SELL — segment-wise check
    //    Intraday/Margin: koi client-side check nahi (broker handle karta hai).
    //    Delivery: order value > balance means user ke paas funds nahi hain
    //              credit/proceeds ke liye — basic sanity check.
    // -----------------------------
    if (transactionType === "SELL" && segment === "DELIVERY") {
      // Agar order value bilkul 0 hai → qty ya LTP kuch toh galat hai
      const sellValue = effectivePrice * q;
      if (sellValue <= 0) {
        errors.push("Invalid sell order. Check quantity and price.");
      }
    }
    if ((tg > 0 || sl > 0) && segment !== "INTRADAY") {
      errors.push(
        "Target and Stop Loss are only supported for Intraday orders. Please switch to Intraday or remove Target/SL."
      );
    }
    // -----------------------------
    // DONE
    // -----------------------------
    setValidationErrors(errors);
    return errors.length === 0;
  };
  // const runValidations = () => {
  //   const errors = [];

  //   // Clean numeric LTP
  //   const cleanLtp = (raw) => {
  //     if (!raw) return 0;
  //     return Number(String(raw).replace(/[^\d.]/g, "")) || 0;
  //   };

  //   const p = parseFloat(price?.trim() || "0");
  //   const q = parseInt(qty?.trim() || "0");
  //   const tg = parseFloat(target?.trim() || "0");
  //   const sl = parseFloat(stopLoss?.trim() || "0");

  //   const ltp = cleanLtp(selected === "NSE" ? nseLtp : bseLtp);

  //   const br = parseFloat(brokerage || 0);
  //   const ch = parseFloat(charges || 0);
  //   const tx = parseFloat(taxes || 0);
  //   const bal = parseFloat(balance || 0);

  //   // PRICE cannot be negative
  //   if (p < 0) {
  //     errors.push("Price cannot be negative.");
  //   }

  //   // LIMIT PRICE validation (Market order allowed)
  //   if (p > 0) {
  //     const lower = ltp * 0.8;
  //     const upper = ltp * 1.2;

  //     if (p < lower || p > upper) {
  //       errors.push(
  //         `Limit price must be within 20% of LTP (${lower.toFixed(2)} - ${upper.toFixed(2)})`,
  //       );
  //     }
  //   }

  //   // QUANTITY
  //   if (q <= 0) errors.push("Quantity must be greater than 0.");

  //   const totalCost = p * q + br + ch + tx;
  //   if (totalCost > bal)
  //     errors.push(
  //       "Insufficient balance. Order value + charges exceed available funds.",
  //     );

  //   // TARGET
  //   if (tg > 0 && tg < ltp) errors.push(`Target cannot be below LTP (${ltp}).`);

  //   // STOP LOSS
  //   if (sl > 0 && sl > ltp)
  //     errors.push(`Stop Loss cannot be above LTP (${ltp}).`);

  //   setValidationErrors(errors);
  //   return errors.length === 0;
  // };

  const handleAngelOneNavigation = async (navState) => {
    const { url } = navState;

   if (
      url.includes("auth_token") &&
      url.includes("feed_token") &&
      !isProcessingAuth.current
    ) {
      isProcessingAuth.current = true;
      let angelOneMeta = {
        success: false,
        message: "",
        userid: "",
      };
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
        // setSwipeKey(Date.now());
        showSuccess("Success", "Angel One login successfully.");
       angelOneMeta.success = true;
        angelOneMeta.message = "AngelOne login success";
      } catch (e) {
        console.log("Token parse error:", e);
        angelOneMeta.message = "AngelOne login failed";
      } finally {
        try {
          const userId = await AsyncStorage.getItem("userId");
          angelOneMeta.userid = userId || "";

          const deviceId =
            Device.osBuildId || Device.modelId || Device.deviceName || "Unknown";

          await axiosInstance.post("/eventlog", {
            user_id: angelOneMeta.userid,
            success: angelOneMeta.success,
            device_id: deviceId,
            event_group_id: 1,
            event_type: "AngelOne Login",
            content: angelOneMeta.message,
            app_version: "1.0.0"
          });
        } catch (err) {
          console.log("Logging failed", err);
        } finally {
          isProcessingAuth.current = false;
        }
      }
    }
  };

  const [showAngelOneModal, setShowAngelOneModal] = useState(false);

  const angelOneUrl =
    "https://smartapi.angelone.in/publisher-login?api_key=IG8g0BMf&state=tradepage";

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
  const params = route.params || {};

  const passedSymbol = propSymbol || params.symbol;
  const passedToken = propToken || params.token;
  const passedIsin = propIsin || params.isin || selectedIsin;
  const passedTradeable = propTradeable || params.tradeable
  const passedName = propName || params.name;
  const passedPrice = propPrice || params.price;
  const passedQuantity = propQuantity || params.quantity;
  const passedStopLoss = propStoploss || params.stoploss;
  const passedTarget = propTarget || params.target;
  const passedProductType = propProductType || params.producttype;
  const internaltype = propInternalType || params.internaltype;
  const passedOrderId = propOrderId || params.orderid;
  const passedTransactionType =
    propTransactionType || params.transactiontype;
  const swipeRef = useRef(null);

  useEffect(() => {
    if (propTradeable != null) {
      setTradeableState(propTradeable);
      return;
    }
    if (tradeable != null) {
      setTradeableState(tradeable);
    }
  }, [propTradeable, tradeable]);
  const [selectedMenu, setSelectedMenu] = useState("Intraday");
  const [transactionType, setTransactionType] = useState("BUY"); // BUY or SELL
  const [selected, setSelected] = useState(propExchange || "NSE");
  const [segment, setSegment] = useState("INTRADAY");

  const [selectedSegmentType, setSelectedSegmentType] = useState("");
  const [nseLtp, setNseLtp] = useState("0.00");
  const [bseLtp, setBseLtp] = useState("0.00");
  const format2 = (num) => {
    return parseFloat(num || 0).toFixed(2);
  };
  const format0 = (num) => {
    return parseFloat(num || 0).toFixed(0);
  };
  const format4 = (num) => {
    return parseFloat(num || 0).toFixed(4);
  };

  const [price, setPrice] = useState("0");
  const [qty, setQty] = useState("0");
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
  // const [swipeKey, setSwipeKey] = useState(Date.now());
  const [stockInfo, setStockInfo] = useState([])

  const [selectedExchange, setSelectedExchange] = useState("NSE");

  const [activeSymbol, setActiveSymbol] = useState(
    passedSymbol || "WELENT-EQ",
  );
  const [activeToken, setActiveToken] = useState(passedToken);

  const symbol = passedSymbol || "WELENT-EQ";
  const token = passedToken;
  useEffect(() => {
    if (propExchange) {
      setSelected(propExchange);
    }
  }, [propExchange]);

  const fetchBrokerage = async () => {
    try {
      const symbolToken = activeToken || "";

      // ⭐ Get current LTP
      let liveLtp =
        parseFloat(
          selected === "NSE"
            ? nseLtp.replace("₹", "")
            : bseLtp.replace("₹", ""),
        ) || 0;

      // ⭐ Price to send → If user price = 0 → use LTP
      const P = parseFloat(price) === 0 ? liveLtp : parseFloat(price);

      const url = `${apiUrl}/api/brokerage/calculate?price=${P}&quantity=${qty}&segment=${segment}&symbol=${activeSymbol}&symboltoken=${symbolToken}&exchange=${selected}`;

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

    if (showAngelOneModal && Platform.OS === "android") {
      backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
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

    if (transactionType === "BUY") {
      setIsTargetValid(tg === 0 || tg > ltp);
      setIsStopLossValid(sl === 0 || sl < ltp);
    } else {
      setIsTargetValid(tg === 0 || tg < ltp);
      setIsStopLossValid(sl === 0 || sl > ltp);
    }
  }, [price, qty, target, stopLoss, nseLtp, bseLtp, selected]);

  // BROKERAGE AUTO UPDATE
  useEffect(() => {
    if (qty && !isSwiping) {
      fetchBrokerage();
    }
  }, [price, qty, segment, selected, nseLtp, bseLtp, isSwiping]);

  // -------------------------
  // 🔢 ORDER VALUE + Closing balance
  // -------------------------
  // useEffect(() => {
  //   let p = parseFloat(price) || 0;
  //   const q = parseInt(qty) || 0;

  //   // ⭐ If price is 0 → use LTP (market order)
  //   const ltp =
  //     parseFloat(
  //       selected === "NSE" ? nseLtp.replace("₹", "") : bseLtp.replace("₹", ""),
  //     ) || 0;

  //   if (p === 0) {
  //     p = ltp;
  //   }

  //   const ov = p * q;
  //   setOrderValue(ov);

  //   const cb = balance - (ov + brokerage + taxes + charges);
  //   setClosingBalance(cb);
  // }, [price, qty, nseLtp, bseLtp, balance, brokerage, charges, taxes]);
  useEffect(() => {
    if (isSwiping) return;

    const rawLtp = selected === "NSE" ? nseLtp : bseLtp;
    const ltp = parseFloat(String(rawLtp).replace(/[^\d.]/g, "")) || 0;
    const p = parseFloat(price) || ltp || 0;
    const q = parseInt(qty) || 0;
    const ov = p * q;
    setOrderValue(ov);

    const br = parseFloat(brokerage) || 0;
    const ch = parseFloat(charges) || 0;
    const tx = parseFloat(taxes) || 0;
    const bal = parseFloat(balance) || 0;

    // ✅ FIX: pehle tha balance - (ov - br - tx - ch) jo galat tha
    setClosingBalance(bal - ov - br - ch - tx);
  }, [price, qty, balance, brokerage, charges, taxes, nseLtp, bseLtp, selected, isSwiping]);

  const modifyOrder = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const deviceId = await getDeviceId();

      const p = parseFloat(price?.trim() || "0");

      const payload = {
        variety: "NORMAL",
        orderid: passedOrderId,
        tradingsymbol: activeSymbol,
        symboltoken: activeToken,
        exchange: selected,
        ordertype: p === 0 ? "MARKET" : "LIMIT",
        producttype: segment,
        duration: "DAY",
        transactiontype: transactionType, // ✅ FIX: "BUY" hardcoded tha
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
        showSuccess("Success", "Order Modified Successfully.");
        closeStockInfoDrawer();
        navigation.navigate("App", {
          screen: "MainTabs",
          params: { screen: "OrdersScreen", params: { defaultTab: 2 } },
        });
      } else {
        showError("Error", data.message || "Failed to modify order");
      }
    } catch (err) {
      showError("Error", err.message);
    }
  };

  const placeOrder = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const deviceId = await getDeviceId();

      const p = parseFloat(price?.trim() || "0");
      const tg = parseFloat(target?.trim() || "0");
      const sl = parseFloat(stopLoss?.trim() || "0");

      // LTP clean karo — "₹102.50" → 102.50
      const rawLtp = selected === "NSE" ? nseLtp : bseLtp;
      const ltp = parseFloat(String(rawLtp).replace(/[^\d.]/g, "")) || 0;

      // Effective price — MARKET order mein LTP use karo
      const effectivePrice = p === 0 ? ltp : p;

      // ROBO = Target ya SL dala ho AND segment INTRADAY ho
      // Angel One mein Bracket Order sirf INTRADAY pe kaam karta hai
      const isRobo = (tg > 0 || sl > 0) && segment === "INTRADAY";

      let payload;

      if (isRobo) {
        // ROBO mein squareoff aur stoploss = POINTS DIFFERENCE (actual price nahi)
        // BUY:  squareoff = target - effectivePrice
        //       stoploss  = effectivePrice - SL
        // SELL: squareoff = effectivePrice - target
        //       stoploss  = SL - effectivePrice

        let squareoffPoints = 0;
        let stoplossPoints = 0;

        if (transactionType === "BUY") {
          squareoffPoints = tg > 0 ? parseFloat((tg - effectivePrice).toFixed(2)) : 1;
          stoplossPoints = sl > 0 ? parseFloat((effectivePrice - sl).toFixed(2)) : 1;
        } else {
          // SELL
          squareoffPoints = tg > 0 ? parseFloat((effectivePrice - tg).toFixed(2)) : 1;
          stoplossPoints = sl > 0 ? parseFloat((sl - effectivePrice).toFixed(2)) : 1;
        }

        // Safety: points negative nahi hone chahiye
        squareoffPoints = Math.max(squareoffPoints, 0.05);
        stoplossPoints = Math.max(stoplossPoints, 0.05);

        payload = {
          variety: "ROBO",
          tradingsymbol: activeSymbol,
          symboltoken: activeToken,
          transactiontype: transactionType,
          exchange: selected,
          ordertype: p === 0 ? "MARKET" : "LIMIT",
          producttype: "BO",
          duration: "DAY",
          price: p === 0 ? 0 : p,
          squareoff: String(squareoffPoints),
          stoploss: String(stoplossPoints),
          quantity: parseFloat(qty),
          scripconsent: "yes",
        };

      } else {
        // NORMAL order
        payload = {
          variety: "NORMAL",
          tradingsymbol: activeSymbol,
          symboltoken: activeToken,
          transactiontype: transactionType,
          exchange: selected,
          ordertype: p === 0 ? "MARKET" : "LIMIT",
          producttype: segment,
          duration: "DAY",
          price: p === 0 ? 0 : p,
          squareoff: "0",
          stoploss: "0",
          quantity: parseFloat(qty),
          scripconsent: "yes",
        };
      }

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
        showSuccess("Success", "Order Placed Successfully.");
        closeStockInfoDrawer();
        navigation.navigate("App", {
          screen: "MainTabs",
          params: { screen: "OrdersScreen", params: { defaultTab: 2 } },
        });
      } else {
        showError("Error", JSON.stringify(data));
      }
    } catch (err) {
      showError("Error", err.message);
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
  const fetchLtp = async (sym = activeSymbol, tok = activeToken) => {
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
        `${apiUrl}/api/buyshare/search?symbol=${sym}&exchange=${ex}&token=${tok}`,
        {
          headers: {
            Authorization: "Bearer " + authToken,
          },
        },
      );
      const data = await res.json();
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

  // useEffect(() => {
  //   fetchLtp(activeSymbol, activeToken);
  //   const t = setInterval(() => fetchLtp(activeSymbol, activeToken), 3000);
  //   return () => clearInterval(t);
  // }, [selected, activeSymbol, activeToken]);

  useEffect(() => {
    if (isSwiping) return; // 🚀 STOP during swipe

    fetchLtp(activeSymbol, activeToken);
    const t = setInterval(() => {
      if (!isSwiping) {
        fetchLtp(activeSymbol, activeToken);
      }
    }, 3000);

    return () => clearInterval(t);
  }, [selected, activeSymbol, activeToken, isSwiping]);


  useEffect(() => {
    const fetchtokenbyisin = async () => {
      try {

        if (!apiUrl || !passedIsin || !selected) return;


        const url = `${apiUrl}/api/buyshare/gettokenbyisin`;

        const response = await axiosInstance.get(url, {
          params: {
            isin: passedIsin,
            exchange: selected
          },
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });


        const data = response?.data?.data?.[0] || {};

        const newSymbol =
          data.symbol || data.tradingsymbol || data.tradingSymbol || data.script;
        const newToken = data.token || data.symboltoken || data.symbolToken;
        const newTradeable =
          data.tradeable ?? data.isTradeable ?? data.tradeable_flag;

        if (newSymbol) setActiveSymbol(newSymbol);
        if (newToken) setActiveToken(newToken);
        if (newTradeable != null) setTradeableState(!!newTradeable);

        if (newSymbol || newToken) {
          fetchLtp(newSymbol || activeSymbol, newToken || activeToken);
        }

      } catch (error) {
        console.log("AXIOS ERROR:", error.response?.data || error.message);
      }
    };

    fetchtokenbyisin();
  }, [selected]);

  useEffect(() => {
    const checkIsinExchange = async (exch) => {
      const url = `${apiUrl}/api/buyshare/gettokenbyisin`;
      const response = await axiosInstance.get(url, {
        params: {
          isin: passedIsin,
          exchange: exch,
        },
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = response?.data?.data?.[0];
      return !!(data?.token || data?.symboltoken || data?.symbolToken);
    };

    const initAvailability = async () => {
      if (!passedIsin) return;
      try {
        const nseOk = await checkIsinExchange("NSE");
        const bseOk = await checkIsinExchange("BSE");
        setExchangeAvailability({ NSE: nseOk, BSE: bseOk });
      } catch (err) {
        // Keep previous availability on error
      }
    };

    initAvailability();
  }, [passedIsin]);

  // Autofill passed values when screen loads
  useEffect(() => {
    // transactionType aur segment hamesha set karo
    if (passedTransactionType) {
      setTransactionType(passedTransactionType.toUpperCase());
    }
    if (passedProductType) {
      const mappedSeg = mapProductTypeToSegment(passedProductType);
      setSegment(mappedSeg);
      if (mappedSeg === "INTRADAY") setSelectedMenu("Intraday");
      else if (mappedSeg === "DELIVERY") setSelectedMenu("Delivery");
      else if (mappedSeg === "MARGIN") setSelectedMenu("Margin");
    }

    // Price/Qty/Target/SL — sirf MODIFY mode mein prefill
    const isModify =
      propInternalType?.toLowerCase() === "modify" ||
      params?.internaltype?.toLowerCase() === "modify";

    if (isModify) {
      if (passedPrice != null) setPrice(String(passedPrice));
      if (passedQuantity != null) setQty(String(passedQuantity));
      if (passedTarget != null) setTarget(String(passedTarget));
      if (passedStopLoss != null) setStopLoss(String(passedStopLoss));
    }
    // Normal mode mein "0" hi rehega — koi prefill nahi
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
    if (isSwiping) return;

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
    isSwiping,
    transactionType, // ✅ ADD: BUY/SELL switch pe re-validate
    segment,         // ✅ ADD: Intraday/Delivery switch pe re-validate
  ]);

  const isModifyMode = internaltype?.toLowerCase() === "modify";

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

  // const mergeWithRealtime = (list, prices) => {
  //   return list.map((item) => {
  //     const rt = prices[item.token] || item.ltp;
  //     if (!rt) return item;

  //     const prevClose = item.prevClose || rt.prevClose || rt.open || item.value || item.prev_close;

  //     const change = (rt.price || rt) - prevClose;
  //     const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;


  //     return {
  //       ...item,
  //       value: rt.price || rt,
  //       change,
  //       changePercent,
  //       timestamp: rt.timestamp || rt.exchange_timestamp || item.timestamp || item.exchange_timestamp,
  //       exchange_timestamp: rt.exchange_timestamp || item.exchange_timestamp,
  //     };
  //   });
  // };

  // const displayStocks = useMemo(() => {
  //   return mergeWithRealtime(stockInfo, prices);
  // }, [stockInfo, prices]);

  // // Realtime data for stock card
  // const rtData = prices[token];
  // const changeVal = rtData?.change || 0;
  // const changePct = rtData?.changePercent || 0;
  // const isPositive = changeVal >= 0;
  // const currentPriceDisplay = selected === "NSE" ? nseLtp : bseLtp;

  const mergeWithRealtime = (list, prices) => {
    const mergedPrices = { ...prices };

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
        ...(typeof rt === "object" ? rt : {}),
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

  // Realtime data for stock card
  const rtData = displayPrices[activeToken];
  const changeVal = rtData?.change || 0;
  const changePct = rtData?.changePercent || 0;
  const isPositive = changeVal >= 0;
  // const currentPriceDisplay = selected === "NSE" ? nseLtp : bseLtp;
  const currentPriceDisplay =
    rtData?.price != null
      ? `₹${Number(rtData?.price || 0).toFixed(2)}`
      : selected === "NSE"
        ? nseLtp
        : bseLtp;

  // Swipe button dynamic values
  const swipeTitle = isModifyMode
    ? "Swipe to Modify"
    : transactionType === "BUY"
      ? "Swipe to Buy"
      : "Swipe to Sell";

  const swipeColor =
    transactionType === "BUY" ? global.colors.success : global.colors.error;

  const content = (
    <View style={{ flex: 1 }}>
      {/* Header */}
      {!tradeableState && (
        <View style={styles.accessBanner}>
          <Ionicons name="warning" size={18} color={global.colors.error} />
          <Text style={styles.accessBannerText}>
            You have no access to Buy or Sell
          </Text>
        </View>
      )}

      <KeyboardAwareScrollView
        contentContainerStyle={styles.premiumScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={120}
      >
        {/* Stock Info Card */}
        <View style={styles.premiumStockCard}>
          <View style={styles.stockInfoLeft}>
            <Text style={styles.premiumStockName}>
              {activeSymbol}
            </Text>
            {/* <Text style={styles.premiumStockSymbol}>{activeSymbol}</Text> */}
          </View>
          <View style={styles.stockInfoRight}>
            <Text style={styles.premiumCurrentPrice}>{currentPriceDisplay}</Text>
            <Text style={[styles.premiumPriceChange, { color: isPositive ? global.colors.success : global.colors.error }]}>
              {isPositive ? "+" : ""}₹{format2(changeVal)} ({format2(changePct)}%)
            </Text>
          </View>
        </View>

        {/* Buy/Sell Toggles & Exchange */}
        <View style={styles.actionRowPremium}>
          <View style={styles.toggleContainerPremium}>
            <TouchableOpacity
              style={[
                styles.toggleBtnPremium,
                transactionType === "BUY" && styles.buyActivePremium,
                !tradeableState && styles.disabledButton,
              ]}
              onPress={() => tradeableState && setTransactionType("BUY")}
              disabled={!tradeableState || isModifyMode}
            >
              <Text
                style={[
                  styles.toggleTextPremium,
                  transactionType === "BUY" && styles.activeTextPremium,
                  !tradeableState && styles.disabledText,
                ]}
              >
                Buy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleBtnPremium,
                transactionType === "SELL" && styles.sellActivePremium,
              ]}
              onPress={() => setTransactionType("SELL")}
              disabled={!tradeableState || isModifyMode}
            >
              <Text
                style={[
                  styles.toggleTextPremium,
                  transactionType === "SELL" && styles.activeTextPremium,
                ]}
              >
                Sell
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.exchangeSelectorPremium}
            onPress={() => setSelected(selected === "NSE" ? "BSE" : "NSE")}
            disabled={isModifyMode || !exchangeAvailability[selected === "NSE" ? "BSE" : "NSE"]}
          >
            <Text style={styles.exchangeTextPremium}>{selected}</Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={global.colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Product Type Tabs */}
        <View style={styles.premiumTabContainer}>
          {["Intraday", "Margin", "Delivery"].map((name) => (
            <TouchableOpacity
              key={name}
              style={[
                styles.premiumTab,
                selectedMenu === name && styles.premiumActiveTab,
              ]}
              onPress={() => {
                if (isModifyMode) return;
                setSelectedMenu(name);
                handleSegmentChange(name);
              }}
              disabled={isModifyMode}
            >
              <Text
                style={[
                  styles.premiumTabText,
                  selectedMenu === name && styles.premiumActiveTabText,
                ]}
              >
                {name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Inputs Grid */}
        <View style={styles.premiumInputGrid}>
          <OrderInputNew
            label="Price"
            value={price}
            onChange={(v) => handleNumericInput(v, setPrice)}
            style={styles.premiumGridInput}
          />
          <OrderInputNew
            label="Quantity"
            value={qty}
            onChange={(v) => handleNumericInput(v, setQty)}
            style={styles.premiumGridInput}
          />
          <OrderInputNew
            label="Target"
            value={target}
            onChange={(v) => handleNumericInput(v, setTarget)}
            style={styles.premiumGridInput}
          />
          <OrderInputNew
            label="Stop Loss"
            value={stopLoss}
            onChange={(v) => handleNumericInput(v, setStopLoss)}
            style={styles.premiumGridInput}
          />
        </View>

        {/* Financial Summary */}
        <View style={styles.premiumSummarySection}>
          <View style={styles.premiumSummaryRow}>
            <View style={styles.premiumSummaryCol}>
              <Text style={styles.premiumSummaryLabel}>Balance available</Text>
              <Text style={styles.premiumSummaryValue}>
                ₹{format2(balance)}
              </Text>
            </View>
            <View style={styles.premiumSummaryCol}>
              <Text style={styles.premiumSummaryLabel}>Order value</Text>
              <Text style={styles.premiumSummaryValue}>
                ₹{format2(orderValue)}
              </Text>
            </View>
            <View style={styles.premiumSummaryCol}>
              <Text style={styles.premiumSummaryLabel}>Brokerage</Text>
              <Text style={styles.premiumSummaryValue}>
                ₹{format2(brokerage)}
              </Text>
            </View>
          </View>

          <View style={[styles.premiumSummaryRow, { marginTop: 20 }]}>
            <View style={styles.premiumSummaryCol}>
              <Text style={styles.premiumSummaryLabel}>Charges</Text>
              <Text style={styles.premiumSummaryValue}>
                ₹{format2(combinedCharges)}
              </Text>
            </View>
            <View style={styles.premiumSummaryCol}>
              <Text style={styles.premiumSummaryLabel}>Closing balance</Text>
              <Text style={styles.premiumSummaryValue}>
                ₹{format2(closingBalance)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.premiumRefreshBtn}
              onPress={() => {
                fetchFunds(segment);
                fetchLtp(activeSymbol, activeToken);
                fetchBrokerage();
              }}
            >
              <Ionicons
                name="refresh"
                size={24}
                color={global.colors.textPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Footer */}
      <View style={styles.premiumFooter}>
        <View style={styles.swipeWrapper}>
          <SwipeButton
            containerStyle={{
              ...styles.premiumActiveTab2,
              borderWidth: 0,
              borderColor: "transparent",
            }}
            disabled={!tradeableState}
            railStyles={{
              borderWidth: 0,
              borderColor: "transparent",
            }}
            railBackgroundColor={global.colors.primary}
            railFillBackgroundColor={global.colors.primary}
            thumbIconBackgroundColor={global.colors.secondary}
            title={swipeTitle}
            titleStyles={styles.premiumSwipeTitle}
            thumbIconImageSource={require("../../assets/rightdoublearrow.png")}
            thumbIconStyles={{
              borderWidth: 0,
              borderRadius: 24,
              elevation: 0,
            }}
            railFillBorderColor="transparent"
            railBorderColor="transparent"
            shouldResetAfterSwipe={true}
            resetAfterSwipeAnimDuration={500}
            enableReverseSwipe={false} // ⭐ IMPORTANT

            onSwipeStart={() => setIsSwiping(true)}

            onSwipeSuccess={() => {
              setIsSwiping(false);

              if (!authToken) {
                setShowAngelOneModal(true);
                return;
              }
              if (!isOrderValid) {
                setShowTooltip(true);
                return;
              }

              isModifyMode ? modifyOrder() : placeOrder();
            }}

            onSwipeFail={() => setIsSwiping(false)}
          />
          {/* <SwipeButton
            containerStyle={{
              ...styles.premiumActiveTab2,
              borderWidth: 0,
              borderColor: "transparent",
            }}
            disabled={!tradeableState}
            railStyles={{
              borderWidth: 0,
              borderColor: "transparent",
            }}
            railBackgroundColor={global.colors.primary}
            railFillBackgroundColor={global.colors.primary}
            thumbIconBackgroundColor={global.colors.secondary}
            title={"Order"}
            titleStyles={styles.premiumSwipeTitle}
            thumbIconImageSource={require("../../assets/rightdoublearrow.png")}
            thumbIconStyles={{
              borderWidth: 0,
              borderRadius: 24,
              elevation: 0, // Android shadow
            }}
            railFillBorderColor="transparent"
            railBorderColor="transparent"
            onSwipeSuccess={() => {
              if (!authToken) {
                setShowAngelOneModal(true);
                return;
              }
              if (!isOrderValid) {
                setShowTooltip(true);
                return;
              }
              if (isModifyMode) {
                modifyOrder();
              } else {
                placeOrder();
              }
            }}
            shouldResetAfterSwipe={true}
            resetAfterSwipeAnimDuration={500}
          /> */}
        </View>
        <View style={styles.premiumAngelContainer}>
          <Image
            source={require("../../assets/angelone.png")}
            style={styles.premiumAngelLogo}
          />
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
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 10,
                color: global.colors.textPrimary,
              }}
            >
              ⚠ Order Issues
            </Text>

            {validationErrors.map((e, i) => (
              <Text
                key={i}
                style={{
                  fontSize: 14,
                  marginBottom: 6,
                  color: global.colors.textSecondary,
                }}
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
                style={{
                  color: global.colors.background,
                  textAlign: "center",
                  fontSize: 16,
                }}
              >
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* ANGEL ONE OVERLAY - REPLACES MODAL */}
      <Modal
        visible={showAngelOneModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAngelOneModal(false)}
      >
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
            androidLayerType="hardware" // Prevents WebView disappearing on keyboard open
            nestedScrollEnabled={true} // Allows proper scrolling with keyboard
            thirdPartyCookiesEnabled={true} // Required for Angel One auth
            originWhitelist={["*"]} // Allows OAuth redirects
            style={styles.webView}
            // Prevent keyboard from shrinking WebView
            contentInsetAdjustmentBehavior="automatic"
          />
        </View>
      </Modal>
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
    </View>
  );

  if (hideHeader) {
    return <View style={styles.container}>{content}</View>;
  }

  return (
    <SafeAreaView edges={["left"]} style={styles.container}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: global.colors.background },
  scrollContent: { alignItems: "center" },
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: global.colors.background,
    zIndex: 9999, // Must be highest to cover all UI
  },
  angelOneCloseButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40, // Adjust for iOS status bar
    right: 20,
    zIndex: 10000,
    backgroundColor: "#eee",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  angelOneCloseText: {
    fontSize: 24,
    fontWeight: "300",
    color: "#333",
  },
  webView: {
    flex: 1,
    marginTop: Platform.OS === "ios" ? 80 : 60, // Space for close button + status bar
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    marginTop: 15,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#222",
    borderRadius: 20,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 18,
    minWidth: 70,
    alignItems: "center",
  },
  buyActive: { backgroundColor: "#107c10" },
  sellActive: { backgroundColor: "#d13438" },
  toggleText: {
    color: global.colors.textSecondary,
    fontWeight: "600",
    fontSize: 14,
  },
  activeText: { color: "#fff" },
  exchangeSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  exchangeText: {
    color: global.colors.textPrimary,
  },
  premiumCloseBtn: {
    padding: 5,
  },
  premiumScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    // paddingBottom: 40,
  },
  premiumStockCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 20,
  },
  premiumStockName: {
    fontSize: 18,
    fontWeight: "700",
    color: global.colors.textPrimary,
  },
  premiumStockSymbol: {
    fontSize: 12,
    color: global.colors.textSecondary,
    marginTop: 4,
    textTransform: "uppercase",
  },
  premiumCurrentPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: global.colors.textPrimary,
    textAlign: "right",
  },
  premiumPriceChange: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "right",
  },
  actionRowPremium: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  toggleContainerPremium: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 4,
    flex: 1,
    marginRight: 15,
    width: "55%",
  },
  toggleBtnPremium: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  buyActivePremium: {
    backgroundColor: global.colors.success,
  },
  sellActivePremium: {
    backgroundColor: global.colors.error,
  },
  toggleTextPremium: {
    fontSize: 14,
    fontWeight: "600",
    color: global.colors.textSecondary,
  },
  activeTextPremium: {
    color: "#FFF",
  },
  exchangeSelectorPremium: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: global.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    width: "30%",
  },
  exchangeTextPremium: {
    fontSize: 14,
    fontWeight: "700",
    color: global.colors.textPrimary,
    marginRight: 5,
  },
  premiumTabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: global.colors.border,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  premiumTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  premiumActiveTab: {
    backgroundColor: global.colors.primary,
  },
  premiumTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: global.colors.textSecondary,
  },
  premiumActiveTabText: {
    color: global.colors.textPrimary,
    fontWeight: "700",
  },
  premiumInputGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  premiumGridInput: {
    width: "48%",
  },
  premiumSummarySection: {
    marginTop: 10,
    paddingVertical: 10,
  },
  premiumSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  premiumSummaryCol: {
    flex: 1,
  },
  premiumSummaryLabel: {
    fontSize: 12,
    color: global.colors.textSecondary,
    marginBottom: 6,
  },
  premiumSummaryValue: {
    fontSize: 15,
    fontWeight: "700",
    color: global.colors.textPrimary,
  },
  premiumRefreshBtn: {
    justifyContent: "center",
    alignItems: "center",
    padding: 5,
  },
  premiumFooter: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingTop: 15,
    paddingBottom: Platform.OS === "ios" ? 40 : 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  premiumSwipeContainer: {
    flex: 1,
    height: 50,
    marginRight: 15,
    borderRadius: 25,
    borderWidth: 0,
    backgroundColor: global.colors.primary,
  },
  premiumSwipeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: global.colors.secondary,
  },
  premiumAngelContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: global.colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: global.colors.background,
  },
  premiumAngelLogo: {
    width: 35,
    height: 35,
    resizeMode: "contain",
  },
  stockInfoLeft: {
    flex: 1,
  },
  stockInfoRight: {
    alignItems: "flex-end",
  },
  premiumOrderBtnIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
    color: global.colors.background,
  },
  premiumActiveTab2: {
    flex: 1,
    height: 54,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    borderRadius: 27,
    overflow: "hidden",
  },
  swipeWrapper: {
    flex: 1,
    height: 50,
    marginRight: 15,
    borderRadius: 24,
    borderWidth: 0,
    borderColor: "transparent",

    // backgroundColor: global.colors.secondary,
  },
  premiumSwipeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
  accessBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#FCECEC",
    borderWidth: 1,
    borderColor: "#F3B8B8",
  },
  accessBannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: global.colors.textPrimary,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#cccccc',
  },
  disabledText: {
    opacity: 0.6,
    color: '#999999',
  },
});
