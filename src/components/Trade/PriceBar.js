import React, { useState, useMemo } from "react";
import { View, StyleSheet, Text } from "react-native";

const PriceBar = ({ type = "BUY", stopLoss, entry, target, ltp }) => {
  const [barWidth, setBarWidth] = useState(0);

  const isBuy = type.toUpperCase() === "BUY";

  const { min, max, markers } = useMemo(() => {
    const sl = Number(stopLoss);
    const ent = Number(entry);
    const tgt = Number(target);
    const cur = Number(ltp ?? ent);

    // Range Logic: Use user's 0.8 / 1.4 logic but adapt for both directions
    const barLow = isBuy ? sl * 0.95 : tgt * 0.95;
    const barHigh = isBuy ? tgt * 1.05 : sl * 1.05;

    const rangeMin = Math.min(barLow, sl, ent, tgt, cur);
    const rangeMax = Math.max(barHigh, sl, ent, tgt, cur);

    return {
      min: rangeMin,
      max: rangeMax,
      markers: [
        { label: "SL", value: sl, color: "#EF4444" },
        { label: "Entry", value: ent, color: "#666" },
        { label: "Target", value: tgt, color: "#22C55E" },
        { label: "LTP", value: cur, color: "#2962FF", isLTP: true },
      ],
    };
  }, [type, stopLoss, entry, target, ltp]);

  const getPosition = (price) => {
    if (!barWidth) return 0;
    const range = max - min;
    if (range <= 0) return 0;
    return ((price - min) / range) * barWidth;
  };

  return (
    <View style={styles.container}>
      <View
        style={styles.bar}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        {markers.map((m, index) => {
          const leftPos = getPosition(m.value);
          if (m.isLTP) {
            return (
              <View key="LTP" style={[styles.ltpWrapper, { left: leftPos - 25 }]}>
                <View style={styles.bubble}>
                  <Text style={styles.bubbleText}>₹{m.value.toFixed(2)}</Text>
                  <View style={styles.bubbleArrow} />
                </View>
                <View style={[styles.marker, styles.ltpMarker]} />
              </View>
            );
          }
          return (
            <View key={m.label} style={[styles.labelWrapper, { left: leftPos - 25 }]}>
              <View style={[styles.marker, { backgroundColor: m.color }]} />
              <Text style={styles.labelText}>{m.label}</Text>
              <Text style={styles.priceText}>{m.value}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default PriceBar;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 45, // Match default meter spacing
    paddingHorizontal: 10,
  },
  bar: {
    height: 6,
    backgroundColor: "#E5E5E5",
    borderRadius: 4,
    position: "relative",
  },
  marker: {
    position: "absolute",
    top: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#999",
  },
  labelWrapper: {
    position: "absolute",
    top: 0,
    width: 50,
    alignItems: "center",
  },
  labelText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#666",
    marginTop: 15,
  },
  priceText: {
    fontSize: 9,
    color: "#999",
  },
  ltpWrapper: {
    position: "absolute",
    top: 0,
    width: 50,
    alignItems: "center",
  },
  ltpMarker: {
    backgroundColor: "#2962FF",
    width: 14,
    height: 14,
    top: -4,
    zIndex: 5,
  },
  bubble: {
    position: "absolute",
    top: -38,
    backgroundColor: "#2962FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 60,
    alignItems: "center",
  },
  bubbleText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
  },
  bubbleArrow: {
    position: "absolute",
    bottom: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#2962FF",
  },
});
