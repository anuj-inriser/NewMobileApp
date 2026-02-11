import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRealtimePrices } from "../hooks/useRealtimePrices";
import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "../utils/apiUrl";
import Swipeable from "react-native-gesture-handler/Swipeable";
import axiosInstance from "../api/axios";

// ✅ Vertical Card with Swipe Gesture
const IndexVerticalCard = ({ index, onPress, onSwipeRight }) => {
  const isPositive = index.change >= 0;
  const color = isPositive ? global.colors.success : global.colors.error;

  const displayChange =
    typeof index.change === "number"
      ? Math.abs(index.change).toFixed(2)
      : "0.00";

  const displayPercent =
    typeof index.changePercent === "number"
      ? Math.abs(index.changePercent).toFixed(2)
      : "0.00";

  // Right swipe action - "View Chart"
  const renderRightActions = () => (
    <View style={styles.rightAction}>
      <Ionicons name="bar-chart-outline" size={24} color={global.colors.background} />
      <Text style={styles.actionText}>Chart</Text>
    </View>
  );

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      onSwipeableRightOpen={() => onSwipeRight && onSwipeRight(index)}
      overshootRight={false}
    >
      <TouchableOpacity
        style={styles.verticalCard}
        onPress={() => onPress && onPress(index)}
      >
        <View style={styles.verticalCardLeft}>
          <Text style={styles.companyName}>{index.symbol}</Text>
          <Text
            style={[styles.verticalSymbol, { color: global.colors.textSecondary, fontSize: 11 }]}
          >{`${index.name}`}</Text>
        </View>

        <View style={styles.verticalCardRight}>
          <Text style={[styles.verticalPrice]}>
            ₹
            {index.value.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text style={[styles.verticalChange, { color }]}>
            ₹{displayChange} ({displayPercent}%)
          </Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

// ✅ Main Component — Vertical Only
const Indices = ({ exchange = "NSE", externalData, onIndexPress, onSwipeToChart, refreshing, onRefresh }) => {
  const { prices: realtimePrices } = useRealtimePrices();

  // ✅ Fetch from API (if no externalData)
  const {
    data: indicesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["indicesList", exchange],
    queryFn: async () => {
      const url =
        exchange === "BSE"
          ? `/indicesNew/bse`
          : `/indicesNew/nse`;

      const response = await axiosInstance.get(url);
      return Array.isArray(response.data?.data)
        ? response.data.data
        : [];
    },
    enabled: !externalData?.length,
    staleTime: 5 * 60 * 1000, // 5 mins
  });

  // ✅ Normalize externalData (HomeScreen style)
  const normalizedExternalData = useMemo(() => {
    if (!Array.isArray(externalData) || externalData.length === 0) return [];

    return externalData.map((item) => {
      const value = Number(item.ltp || item.value || 0);
      const prevClose = Number(item.prev_close || item.prevClose || 0);
      const change = value - prevClose;
      const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

      return {
        symbol: item.symbol || item.group_name || item.script_id,
        name: item.name || item.group_name || item.script_name,
        value,
        prevClose,
        change,
        changePercent,
        timestamp: item.timestamp || new Date().toISOString(),
      };
    });
  }, [externalData]);

  // ✅ Choose data source
  const indicesSource = externalData
    ? normalizedExternalData
    : indicesData || [];

  // ✅ Merge with realtime (HomeScreen style)
  const indicesWithRealtimeData = useMemo(() => {
    if (!indicesSource?.length) return [];

    let NSE_SYMBOLS = [];
    let BSE_SYMBOLS = [];

    if (indicesSource) {
      if (exchange === "NSE")
        NSE_SYMBOLS.push(...indicesSource.map(item => item.name));
      else if (exchange === "BSE")
        BSE_SYMBOLS.push(...indicesSource.map(item => item.name));
    }
    const filtered = indicesSource.filter((index) => {
      const name = (index.name || index.symbol || "").toUpperCase();
      if (exchange === "NSE") {
        return NSE_SYMBOLS.some((sym) => name.includes(sym));
      }
      if (exchange === "BSE") {
        return BSE_SYMBOLS.some((sym) => name.includes(sym));
      }
      return true;
    });

    return filtered.map((index) => {
      const rt = realtimePrices[index.symbol] || realtimePrices[index.name];
      if (!rt) return index; // Stable DB data

      const prevClose =
        rt.prevClose || index.prevClose || rt.open || index.value;

      const change = rt.price - prevClose;
      const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

      return {
        ...index,
        value: rt.price,
        change,
        changePercent,
        timestamp: rt.timestamp || new Date().toISOString(),
      };
    });
  }, [indicesSource, realtimePrices, exchange]);

  // ✅ Loading
  if (isLoading && !externalData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={global.colors.secondary} />
        <Text style={styles.loadingText}>Loading indices...</Text>
      </View>
    );
  }

  // ✅ Error
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={global.colors.error} />
        <Text style={styles.errorText}>Failed to load indices</Text>
        <TouchableOpacity
          style={styles.retryButton}
          // onPress={() => window.location.reload()}
          onPress={() => { }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ✅ Empty
  if (indicesWithRealtimeData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color={global.colors.secondary} />
      </View>
    );
  }

  // ✅ ONLY VERTICAL LIST — NO HORIZONTAL, NO GRID
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <View style={styles.verticalList}>
        {indicesWithRealtimeData.map((index, i) => (
          <IndexVerticalCard
            key={`${exchange}-${index.symbol}-${i}`}
            index={index}
            onPress={onIndexPress}
            onSwipeRight={onSwipeToChart}
          />
        ))}
      </View>
    </ScrollView>
  );
};

// ✅ Styles — Cleaned (only vertical needed)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: global.colors.background,
    marginBottom: 55,
  },
  verticalList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  verticalCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: global.colors.background,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: global.colors.border,
    shadowColor: global.colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  verticalCardLeft: {
    flex: 1,
  },
  verticalCardRight: {
    alignItems: "flex-end",
  },
  companyName: { fontSize: 14, fontWeight: "600" },
  verticalSymbol: {
    fontSize: 14,
    color: global.colors.textPrimary,
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

  // Swipe Actions
  rightAction: {
    backgroundColor: global.colors.secondary,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
  },
  actionText: {
    color: global.colors.background,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: global.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 18,
    color: global.colors.error,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: global.colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: global.colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: global.colors.textSecondary,
  },
  actionWrapper: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginVertical: 6,
    borderRadius: 14,
    backgroundColor: global.colors.primary,
  }
});

export default Indices;