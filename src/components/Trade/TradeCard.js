import React, { useCallback, useState } from "react";
import GlobalAlert from "../../components/GlobalAlert";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  DeviceEventEmitter,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { formatFullPublishedDateTime } from "../../utils/dateFormat";
import { useRealtimePrices } from "../../hooks/useRealtimePrices";
import Slider from "@react-native-community/slider";
import LinearGradient from "react-native-linear-gradient";
import {
  subscribeSymbols,
  unsubscribeDelayed,
} from "../../ws/marketSubscriptions";
import Icon from "react-native-vector-icons/Ionicons";
import { useDrawer } from "../../context/DrawerContext";
import PriceBar from "./PriceBar";

const STATUS_COLORS = {
  Live: global.colors.error,
  "Target Hit": global.colors.secondary,
  "Target Miss": global.colors.error,
  Closed: global.colors.textSecondary,
};

const TradeCard = ({
  Tradeid,
  script,
  script_id,
  status,
  tradeRecommendation,
  entryDate,
  exitDate,
  entry,
  target,
  stopLoss,
  perspective,
  token,
  potential_profits,
  ltp: fixedltp,
  prev_close,
  exitTypeId,
  recoPriceLow,
  exitPriceLow,
  isLocked,
  isin,
  tradeable,
  exchange,
}) => {


  const navigation = useNavigation();
  const { openStockInfoDrawer } = useDrawer();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [slidermeterPercent, setSliderMeterPercent] = useState(50);
  /* ---------------- REALTIME PRICE ---------------- */
  const { prices } = useRealtimePrices();
  const [meterWidth, setMeterWidth] = useState(0);
  const [bubbleWidth, setBubbleWidth] = useState(0);

  const symbolKey = script?.toUpperCase().trim();
  const isActionDisabled = Boolean(isLocked);

  const priceKey =
    token != null && String(token).trim() !== ""
      ? String(token)
      : symbolKey || script_id || null;
  const rt = priceKey ? prices[priceKey] : null;
  let ltp;
  if (status === "Live") {
    ltp = rt?.price ?? fixedltp;
  } else {
    ltp = fixedltp;
  }
  const isDisable = status !== "Live";
  const prevClose = rt?.prevClose || rt?.open || prev_close || 0;
  const change = ltp !== undefined ? ltp - prevClose : 0;
  const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
  /* ---------------- METER CALC ---------------- */
  const min = Number(stopLoss);
  const max = Number(target);
  const base = Number(entry);
  const exitPrice = Number(exitPriceLow);
  const entryPrice = Number(recoPriceLow);

  const currentPrice = typeof ltp === "number" ? ltp : base;

  let chipName = "Profit Potential";
  let potential_profits_Percentage = ((potential_profits / entryPrice) * 100);

  let tradestatus = status;
  let profit = 0;

  let actual_profit = 0;
  let actual_profit_percentage = 0;

  // Trigger logic
  // if (tradeRecommendation.toLowerCase() === "buy") {
  //   if (ltp >= target) tradestatus = "Target Hit";
  //   if (ltp <= Number(stopLoss)) tradestatus = "Stop Loss Hit";
  //   profit = target - entry;
  // } else {
  //   if (ltp <= target) tradestatus = "Target Hit";
  //   if (ltp >= Number(stopLoss)) tradestatus = "Stop Loss Hit";
  //   profit = entry - target;
  // }

  // Actual Profit logic - direction-aware and status-aware
  const isBuy = tradeRecommendation.toLowerCase() === "buy";
  const isLive = status === "Live";

  if (isLive) {
    actual_profit = isBuy ? ltp - entry : entry - ltp;
    actual_profit_percentage = isBuy
      ? ((ltp - entry) / entry) * 100
      : ((entry - ltp) / entry) * 100;
  } else {
    // For non-Live trades, use exitPrice and ensure it's direction-aware
    actual_profit = isBuy ? exitPrice - entry : entry - exitPrice;
    actual_profit_percentage = isBuy
      ? ((exitPrice - entry) / entry) * 100
      : ((entry - exitPrice) / entry) * 100;
  }

  function tradepercent(ltp, entry) {
    if (isBuy) {
      return (((ltp - entry) / entry) * 100).toFixed(2);
    } else {
      return (((entry - ltp) / entry) * 100).toFixed(2);
    }
  }

  let meterPercent = 0;

  if (max > min) {
    const safePrice = Math.min(Math.max(currentPrice, min), max);
    meterPercent = ((safePrice - min) / (max - min)) * 100;
  }

  // Extra safety clamp (0–100 hard limit)
  meterPercent = Math.max(0, Math.min(100, meterPercent));
  /* ---------------- PROFIT DISPLAY FORMAT ---------------- */

  const getProfitColor = () => {
    if (actual_profit_percentage === undefined || actual_profit_percentage === null) {
      return global.colors.textSecondary;
    }

    return actual_profit_percentage < 0
      ? global.colors.error // red
      : global.colors.success; // green
  };

  const formatProfitText = () => {
    if (chipAmount != null && chipPercent != null) {
      return `₹${Math.abs(chipAmount).toFixed(2)}(${Math.abs(chipPercent).toFixed(2)}%)`;
    }

    if (chipPercent != null) {
      return `${Math.abs(Number(chipPercent)).toFixed(2)}%`;
    }

    if (chipAmount != null) {
      return `₹${Math.abs(chipAmount).toFixed(2)}`;
    }

    return "";
  };

  /* ---------------- SUBSCRIBE SOCKET ---------------- */
  useFocusEffect(
    useCallback(() => {
      if (!script) return;

      const symbols = [script];
      subscribeSymbols(symbols, "TradeCard", "TradeList");

      return () => {
        unsubscribeDelayed(symbols, "TradeCard", "TradeList");
      };
    }, [script]),
  );
  const formatDateWithSuffix = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    const day = date.getDate();
    const month = date.toLocaleString("en-IN", { month: "short" });
    const year = date.getFullYear();

    const getSuffix = (d) => {
      if (d >= 11 && d <= 13) return "th";
      switch (d % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${day}${getSuffix(day)} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  };

 
  const formatJustDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("en-IN", { month: "short" });
    const year = date.getFullYear();

    const getSuffix = (d) => {
      if (d >= 11 && d <= 13) return "th";
      switch (d % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };
    return `${day}${getSuffix(day)} ${month} ${year}`;
  };

  // Elastic range — same as HTML demo: SL-5% to Target+15%
  const slNum = Number(stopLoss);
  const targetNum = Number(target);
  const entryNum = Number(entry);
  const elasticMin = slNum - slNum * 0.05;
  const elasticMax = targetNum + targetNum * 0.15;

  const getElasticPercent = (price) => {
    const range = elasticMax - elasticMin;
    if (range <= 0) return 50;
    const safe = Math.min(Math.max(price, elasticMin), elasticMax);
    return ((safe - elasticMin) / range) * 100;
  };

  // Pointer position (percent) for triangle indicator
  const percent = getElasticPercent(currentPrice);
  const stopLossPercent = getElasticPercent(slNum);
  const targetPercent = getElasticPercent(targetNum);

  // Tooltip left in pixels — clamped so it never overflows edges (like HTML demo)
  const MARGIN = 4;
  const tooltipLeft =
    meterWidth > 0 && bubbleWidth > 0
      ? Math.max(
          MARGIN,
          Math.min(
            (percent / 100) * meterWidth - bubbleWidth / 2,
            meterWidth - bubbleWidth - MARGIN,
          ),
        )
      : 0;


  /* ---------------- UI ---------------- */
  return (
    <>
      <TouchableOpacity activeOpacity={1} style={{ marginVertical: 8 }}>
        <View style={[styles.card, { marginVertical: 0 }]}>
          {/* HEADER */}
          <View style={styles.topRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={styles.titleRow}>
                <View style={styles.scriptWrapper}>
                  <TouchableOpacity
                    disabled={!isLocked}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (isLocked) {
                        DeviceEventEmitter.emit("SHOW_PREMIUM_MODAL");
                      }
                    }}
                    style={styles.lockedScriptTrigger}
                  >
                    <Text
                      style={[styles.script, isLocked && styles.lockedScript]}
                    >
                      {isLocked ? "***🔒***" : script_id}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.liveBadge}>
                  <Text
                    style={[styles.liveText, { color: STATUS_COLORS[status] }]}
                  >
                    {status}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.profitBadge,
                  {
                    width: "100%",
                    justifyContent: "space-between",
                    flexDirection: "row",
                  },
                ]}
              >
                <Text style={[styles.profitText]}>
                  {chipName} :{" "}
                  <Text style={{ color: global.colors.success }}>
                    ₹{Math.abs(potential_profits)} 
                </Text>
                <Text style={{ color: global.colors.success }}>
                  {" "}({"+"}{potential_profits_Percentage.toFixed(2)}%)
                </Text>
                </Text>
                { (status === "Live") ? 
                <Text style={[styles.profitText1]}>
                  {"Live Profit"} :{" "}
                  <Text style={{ color: getProfitColor() }}>
                    ₹{Math.abs(actual_profit.toFixed(2))}
                  </Text>{" "}
                  <Text style={{ color: getProfitColor() }}>
                    ({actual_profit_percentage >= 0 ? "+" : ""}{actual_profit_percentage.toFixed(2)}%)
                  </Text>
                </Text> :
                 <Text style={[styles.profitText1]}>
                  {"Actual Profit"} :{" "}
                  <Text style={{ color: getProfitColor() }}>
                    ₹{Math.abs(actual_profit.toFixed(2))}
                  </Text>{" "}
                  <Text style={{ color: getProfitColor() }}>
                    ({actual_profit_percentage >= 0 ? "+" : ""}{actual_profit_percentage.toFixed(2)}%)
                  </Text>
                </Text>
                }
              </View>
              <View
                style={[
                  styles.profitBadge,
                  {
                    width: "100%",
                    justifyContent: "space-between",
                    flexDirection: "row",
                    alignItems: "center",
                  },
                ]}
              >
                <Text style={[styles.profitText]}>
                  {"Entry"} : <Text>{formatJustDate(entryDate)}</Text>
                </Text>
                {tradestatus !== "Live" ? (
                  <Text style={[styles.profitText1]}>
                    Exited : <Text>{formatJustDate(exitDate)}</Text>
                  </Text>
                ) : null}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.actionButton,
                isActionDisabled && styles.actionButtonDisabled,
              ]}
              disabled={isActionDisabled}
              activeOpacity={isActionDisabled ? 1 : 0.8}
              onPress={() => {
                if (isActionDisabled) return;
                openStockInfoDrawer(token, script_id, "placeorder", isin, {
                  // price: ltp,
                  target: target,
                  stoploss: stopLoss,
                  // quantity: 1,
                  name: script,
                  tradeable: tradeable,
                  exchange: exchange,
                });
              }}
            >
              <View
                style={[
                  styles.buyButton,
                  isActionDisabled && styles.buyButtonDisabled,
                  tradeRecommendation?.toLowerCase() === "sell" && {
                    backgroundColor: global.colors.error,
                  },
                ]}
              >
                <Text style={styles.buyText}>{tradeRecommendation}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* VALUES */}
          <View style={styles.valuesRow}>
            <View>
              <Text style={styles.label}>Entry Price</Text>
              <Text style={styles.value}>{entry}</Text>
            </View>
            <View>
              <Text style={styles.label}>Target Price</Text>
              <Text style={styles.value}>{target}</Text>
            </View>
            <View>
              <Text style={styles.label}>Stop Loss</Text>
              <Text style={styles.value}>{stopLoss}</Text>
            </View>
            <View>
              <Text style={styles.label}>Perspective</Text>
              <Text style={styles.value}>{perspective}</Text>
            </View>
          </View>

          {/* PRICE METER */}
          <PriceBar
            type={tradeRecommendation}
            stopLoss={stopLoss}
            entry={entry}
            target={target}
            ltp={ltp}
            status={tradestatus}
            exitprice={exitPrice}
          />

          {/* DATES */}
          {/* <View style={styles.datesRow}>
                    <Text style={styles.dateText}>
                        Entry: {formatDateWithSuffix(entryDate)}

                    </Text>
                    {exitDate && (
                        <Text style={styles.dateText}>
                            Exit: {formatDateWithSuffix(exitDate)}
                        </Text>
                    )}
                </View> */}

          {/* DISCLAIMER */}
          <View style={styles.disclaimerview}>
          <TouchableOpacity
            style={styles.disclaimerBtn}
          >
            
             <Text style={styles.disclaimerText}>TID: {Tradeid}</Text>
          </TouchableOpacity>
         <TouchableOpacity
            style={styles.disclaimerBtn}
            onPress={() => setShowDisclaimer(true)}
          >
             <Text style={styles.disclaimerText}>More Details</Text>
          </TouchableOpacity>
          </View>

          {/* <Text>
                    Potential P/L:{" "}
                    <Text
                        style={[
                            tradepercent > 0 ? styles.profit : styles.loss
                        ]}
                    >
                        {profit.toFixed(2)}
                    </Text>

                </Text> */}
          {/* 
                <Slider
                    style={{ width: "100%", height: 40 }}
                    minimumValue={elasticMin}
                    maximumValue={elasticMax}
                    step={0.5}
                    value={
                        slidermeterPercent < elasticMin || slidermeterPercent > elasticMax
                            ? Number(entry)
                            : slidermeterPercent
                    }
                    onValueChange={(value) => setSliderMeterPercent(value)}
                    minimumTrackTintColor={global.colors.success}
                    maximumTrackTintColor="#ccc"
                    thumbTintColor={global.colors.primary}
                /> */}
        </View>
      </TouchableOpacity>

      <GlobalAlert
        visible={showDisclaimer}
        type="error"
        title="Disclaimer"
        message={`All trade calls/ recommendations are provided by SEBI registered research analysts. Users are advised to consult their personal financial advisors before taking any trading or investing positions. Equitty works as a technology platform provider and holds no responsibility on any losses incurred by the users. Certification from NISM, registration with SEBI, or past performance of trading calls does not guarantee any assurance on profitable outcomes on calls/recommendations given on the platform. General Terms & Conditions, Policies and Disclaimers applies to all the content provided on the application, by using the application user confirms and provide their consent to the same.`}
        onClose={() => setShowDisclaimer(false)}
      />
    </>
  );
};

