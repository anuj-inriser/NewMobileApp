import React, { useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { LinearGradient } from "expo-linear-gradient";

const WatchlistItemCard = ({
  data = [],
  realtimePrices = {},
  prevCloses = {},
  onPressItem,
  onRemoveItem,
}) => {
  const swipeableRefs = useRef({});

  const closeSwipe = useCallback((id) => {
    swipeableRefs.current[id]?.close();
  }, []);

  const handleBuy = useCallback(
    (item) => {
      onPressItem?.(item);
      closeSwipe(item.script_id);
    },
    [onPressItem, closeSwipe]
  );

  const handleRemove = useCallback(
    (item) => {
      Alert.alert(
        "Remove from Watchlist?",
        `Remove ${item.script_name}?`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => closeSwipe(item.script_id),
          },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => {
              onRemoveItem?.(item); // ✅ Pass full item object (as expected by fixed handler)
              // Do not close manually — UI re-render will clear swipe
            },
          },
        ],
        { cancelable: true }
      );
    },
    [onRemoveItem, closeSwipe]
  );

  const renderItem = ({ item }) => {
    const symbol = String(item.script_id);
    const rt = realtimePrices[symbol] || realtimePrices[item.token]; // ✅ token fallback

    // ✅ LTP: rt.price → item.value → item.ltp → 0
    const ltp = Number(rt?.price || item.value || item.ltp || 0);

    // ✅ Prev Close: rt.prevClose → item.prevClose → item.prev_close → ltp (no change)
    const prev = Number(
      rt?.prevClose || item.prevClose || item.prev_close || ltp
    );

    // ✅ Recalculate — fresh & consistent
    const change = ltp - prev;
    const changePercent = prev !== 0 ? (change / prev) * 100 : 0;
    const isUp = change >= 0;

    const initials =
      item.script_name
        ?.split(" ")
        .map((w) => w[0]?.toUpperCase())
        .join("")
        .slice(0, 2) || "?";

    return (
      <Swipeable
        ref={(ref) => (swipeableRefs.current[symbol] = ref)}
        renderLeftActions={() => (
          <View style={styles.leftAction}>
            <Text style={styles.buyText}>Buy ››</Text>
          </View>
        )}
        renderRightActions={() => (
          <View style={styles.rightAction}>
            <Text style={styles.removeText}>Remove ‹‹</Text>
          </View>
        )}
        onSwipeableLeftOpen={() => handleBuy(item)}
        onSwipeableRightOpen={() => handleRemove(item)}
        overshootLeft={false}
        overshootRight={false}
      >
        <View style={styles.cardWrapper}>
          <LinearGradient
            colors={isUp ? ["#E6F7EE", "#21C17A"] : ["#FDEAEA", "#E53935"]}
            style={styles.gradientWave}
          />
          <TouchableOpacity style={styles.card} activeOpacity={0.9}>
            {/* <View style={styles.logoFallback}>
              <Text style={styles.logoFallbackText}>{initials}</Text>
            </View> */}
            <View style={styles.infoContainer}>
              <Text style={styles.companyName} numberOfLines={1}>
                {item.script_name}
              </Text>
              <Text style={styles.symbol}>{symbol}</Text>
            </View>
            <View style={styles.rightContainer}>
              <Text
                style={[styles.price, { color: isUp ? "#2E7D32" : "#C62828" }]}
              >
                ₹ {ltp > 0 ? ltp.toFixed(2) : "--"}
              </Text>
              <Text
                style={[styles.change, { color: isUp ? "#2E7D32" : "#C62828" }]}
              >
                {change.toFixed(2)} ({changePercent.toFixed(2)}%)
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </Swipeable>
    );
  };

  if (!data.length) {
    return (
      <View style={styles.emptyWrapper}>
        <Text style={styles.emptyText}>No stocks in watchlist</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => String(item.script_id)}
      renderItem={renderItem}
      removeClippedSubviews
      showsVerticalScrollIndicator={false}
    />
  );
};

export default React.memo(WatchlistItemCard);

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  cardWrapper: { marginVertical: 6, marginHorizontal: 12 },
  gradientWave: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "35%",
    borderRadius: 14,
    opacity: 0.2,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 14,
    elevation: 2,
  },
  logoFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#210F47",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logoFallbackText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  infoContainer: { flex: 1, height: "68px", width: "327px" },
  companyName: { fontSize: 14, fontWeight: "600" },
  symbol: { fontSize: 11, color: "#666" },
  rightContainer: { alignItems: "flex-end" },
  price: { fontSize: 14, fontWeight: "600" },
  change: { fontSize: 11, fontWeight: "600" },
  leftAction: { justifyContent: "center", paddingLeft: 30, width: 90 },
  buyText: { fontWeight: "700", color: "#210F47" },
  rightAction: { justifyContent: "center", paddingRight: 30, width: 110 },
  removeText: { fontWeight: "700", color: "#D32F2F" },
  emptyWrapper: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#777" },
});
