import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  MoreHorizontal,
  Pin,
  Share2,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react-native';
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useIntervalData } from '../hooks/useIntervalData';

const { width } = Dimensions.get('window');

const StockCard = ({ stock, realtimeData }) => {
  const [selectedInterval, setSelectedInterval] = useState('1D');
  const intervals = ['1m', '5m', '15m', '1H', '1D', '1W', '1M'];

  // Convert UI interval to API interval
  const getApiInterval = (uiInterval) => {
    if (uiInterval === '1M') return '1M';
    if (uiInterval === '1m') return '1m';
    const lower = uiInterval.toLowerCase();
    if (['5m', '15m', '1h', '1d', '1w'].includes(lower)) {
      return lower;
    }
    return '1d';
  };

  const apiInterval = getApiInterval(selectedInterval);
  const { data: intervalData, loading } = useIntervalData(stock.symbol, apiInterval);

  // REALTIME DATA LOGIC (Efficient Global Socket)
  // Check if we have realtime socket data passed from parent
  const hasRealtime = !!realtimeData;

  // Helper to ensure number
  const safeFloat = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  // Price Hierarchy: Realtime Socket > Interval Poll (Chart) > Static List Prop
  const rawPrice = (hasRealtime && realtimeData.price !== undefined) ? realtimeData.price : (intervalData?.ltp ?? (stock.ltp || stock.price || 0));
  const currentPrice = safeFloat(rawPrice);

  const rawChange = (hasRealtime && realtimeData.change !== undefined) ? realtimeData.change : (intervalData?.priceChange ?? (stock.change || stock.priceChange || 0));
  const currentChange = safeFloat(rawChange);

  const rawChangePercent = (hasRealtime && realtimeData.changePercent !== undefined) ? realtimeData.changePercent : (intervalData?.percentChange ?? (stock.percentChange || stock.changePercent || 0));
  const currentChangePercent = safeFloat(rawChangePercent);

  const currentHigh = intervalData?.ohlc?.high ?? 0;
  const currentLow = intervalData?.ohlc?.low ?? 0;

  const isPositive = currentChange >= 0;
  const color = isPositive ? '#22c55e' : '#ef4444';

  // X-axis formatting
  const formatXAxisLabel = useCallback((time, interval, index, total) => {
    // Handle different time formats (Date string, timestamp in ms, timestamp in sec)
    let date;
    if (typeof time === 'string') {
      date = new Date(time);
    } else if (typeof time === 'number') {
      // If time is less than year 2000 in ms, assume it's seconds
      date = time < 946684800000 ? new Date(time * 1000) : new Date(time);
    } else {
      date = new Date(time);
    }

    // Validate date
    if (isNaN(date.getTime())) return '';

    const labelFrequency = Math.max(1, Math.floor(total / 4));
    if (index % labelFrequency !== 0 && index !== total - 1) return '';

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });

    switch (interval) {
      case '1m':
      case '5m':
      case '15m':
        return `${hours}:${minutes}`;
      case '1h':
      case '1d':
      case '1w':
      case '1M':
        return `${day} ${month}`;
      default:
        return '';
    }
  }, []);

  // Build chart data
  const chartData = useMemo(() => {
    return intervalData?.candles.map((item, index) => ({
      value: item.close,
      label: formatXAxisLabel(
        item.time,
        apiInterval,
        index,
        intervalData.candles.length
      ),
      dataPointColor: color,
      labelTextStyle: {
        color: '#666',
        width: 80,
        textAlign: 'center',
      },
    })) || [];
  }, [intervalData, apiInterval, color]);

  const chartWidth = width - 80;
  const dynamicSpacing =
    chartData.length > 1
      ? chartWidth / (chartData.length - 1)
      : chartWidth;

  // Y-axis scaling state
  const [yAxisMax, setYAxisMax] = useState(0);
  const [yAxisMin, setYAxisMin] = useState(0);
  const scrollTimeout = useRef(null);

  const updateScaling = useCallback(
    (offsetX) => {
      if (chartData.length === 0) return;

      const spacing = dynamicSpacing;

      const startIndex = Math.max(0, Math.floor(offsetX / spacing));
      const endIndex = Math.min(
        chartData.length,
        Math.ceil((offsetX + chartWidth) / spacing) + 1
      );

      const visibleData = chartData.slice(startIndex, endIndex);
      if (visibleData.length === 0) return;

      const values = visibleData.map((d) => d.value);
      const visibleMax = Math.max(...values);
      const visibleMin = Math.min(...values);

      setYAxisMax(visibleMax);
      setYAxisMin(visibleMin);
    },
    [chartData, dynamicSpacing, chartWidth]
  );

  // Initial scaling
  useEffect(() => {
    if (chartData.length > 0) {
      updateScaling(0);
    }
  }, [chartData, updateScaling]);

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      updateScaling(offsetX);
    }, 50);
  };

  // Shift visible chart data
  const displayData = chartData.map((d) => ({
    ...d,
    value: Math.max(0, d.value - yAxisMin),
  }));

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.stockHeader}>
        <View style={styles.stockInfo}>
          <Text style={styles.stockName}>{stock.name}</Text>
          <Text style={styles.stockSymbol}>{stock.symbol}</Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            {loading && currentPrice === 0 ? '--' : `₹${currentPrice.toFixed(2)}`}
          </Text>

          <Text style={[styles.change, { color }]}>
            {loading && currentPrice === 0
              ? '--'
              : `${isPositive ? '+' : ''}${currentChange.toFixed(2)} (${currentChangePercent.toFixed(2)}%)`}
          </Text>
        </View>
      </View>

      {/* OHLC */}
      {/* <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Open</Text>
          <Text style={styles.statValue}>
            {loading && currentOpen === 0 ? '--' : `₹${currentOpen.toFixed(2)}`}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>High</Text>
          <Text style={styles.statValue}>
            {loading && currentHigh === 0 ? '--' : `₹${currentHigh.toFixed(2)}`}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Low</Text>
          <Text style={styles.statValue}>
            {loading && currentLow === 0 ? '--' : `₹${currentLow.toFixed(2)}`}
          </Text>
        </View>
      </View> */}

      {/* Market Analysis */}
      <View style={styles.analysisContainer}>
        <View style={styles.analysisHeader}>

          <Text style={styles.analysisTitle}>Market Analysis</Text>

          <View style={styles.chevronGroup}>
            <TouchableOpacity style={styles.navButton}>
              <ChevronLeft size={16} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.navButton}>
              <ChevronRight size={16} color="#666" />
            </TouchableOpacity>
          </View>

        </View>

        <Text style={styles.analysisText}>{stock.analysis}</Text>
      </View>
      {/* Intervals */}
      <View style={styles.intervalContainer}>
        {intervals.map((interval) => (
          <TouchableOpacity
            key={interval}
            style={[
              styles.intervalButton,
              selectedInterval === interval && styles.activeInterval,
            ]}
            onPress={() => setSelectedInterval(interval)}
          >
            <Text
              style={[
                styles.intervalText,
                selectedInterval === interval && styles.activeIntervalText,
              ]}
            >
              {interval}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Main Chart */}
      <View style={styles.chartContainer}>
        {loading ? (
          <ActivityIndicator size="small" color={color} style={{ flex: 1 }} />
        ) : chartData.length > 0 ? (
          <LineChart
            data={displayData}
            height={200}
            width={width - 80}
            isAnimated
            color={color}
            thickness={2}
            startFillColor={color}
            endFillColor={color}
            startOpacity={0.2}
            endOpacity={0.0}
            spacing={dynamicSpacing}
            initialSpacing={0}
            endSpacing={0}
            hideDataPoints={chartData.length > 20}
            rulesColor="#E0E0E0"
            rulesType="solid"
            xAxisColor="#C0C0C0"
            yAxisColor="#C0C0C0"
            yAxisTextStyle={{ color: '#666', fontSize: 11, fontWeight: '500' }}
            xAxisLabelTextStyle={{ color: '#666', fontSize: 11, fontWeight: '500', width: 55, textAlign: 'center' }}
            noOfSections={5}
            maxValue={Math.max(0.1, yAxisMax - yAxisMin)}
            formatYLabel={(label) => (parseFloat(label) + yAxisMin).toFixed(2)}
            xAxisIndicesHeight={0}
            xAxisIndicesWidth={0}
            xAxisThickness={1}
            yAxisThickness={1}
            curved={false}
            areaChart
            onScroll={handleScroll}
          />
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No data available</Text>
          </View>
        )}
      </View>



      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <ThumbsUp size={20} color="#666" />
          <Text style={styles.actionText}>{stock.stats.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <ThumbsDown size={20} color="#666" />
          <Text style={styles.actionText}>{stock.stats.dislikes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <MessageCircle size={20} color="#666" />
          <Text style={styles.actionText}>{stock.stats.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Share2 size={20} color="#666" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Pin size={20} color="#666" />
          <Text style={styles.actionText}>Pin</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <MoreHorizontal size={20} color="#666" />
          <Text style={styles.actionText}>More</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    margin: 20
  },
  stockHeader: {
    backgroundColor: '#E6E0E9',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  stockInfo: { flex: 1 },
  stockName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  stockSymbol: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  priceContainer: { alignItems: 'flex-end' },
  price: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  change: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#F5F5F7',
    padding: 12,
    borderRadius: 12,
  },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '600', color: '#000' },

  analysisContainer: { marginBottom: 16, backgroundColor: "#fff", paddingHorizontal: 10, },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  navButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisTitle: { fontSize: 15, fontWeight: '700', color: '#000' },
  analysisText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },

  chartContainer: {
    height: 250,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    paddingHorizontal: 10,
  },

  intervalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  intervalButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeInterval: { backgroundColor: '#210F47' },
  intervalText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeIntervalText: { color: '#FFF' },

  actionsContainer: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#E6E0E9',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  actionButton: { alignItems: 'center', gap: 4 },
  actionText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },

  noDataContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noDataText: { fontSize: 14, color: '#999', fontWeight: '500' },
  chevronGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

});

export default StockCard;
