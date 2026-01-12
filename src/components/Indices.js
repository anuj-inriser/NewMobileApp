import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRealtimePrices } from '../hooks/useRealtimePrices';
import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '../utils/apiUrl';

// ✅ Vertical Card Only
const IndexVerticalCard = ({ index, onPress }) => {
  const isPositive = index.change >= 0;
  const color = isPositive ? '#22c55e' : '#ef4444';

  const displayChange =
    typeof index.change === "number"
      ? Math.abs(index.change).toFixed(2)
      : "0.00";

  const displayPercent =
    typeof index.changePercent === "number"
      ? Math.abs(index.changePercent).toFixed(2)
      : "0.00";

  // console.log('index', index)


  return (
    <TouchableOpacity
      style={styles.verticalCard}
      onPress={() => onPress && onPress(index)}
    >
      <View style={styles.verticalCardLeft}>
        <Text style={styles.verticalSymbol}>{index.name}</Text>
        <Text style={[styles.verticalSymbol, { color: "#888", fontSize: 12 }]}>{`${index.symbol}`}</Text>
      </View>

      <View style={styles.verticalCardRight}>
        <Text style={styles.verticalPrice}>
          ₹{index.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <Text style={[styles.verticalChange, { color }]}>
          ₹{displayChange} ({displayPercent}%)
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ✅ Main Component — Vertical Only
const Indices = ({
  exchange = 'NSE',
  externalData,
  onIndexPress
}) => {
  const { prices: realtimePrices } = useRealtimePrices();

  // ✅ Fetch from API (if no externalData)
  const { data: indicesData, isLoading, error } = useQuery({
    queryKey: ['indicesList', exchange],
    queryFn: async () => {
      const url = exchange === 'BSE'
        ? `${apiUrl}/api/indicesNew/bse`
        : `${apiUrl}/api/indicesNew/nse`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      return Array.isArray(result.data) ? result.data : [];
    },
    enabled: !externalData,
    staleTime: 5 * 60 * 1000, // 5 mins
  });

  // ✅ Normalize externalData (HomeScreen style)
  const normalizedExternalData = useMemo(() => {
    if (!Array.isArray(externalData) || externalData.length === 0) return [];

    return externalData.map(item => {
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
  const indicesSource = externalData ? normalizedExternalData : indicesData || [];

  // ✅ Merge with realtime (HomeScreen style)
  const indicesWithRealtimeData = useMemo(() => {
    if (!indicesSource?.length) return [];

    // Filter based on exchange
    const NSE_SYMBOLS = ["NIFTY", "BANKNIFTY", "FINNIFTY", "NIFTY50"];
    const BSE_SYMBOLS = ["SENSEX", "BANKEX", "BSE"];

    const filtered = indicesSource.filter(index => {
      const name = (index.name || index.symbol || "").toUpperCase();
      if (exchange === "NSE") {
        return NSE_SYMBOLS.some(sym => name.includes(sym));
      }
      if (exchange === "BSE") {
        return BSE_SYMBOLS.some(sym => name.includes(sym));
      }
      return true;
    });

    return filtered.map(index => {
      const rt = realtimePrices[index.symbol] || realtimePrices[index.name];
      if (!rt) return index; // Stable DB data

      const prevClose =
        rt.prevClose ||
        index.prevClose ||
        rt.open ||
        index.value;

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
        <ActivityIndicator size="large" color="#2F0079" />
        <Text style={styles.loadingText}>Loading indices...</Text>
      </View>
    );
  }

  // ✅ Error
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load indices</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => window.location.reload()}
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
        <Ionicons name="bar-chart-outline" size={48} color="#888" />
        <Text style={styles.emptyText}>No indices data</Text>
      </View>
    );
  }

  // ✅ ONLY VERTICAL LIST — NO HORIZONTAL, NO GRID
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.verticalList}>
        {indicesWithRealtimeData.map((index, i) => (
          <IndexVerticalCard
            key={`${exchange}-${index.symbol}-${i}`}
            index={index}
            onPress={onIndexPress}
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
    backgroundColor: '#F5F5F7',
  },
  verticalList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  verticalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  verticalCardLeft: {
    flex: 1,
  },
  verticalCardRight: {
    flex: 1.2,
    alignItems: 'flex-end',
  },
  verticalSymbol: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  verticalPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  verticalChange: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  // States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 18,
    color: '#ef4444',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#2F0079',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#888',
  },
});

export default Indices;