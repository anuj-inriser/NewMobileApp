import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useDrawer } from "../context/DrawerContext";


const UNDO_TIMEOUT = 2000;

const WatchlistItemCard = ({
  data = [],
  realtimePrices = {},
  prevCloses = {},
  onPressItem,
  onRemoveItem,
   isFetching,
  refetch,
}) => {
  const swipeableRefs = useRef({});
  const undoTimerRef = useRef(null);
  const pendingDeleteIds = useRef(new Set());
  const { openStockInfoDrawer } = useDrawer();

  const [listData, setListData] = useState([]);
  const [undoItem, setUndoItem] = useState(null);

  useEffect(() => {
    setListData(
      data.filter(
        (item) => !pendingDeleteIds.current.has(item.script_id)
      )
    );
  }, [data]);

  const closeSwipe = (id) => {
    swipeableRefs.current[id]?.close();
  };

  const handleBuy = (item) => {
    onPressItem?.(item);
    closeSwipe(item.script_id);
  };

  const handleRemove = (item) => {
    closeSwipe(item.script_id);

    pendingDeleteIds.current.add(item.script_id);

    setListData((prev) =>
      prev.filter((i) => i.script_id !== item.script_id)
    );

    setUndoItem(item);

    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }

    undoTimerRef.current = setTimeout(() => {
      onRemoveItem?.(item);
      setUndoItem(null);
    }, UNDO_TIMEOUT);
  };

  const handleUndo = () => {
    if (!undoItem) return;

    clearTimeout(undoTimerRef.current);

    pendingDeleteIds.current.delete(undoItem.script_id);

    setListData((prev) => [undoItem, ...prev]);

    setUndoItem(null);
  };

  const renderItem = ({ item }) => {
    const symbol = item.symbol || item.script_symbol || String(item.script_id);
    const rt = realtimePrices[symbol] || realtimePrices[item.token];

    const ltp = Number(rt?.price || item.value || item.ltp || 0);
    const prev = Number(rt?.prevClose || item.prevClose || item.prev_close || ltp);

    const change = ltp - prev;
    const changePercent = prev !== 0 ? (change / prev) * 100 : 0;
    const isUp = change >= 0;
    const initials =
      item.name
        ?.split(" ")
        .map((w) => w[0]?.toUpperCase())
        .join("")
        .slice(0, 2) || "?";
    const renderRightActions = () => {
      return (
        <View style={styles.actionWrapper}>
          <MaterialIcons name="delete-outline" size={22} color={global.colors.textSecondary} />
        </View>
      );
    };

    return (
      <Swipeable
        ref={(ref) => (swipeableRefs.current[symbol] = ref)}
        renderLeftActions={() => (
          <View style={styles.leftAction}>
            <Text style={styles.buyText}>Buy ››</Text>
          </View>
        )}
        renderRightActions={renderRightActions}
        onSwipeableLeftOpen={() => handleBuy(item)}
        onSwipeableRightOpen={() => handleRemove(item)}
        overshootLeft={false}
        overshootRight={false}
      >
        <TouchableOpacity 
          style={styles.cardWrapper} 
          activeOpacity={0.9}
          onPress={() => openStockInfoDrawer(symbol, null, {
            name: item.name,
            price: ltp
          })}
        >
          <LinearGradient
            colors={isUp ? [global.colors.surface, global.colors.success] : [global.colors.error, global.colors.error]}
            style={styles.gradientWave}
          />
          <View style={styles.card}>
            <View style={styles.infoContainer}>
              <Text style={styles.companyName} numberOfLines={1}>
                {symbol}
              </Text>
              <Text style={styles.symbol}>{item.name}</Text>
            </View>
            <View style={styles.verticalCardRight}>
              <Text
                style={[styles.verticalPrice, { color: "#000" }]}
              >
                ₹ {ltp > 0 ? ltp.toFixed(2) : "--"}
              </Text>
              <Text
                style={[styles.verticalChange, { color: isUp ? global.colors.success : global.colors.error }]}
              >
                {Math.abs(change).toFixed(2)} ({Math.abs(changePercent).toFixed(2)}%)
              </Text>

            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={listData}
        keyExtractor={(item) => String(item.script_id)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
        refreshing={isFetching}
        onRefresh={refetch}
      />

      {undoItem && (
        <View style={styles.undoBar}>
          <Text style={styles.undoText}>
            {undoItem.script_name} removed
          </Text>
          <TouchableOpacity onPress={handleUndo}>
            <Text style={styles.undoAction}>UNDO</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default React.memo(WatchlistItemCard);

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
    backgroundColor: global.colors.background,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: global.colors.border,
    shadowColor: global.colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  infoContainer: { flex: 1 },
  companyName: { fontSize: 14, fontWeight: "600", color: global.colors.textPrimary },
  symbol: { fontSize: 11, color: global.colors.textSecondary },
  verticalCardRight: {
    alignItems: "flex-end",
  },
  verticalPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: global.colors.textPrimary,
  },
  verticalChange: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  leftAction: { justifyContent: "center", paddingLeft: 30, width: 90 },
  buyText: { fontWeight: "700", color: global.colors.secondary },
  rightAction: { justifyContent: "center", paddingRight: 30, width: 110 },
  removeText: { fontWeight: "700", color: global.colors.error },
  undoBar: {
    position: "absolute",
    bottom: 70,
    left: 16,
    right: 16,
    backgroundColor: global.colors.textSecondary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 20,
    zIndex: 9999,
  },
  undoText: { color: global.colors.background, fontSize: 13 },
  undoAction: { color: global.colors.success, fontWeight: "700" },
  actionWrapper: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginVertical: 6,
    borderRadius: 14,
    backgroundColor: global.colors.surface,
  },
  emptyText: { color: global.colors.textSecondary },
});