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


const UNDO_TIMEOUT = 5000;

const WatchlistItemCard = ({
  data = [],
  realtimePrices = {},
  prevCloses = {},
  onPressItem,
  onRemoveItem,
}) => {
  const swipeableRefs = useRef({});
  const undoTimerRef = useRef(null);
  const pendingDeleteIds = useRef(new Set());

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
    const symbol = String(item.script_id);
    const rt = realtimePrices[symbol] || realtimePrices[item.token];

    const ltp = Number(rt?.price || item.value || item.ltp || 0);
    const prev = Number(
      rt?.prevClose || item.prevClose || item.prev_close || ltp
    );

    const change = ltp - prev;
    const changePercent = prev !== 0 ? (change / prev) * 100 : 0;
    const isUp = change >= 0;

    const renderRightActions = () => {
      return (
        <View style={styles.actionWrapper}>
          <MaterialIcons name="delete-outline" size={22} color="#555" />
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
        <View style={styles.cardWrapper}>
          <LinearGradient
            colors={isUp ? ["#E6F7EE", "#21C17A"] : ["#FDEAEA", "#E53935"]}
            style={styles.gradientWave}
          />
          <TouchableOpacity style={styles.card} activeOpacity={0.9}>
            <View style={styles.infoContainer}>
              <Text style={styles.companyName} numberOfLines={1}>
                {item.script_name}
              </Text>
              <Text style={styles.symbol}>{symbol}</Text>
            </View>
            <View style={styles.verticalCardRight}>
              <Text
                style={[styles.verticalPrice, { color: isUp ? "#2E7D32" : "#C62828" }]}
              >
                ₹ {ltp > 0 ? ltp.toFixed(2) : "--"}
              </Text>
              <Text
                style={[styles.verticalChange, { color: isUp ? "#2E7D32" : "#C62828" }]}
              >
                {Math.abs(change).toFixed(2)} ({Math.abs(changePercent).toFixed(2)}%)
              </Text>

            </View>
          </TouchableOpacity>
        </View>
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
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 14,
    elevation: 2,
  },
  infoContainer: { flex: 1 },
  companyName: { fontSize: 14, fontWeight: "600" },
  symbol: { fontSize: 11, color: "#666" },
  verticalCardRight: {
    alignItems: "flex-end",
  },
  verticalPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  verticalChange: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  leftAction: { justifyContent: "center", paddingLeft: 30, width: 90 },
  buyText: { fontWeight: "700", color: "#210F47" },
  rightAction: { justifyContent: "center", paddingRight: 30, width: 110 },
  removeText: { fontWeight: "700", color: "#D32F2F" },
  undoBar: {
    position: "absolute",
    bottom: 70,
    left: 16,
    right: 16,
    backgroundColor: "#2E2E2E",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 20,
    zIndex: 9999,
  },
  undoText: { color: "#fff", fontSize: 13 },
  undoAction: { color: "#4CAF50", fontWeight: "700" },
  actionWrapper: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginVertical: 6,
    borderRadius: 14,
    backgroundColor: "#ECECEC",
  },

});