export default TradeCard;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  card: {
    backgroundColor: global.colors.background,
    borderRadius: 18,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: global.colors.border,
    elevation: 3,
  },

  /* ---------- HEADER ---------- */

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  script: {
    fontSize: 18,
    fontWeight: "800",
    color: global.colors.secondary,
    marginRight: 8,
  },
  lockedScriptTrigger: {
    alignSelf: "flex-start",
  },
  lockedScript: {
    letterSpacing: 1,
  },

  liveBadge: {
    backgroundColor: global.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },

  liveText: {
    fontSize: 11,
    fontWeight: "700",
  },

  profitBadge: {
    marginTop: 6,
    // backgroundColor: global.colors.surface,
    alignSelf: "stretch",
    justifyContent: "space-between",
    paddingHorizontal: 0,
    paddingVertical: 4,
    borderRadius: 12,
  },

  profitText: {
    color: global.colors.secondary,
    fontSize: 11,
    fontWeight: "700",
    overflow:'hidden'
  },
    profitText1: {
    color: global.colors.secondary,
    fontSize: 11,
    fontWeight: "700",
    overflow:'hidden',
    textAlign:'right'
  },

  actionButton: {
    alignSelf: "flex-start",
  },

  actionButtonDisabled: {
    opacity: 0.55,
  },

  buyButton: {
    backgroundColor: global.colors.success,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },

  buyButtonDisabled: {
    backgroundColor: global.colors.textSecondary,
  },

  buyText: {
    color: global.colors.background,
    fontWeight: "800",
    fontSize: 13,
  },

  /* ---------- VALUES ---------- */

  valuesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 5,
  },

  label: {
    fontSize: 11,
    color: global.colors.textSecondary,
  },

  value: {
    fontSize: 14,
    fontWeight: "700",
    color: global.colors.secondary,
  },

  /* ---------- METER ---------- */

  meterWrapper: {
    marginTop: 45,
    position: "relative",
    overflow: "visible", // prevent bubble from being clipped at edges
  },

  meterBar: {
    height: 8,
    borderRadius: 8,
  },

  /* POINTER */
  pointerWrapper: {
    position: "absolute",
    top: 0,
    alignItems: "center",
    zIndex: 5,
    transform: [{ translateX: -5 }], // half of dot width
  },

  pointerLine: {
    width: 2,
    height: 12,
    backgroundColor: global.colors.secondary,
  },

  pointerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: global.colors.secondary,
    marginTop: -2,
  },

  /* LTP TOOLTIP — sibling of bar, pixel-based left */
  priceBubble: {
    position: "absolute",
    bottom: 12, // above the bar (bar is 8px, triangle is ~10px)
    backgroundColor: global.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: global.colors.border,
    zIndex: 10,
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
  },

  priceText: {
    fontSize: 11,
    marginRight: 3,
    fontWeight: "700",
    color: global.colors.secondary,
  },

  priceArrow: {
    position: "absolute",
    top: -6,
    left: "50%",
    marginLeft: -5,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: global.colors.surface,
  },

  /* Triangle indicator on bar — same as HTML .indicator */
  indicator: {
    position: "absolute",
    bottom: 8, // sits just on top of the bar
    transform: [{ translateX: -6 }], // center the 12px-wide triangle
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: global.colors.textPrimary,
    zIndex: 6,
  },

  /* SL / TARGET BELOW BAR */

  meterBottomLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },

  slText: {
    fontSize: 11,
    fontWeight: "700",
    color: global.colors.error,
  },

  targetText: {
    fontSize: 11,
    fontWeight: "700",
    color: global.colors.success,
  },

  /* ---------- DATES ---------- */

  datesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },

  dateText: {
    fontSize: 11,
    color: global.colors.textPrimary,
  },

  /* ---------- DISCLAIMER ---------- */


  disclaimerview:{
    flexDirection:"row",
    flex:1,
    justifyContent:"space-between"
  },

  disclaimerBtn: {
    marginTop: 15,
    backgroundColor: global.colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  disclaimerText: {
    color: global.colors.background,
    fontSize: 10,
    fontWeight: "600",
  },
  marker: {
    position: "absolute",
    bottom: -6,
    width: 2,
    height: 14,
    backgroundColor: global.colors.textPrimary,
    transform: [{ translateX: -1 }],
  },
  markerLabel: {
    position: "absolute",
    top: 20,
    fontSize: 10,
    color: global.colors.textSecondary,
    transform: [{ translateX: -25 }],
    textAlign: "center",
    width: 50,
  },
  tooltip: {
    position: "absolute",
    bottom: 28,
    backgroundColor: global.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
    alignItems: "center",
  },
  tooltipText: {
    fontSize: 11,
    fontWeight: "700",
    color: global.colors.background,
  },
  tooltipArrow: {
    position: "absolute",
    bottom: -6,
    left: "50%",
    marginLeft: -5,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: global.colors.primary,
  },
  scriptWrapper: {
    position: "relative",
    marginRight: 8,
    alignSelf: "flex-start", // 🔥 Important
  },
  scriptBlurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    overflow: "hidden",
  },

  scriptBlurOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    overflow: "hidden",
  },

  lockCircleSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  profit: {
    color: "green",
    fontSize: 11,
    fontWeight: "700",
  },
  loss: {
    color: "red",
    fontSize: 11,
    fontWeight: "700",
  },
});
