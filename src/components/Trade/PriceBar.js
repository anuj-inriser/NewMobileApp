import React, { useState, useMemo } from "react";
import { View, StyleSheet, Text } from "react-native";
import LinearGradient from "react-native-linear-gradient";

const BUBBLE_W = 135;
const DOT_SIZE = 10;

const PriceBar = ({
  type = "BUY",
  stopLoss,
  entry,
  target,
  ltp,
  status,
  exitprice,
}) => {
  const [barWidth, setBarWidth] = useState(0);

  const isBuy = type?.toUpperCase() === "BUY";

  // ================= RANGE =================
  const { min, max, markers, gradientColors } = useMemo(() => {
    const sl = Number(stopLoss);
    const ent = Number(entry);
    const tgt = Number(target);

    const leftVal = Math.min(sl, tgt);
    const rightVal = Math.max(sl, tgt);

    const spread = Math.abs(rightVal - leftVal) || 1;
    const buffer = Math.max(spread * 0.02, 1);

    return {
      min: leftVal - buffer,
      max: rightVal + buffer,
      gradientColors: [
        global.colors.primary,
        global.colors.primary,
        global.colors.primary,
      ],
      markers: [
        { label: "SL", value: sl, color: "#EF4444" },
        { label: "Entry", value: ent, color: "#FFBD3E" },
        { label: "Target", value: tgt, color: "#22C55E" },
      ],
    };
  }, [stopLoss, entry, target]);

  // ================= POSITION =================
  const getPos = (price) => {
    if (!barWidth) return 0;

    const range = max - min;
    if (range <= 0) return barWidth / 2;

    const safe = Math.min(Math.max(price, min), max);
    const normalized = (safe - min) / range;

    return normalized * barWidth; // ✅ no rounding
  };

  // ================= DISPLAY PRICE =================
  const isClosed = status !== "Live";

  const isTargetHit = isBuy
    ? Number(ltp) >= Number(target)
    : Number(ltp) <= Number(target);

  const isStopLossHit = isBuy
    ? Number(ltp) <= Number(stopLoss)
    : Number(ltp) >= Number(stopLoss);

  const displayPrice = isClosed
    ? Number(exitprice ?? target ?? stopLoss)
    : isTargetHit
    ? Number(target)
    : isStopLossHit
    ? Number(stopLoss)
    : Number(ltp ?? entry);

  // ================= EXACT SNAP =================
  let ltpRawPos;

  if (Number(displayPrice) === Number(target)) {
    ltpRawPos = getPos(target);
  } else if (Number(displayPrice) === Number(stopLoss)) {
    ltpRawPos = getPos(stopLoss);
  } else {
    ltpRawPos = getPos(displayPrice);
  }

  // ================= PROFIT COLOR =================
  const entryVal = Number(entry);
  const rawProfit = isBuy
    ? displayPrice - entryVal
    : entryVal - displayPrice;

  const bubbleColor = rawProfit >= 0 ? "#009746" : "#D32F2F";

  // ================= 🔥 DYNAMIC BUBBLE =================
  let bubbleLeft = 0;
  let arrowLeft = BUBBLE_W / 2;

  if (ltpRawPos < BUBBLE_W / 2) {
    // LEFT EDGE
    bubbleLeft = 0;
    arrowLeft = ltpRawPos;
  } else if (ltpRawPos > barWidth - BUBBLE_W / 2) {
    // RIGHT EDGE
    bubbleLeft = barWidth - BUBBLE_W;
    arrowLeft = ltpRawPos - bubbleLeft;
  } else {
    // CENTER
    bubbleLeft = ltpRawPos - BUBBLE_W / 2;
    arrowLeft = BUBBLE_W / 2;
  }

  // Clamp arrow safe
  arrowLeft = Math.min(Math.max(arrowLeft, 10), BUBBLE_W - 10);

  return (
    <View style={styles.container}>
      <View
        style={styles.barRow}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        {/* ===== BUBBLE ===== */}
        {barWidth > 0 && (
          <View
            style={[
              styles.bubble,
              { left: bubbleLeft, borderColor: bubbleColor },
            ]}
          >
            <Text style={[styles.bubbleText, { color: bubbleColor }]}>
              ₹
              {Number.isFinite(displayPrice)
                ? displayPrice.toFixed(2)
                : "0.00"}
            </Text>

            <View
              style={[
                styles.bubbleArrow,
                { borderTopColor: bubbleColor, left: arrowLeft },
              ]}
            />
          </View>
        )}

        {/* ===== BAR ===== */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bar}
        />

        {/* ===== DOTS ===== */}
        {markers.map((m) => (
          <View
            key={m.label}
            style={[
              styles.dot,
              {
                backgroundColor: m.color,
                left: getPos(m.value) - DOT_SIZE / 2,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

export default PriceBar;

// ================= STYLES =================
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    marginTop: 8,
  },

  barRow: {
    height: 6,
    position: "relative",
    marginTop: 38,
  },

  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
  },

  dot: {
    position: "absolute",
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    top: -2,
    zIndex: 3,
  },

  bubble: {
    position: "absolute",
    bottom: 14,
    height: 26,
    minWidth: BUBBLE_W,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    zIndex: 20,
  },

  bubbleText: {
    fontSize: 11,
    fontWeight: "800",
  },

  bubbleArrow: {
    position: "absolute",
    bottom: -8, 
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});