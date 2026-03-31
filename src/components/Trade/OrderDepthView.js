import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useDepthData } from "../../hooks/useDepthData";

const splitDepth = (data) => {
  if (!data?.bestFiveData) return { buy: [], sell: [] };

  const buy = [];
  const sell = [];

  data.bestFiveData.forEach((item) => {
    const normalized = {
      price: Number(item.price || 0),
      qty: Number(item.qty || 0),
      orders: item.orders ?? null,
    };

    if (item.side === "Buy") buy.push(normalized);
    else sell.push(normalized);
  });

  return {
    buy: buy.slice(0, 5),
    sell: sell.slice(0, 5),
  };
};


const OrderDepthView = ({
  token,
  symbol,
  staticDepth,
  staleAfterMs = 3000,
}) => {
  const { depthMap, marketPhase  } = useDepthData();

  const realtimeDepth = depthMap[token] || depthMap[symbol] || depthMap.default;
  const staticDepthRaw = staticDepth;
  const [lastRealtimeAt, setLastRealtimeAt] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (realtimeDepth) {
      setLastRealtimeAt(Date.now());
    }
  }, [realtimeDepth]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  // const isRealtimeFresh = false;
  const isRealtimeFresh = !!realtimeDepth;

  const isClosed = marketPhase === "CLOSED";
  
  const depthRaw = isClosed
  ? staticDepthRaw   
    : realtimeDepth;
  

  const { buy, sell } = useMemo(() => {
    return splitDepth(depthRaw);
  }, [depthRaw]);

  if (!depthRaw) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>Waiting for depth data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerText, styles.headerQtyLeft]}>Qty</Text>
        <Text style={[styles.headerText, styles.headerPrice]}>Buy Price</Text>
        <Text style={[styles.headerText, styles.headerPrice]}>Sell Price</Text>
        <Text style={[styles.headerText, styles.headerQtyRight]}>Qty</Text>
      </View>

      {/* Rows */}
      {Array.from({ length: 5 }).map((_, i) => {
        const b = buy[i] || {};
        const s = sell[i] || {};

        return (
          <View key={i} style={styles.row}>
            <Text style={styles.qtyLeft}>
              {b.qty ? b.qty.toLocaleString() : "0"}
            </Text>

            <Text style={styles.buyPrice}>
              {b.price ? `₹${b.price.toFixed(2)}` : "₹0.00"}
            </Text>

            <Text style={styles.sellPrice}>
              {s.price ? `₹${s.price.toFixed(2)}` : "₹0.00"}
            </Text>

            <Text style={styles.qtyRight}>
              {s.qty ? s.qty.toLocaleString() : "0"}
            </Text>
          </View>
        );
      })}

      {/* Footer Totals */}
      <View style={styles.footer}>
        <Text style={styles.totalQty}>
          {depthRaw.totalBuyQty?.toLocaleString()}
        </Text>

        <Text style={styles.totalLabel}>Total Quantity</Text>

        <Text style={styles.totalQty}>
          {depthRaw.totalSellQty?.toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F0EDED",
    borderRadius: 12,
    margin: 12,
    padding: 12,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },

  headerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },

  headerQtyLeft: {
    textAlign: "left",
  },

  headerQtyRight: {
    textAlign: "right",
  },

  headerPrice: {
    textAlign: "center",
  },

  row: {
    flexDirection: "row",
    paddingVertical: 6,
  },

  qtyLeft: {
    flex: 1,
    textAlign: "left",
    fontSize: 13,
    color: "#333",
  },

  qtyRight: {
    flex: 1,
    textAlign: "right",
    fontSize: 13,
    color: "#333",
  },

  buyPrice: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: "#0BA37F", // green
  },

  sellPrice: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: "#D84C4C", // red
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#DDD",
    paddingTop: 10,
    alignItems: "center",
  },

  totalQty: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },

  totalLabel: {
    fontSize: 13,
    color: "#666",
  },

  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  emptyText: {
    fontSize: 12,
    color: "#999",
  },
});

export default OrderDepthView;
