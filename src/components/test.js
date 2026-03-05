import React, { useState, useMemo } from "react";
import { View, StyleSheet } from "react-native";

const PriceBar = ({ type = "BUY", stopLoss, entry, target }) => {
  const [barWidth, setBarWidth] = useState(0);

  const computedPrices = useMemo(() => {
    if (type === "BUY") {
      const barLow = stopLoss * 0.8;        // 20% below SL
      const barHigh = target * 1.4;         // 40% above Target

      return {
        barLow,
        stopLoss,
        entry,
        target,
        barHigh,
      };
    } else {
      const barLow = stopLoss * 0.8;        // 20% below SL (numeric logic)
      const barHigh = target * 1.4;         // 40% above Target (numeric logic)

      return {
        barLow,
        stopLoss,
        entry,
        target,
        barHigh,
      };
    }
  }, [type, stopLoss, entry, target]);

  // Always sort ascending for UI rendering
  const sortedPrices = useMemo(() => {
    return Object.entries(computedPrices)
      .sort((a, b) => a[1] - b[1]);
  }, [computedPrices]);

  const min = sortedPrices[0][1];
  const max = sortedPrices[sortedPrices.length - 1][1];
  const range = max - min;

  const getPosition = (price) => {
    if (!barWidth) return 0;
    return ((price - min) / range) * barWidth;
  };

  return (
    <View style={styles.container}>
      <View
        style={styles.bar}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        {sortedPrices.map(([key, price], index) => (
          <View
            key={index}
            style={[
              styles.marker,
              { left: getPosition(price) - 6 },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

export default PriceBar;

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  bar: {
    height: 6,
    backgroundColor: "#E5E5E5",
    borderRadius: 4,
    position: "relative",
  },
  marker: {
    position: "absolute",
    top: -7,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2962FF",
  },
});