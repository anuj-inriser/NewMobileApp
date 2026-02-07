import React from "react";
import { View, Text, StyleSheet } from "react-native";

const PositionCard = ({
  tradingsymbol,
  exchange,
  producttype,
  buyqty,
  sellqty,
  netqty,
  buyavgprice,
  sellavgprice,
  ltp,
  pnl,
  unrealised,
  realised,
}) => {
  const pnlColor = Number(pnl) < 0 ? global.colors.error : global.colors.success;
  return (
    <View style={styles.card}>
      {/* HEADER ROW */}
      <View style={styles.headerRow}>
        <View style={styles.gridItemTop}>
          <Text style={styles.symbol}>
            {tradingsymbol}&nbsp;
            <Text style={styles.label}>
              (Net Qty :{" "}
              <Text style={styles.topValue}>{Number(netqty).toFixed(2)}</Text>)
            </Text>
          </Text>
        </View>
        <Text style={styles.label}>
          PNL :{" "}
          <Text style={[styles.value, { color: pnlColor }]}>
            {Number(pnl).toFixed(2)}
          </Text>
        </Text>
      </View>
      <View style={{ flexDirection: "row", marginBottom: 8 }}>
        <View
          style={{
            backgroundColor: Number(netqty) !== 0 ? global.colors.surface : global.colors.surface,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 4,
            alignSelf: "flex-start",
          }}
        >
          <Text
            style={{
              color: Number(netqty) !== 0 ? global.colors.secondary : global.colors.textSecondary,
              fontSize: 10,
              fontWeight: "700",
            }}
          >
            {Number(netqty) !== 0 ? "OPEN" : "CLOSED"}
          </Text>
        </View>
      </View>
      {/* Row 1 */}
      <View style={styles.gridRow}>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Exchange</Text>
          <Text style={styles.value}>{exchange}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Product</Text>
          <Text style={styles.value}>{producttype}</Text>
        </View>
        <View style={styles.gridItem}></View>
      </View>

      {/* Row 2 */}
      <View style={styles.gridRow}>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Buy Qty</Text>
          <Text style={styles.value}>{Number(buyqty).toFixed(2)}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Buy Avg. Price</Text>
          <Text style={styles.value}>{Number(buyavgprice).toFixed(2)}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Buy Value</Text>
          <Text style={styles.value}>
            {(Number(buyqty) * Number(buyavgprice) || 0).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Row 3 */}
      <View style={styles.gridRow}>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Sell Qty</Text>
          <Text style={styles.value}>{Number(sellqty).toFixed(2)}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Sell Avg. Price</Text>
          <Text style={styles.value}>{Number(sellavgprice).toFixed(2)}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Sell Value</Text>
          <Text style={styles.value}>
            {(Number(sellqty) * Number(sellavgprice) || 0).toFixed(2)}
          </Text>
        </View>
      </View>
      <View style={styles.gridRow}>
        <View style={styles.gridItem}>
          <Text style={styles.label}>LTP</Text>
          <Text style={styles.value}>{Number(ltp).toFixed(2)}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Unrealised</Text>
          <Text style={styles.value}>{Number(unrealised).toFixed(2)}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Realised</Text>
          <Text style={styles.value}>{Number(realised).toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
};

export default PositionCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: global.colors.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: global.colors.border,
    marginHorizontal: 20,
    marginTop: 10,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  symbol: {
    fontSize: 16,
    fontWeight: "700",
    color: global.colors.textPrimary,
    flex: 1,
  },

  typeTag: {
    flexDirection: "row",
    alignItems: "center",
  },

  typeDot: {
    width: 10,
    height: 10,
    borderRadius: 50,
    marginRight: 6,
  },

  typeText: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  gridItem: {
    width: "25%",
  },
  gridItemTop: {
    width: "80%",
  },

  gridItemTop2: {
    width: "20%",
  },

  gridItem2: {
    width: "50%",
  },

  label: {
    fontSize: 11,
    color: global.colors.textSecondary,
  },
  topValue: {
    fontSize: 11,
    fontWeight: "600",
    color: global.colors.textPrimary,
    marginTop: 2,
  },
  value: {
    fontSize: 13,
    fontWeight: "600",
    color: global.colors.textPrimary,
    marginTop: 2,
  },
});