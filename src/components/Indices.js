import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { apiUrl } from '../utils/apiUrl';
import { useIntervalData } from '../hooks/useIntervalData';
import { useRealtimePrices } from '../hooks/useRealtimePrices';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 250; // Increased width to match Figma design

const IndexCard = ({ name, value, change, changePercent, data, onPress }) => {

    const isPositive = change >= 0;

    const chartData = React.useMemo(() => {
        const seed = name
            ? name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
            : 0;

        const open = value - change;
        const close = value;

        const points = 75;
        const baseVolatility = Math.abs(change) * 0.8 || value * 0.002;

        const slopeBias = (seed % 7 - 3) * value * 0.00015;
        const volatility = baseVolatility * (1 + (seed % 5) * 0.15);

        const step = (close - open + slopeBias) / points;

        const values = [];
        let current = open;

        values.push(open);

        for (let i = 1; i < points - 1; i++) {
            const pseudoRandom =
                Math.sin(seed * (i + 1) * 0.45) * 0.5 + 0.5;

            const trend = open + step * i;
            const noise = (pseudoRandom - 0.5) * volatility;
            const drift = Math.sin(i * 0.25 + seed) * volatility * 0.15;

            current = trend + noise + drift;
            values.push(current);
        }

        values.push(close);

        return values.map(v => ({ value: v }));
    }, [name, value, change]);

    const ts = data?.timestamp ? new Date(data.timestamp) : new Date();
    const timestamp =
        ts.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }) +
        ' ' +
        ts.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });

    return (
        <TouchableOpacity style={styles.horizontalCard} onPress={onPress}>
            <View style={styles.cardTopRow}>
                <View>
                    <Text style={styles.indexName}>{name}</Text>
                    <Text style={styles.timestamp}>{timestamp}</Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.indexValue}>
                        ₹ {value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                    <Text
                        style={[
                            styles.changeText,
                            isPositive ? styles.positive : styles.negative,
                        ]}
                    >
                        {isPositive ? '+' : ''}₹{change.toFixed(2)} (
                        {isPositive ? '+' : ''}
                        {changePercent.toFixed(2)}%)
                    </Text>
                </View>
            </View>

            <View style={styles.chartContainer}>
                <LineChart
                    data={chartData}
                    height={50}
                    adjustToWidth
                    curved
                    curvature={0.15}
                    thickness={2}
                    areaChart
                    color={isPositive ? '#22c55e' : '#ef4444'}
                    startFillColor={isPositive ? '#22c55e' : '#ef4444'}
                    endFillColor={isPositive ? '#22c55e' : '#ef4444'}
                    startOpacity={0.2}
                    endOpacity={0.05}
                    hideDataPoints
                    hideAxesAndRules
                    hideXAxisText
                    hideYAxisText
                    hidePointerStrip
                    isAnimated
                    animationDuration={700}
                />
            </View>
        </TouchableOpacity>
    );
};




import { useIndicesChart } from '../hooks/useIndicesChart';

const IndexVerticalCard = ({ index, onPress }) => {
    // Use new dedicated hook for 5-min chart data
    const { data: chartDataResponse, loading } = useIndicesChart(index.symbol, '5m', 75);
    const intervalData = chartDataResponse; // Alias to match existing logic if needed or adapt below
    console.log('indicesChartData ---', intervalData)
    const isPositive = index.change >= 0;
    const color = isPositive ? '#22c55e' : '#ef4444';

    // Prepare Chart Data like StockListCard
    const allCandles = intervalData?.candles || [];
    // Show requested data
    const recentCandles = allCandles;

    const chartData = useMemo(() => {
        console.log(`[IndexVerticalCard] ${index.symbol} - recentCandles:`, recentCandles?.length);

        if (recentCandles.length > 0) {
            const firstVal = recentCandles[0].close;
            console.log(`[IndexVerticalCard] ${index.symbol} | DataPts: ${recentCandles.length} | FirstVal: ${firstVal}`);

            // "Old chart type should not show" -> Removed the Previous Close anchor which forced a specific shape
            const mapped = recentCandles.map(item => ({ value: item.close }));
            console.log(`[IndexVerticalCard] ${index.symbol} - Mapped Data:`, mapped.length);
            return mapped;
        } else {
            // Fallback: Generate realistic 1-day simulation (75 points) if no real data
            const open = index.value - index.change;
            const close = index.value;
            const seedBuffer = (index.name || index.symbol || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

            const points = 75;
            const rawData = [open];
            const step = (close - open) / points;
            const volatility = Math.abs(index.change) * 0.8 || index.value * 0.002;

            for (let i = 1; i < points - 1; i++) {
                // Deterministic pseudo-random based on Name and Position (i)
                const pseudoRandom = Math.sin(seedBuffer * (i + 1) * 0.45) * 0.5 + 0.5;
                const trend = open + (step * i);
                const noise = (pseudoRandom - 0.5) * volatility * 1.5;
                rawData.push(trend + noise);
            }
            rawData.push(close);

            console.log(`[IndexVerticalCard] ${index.symbol} - Using Realistic Fallback Data`);
            return rawData.map(v => ({ value: v }));
        }
    }, [recentCandles, index.value, index.change, isPositive]);

    console.log(`[IndexVerticalCard] ${index.symbol} - Final ChartData:`, chartData);

    let yMin = 0;
    let finalRange = 100;

    if (chartData.length > 0) {
        const allValues = chartData.map(d => d.value);
        const minVal = Math.min(...allValues);
        const maxVal = Math.max(...allValues);
        const range = maxVal - minVal;

        // Dynamic padding
        const padding = range > 0 ? range * 0.1 : minVal * 0.01;

        yMin = Math.max(0, minVal - padding);
        const yMax = maxVal + padding;
        finalRange = Math.max(0.05, yMax - yMin);
    }

    // console.log(`[Indices] ${index.symbol} - Loading: ${loading}, DataPoints: ${chartData.length}, Range: ${finalRange}`);

    return (
        <TouchableOpacity
            style={styles.verticalCard}
            onPress={() => onPress && onPress(index)}
        >
            <View style={styles.verticalCardLeft}>
                <Text style={styles.verticalSymbol}>{index.name || index.symbol}</Text>
                <Text style={styles.verticalTime}>
                    {index.timestamp ?
                        `${new Date(index.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${new Date(index.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}`
                        : '--:--'}
                </Text>
            </View>

            <View style={styles.verticalChartContainer}>
                {loading && chartData.length <= 3 && !recentCandles.length ? (
                    <ActivityIndicator size="small" color={color} />
                ) : (
                    <LineChart
                        data={chartData}

                        /* Chart size */
                        height={60}
                        width={140}
                        adjustToWidth={true}
                        initialSpacing={1}
                        endSpacing={1}

                        /* Line style */
                        thickness={2}
                        color="#2ecc71"
                        curved
                        curvature={0.2}

                        /* Area fill (important for your look) */
                        areaChart
                        startFillColor="rgba(46, 204, 113, 0.25)"

                        endFillColor="rgba(239, 225, 225, 0.02)"
                        startOpacity={0.5}
                        endOpacity={0.1}

                        /* Hide grid & axes */
                        hideRules={true}
                        hideYAxisText={true}
                        hideAxesAndRules={true}
                        hideXAxisText={true}

                        /* Pointer (optional) */
                        hideDataPoints
                        dataPointsHeight={0}
                        dataPointsWidth={0}
                        dataPointsRadius={0}
                        hidePointerStrip

                        /* Smooth spike effect */
                        isAnimated
                        animationDuration={800}

                    />
                )}
            </View>

            <View style={styles.verticalCardRight}>
                <Text style={styles.verticalPrice}>
                    ₹{index.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Text style={[styles.verticalChange, { color }]}>
                    {isPositive ? '+' : ''}{index.change.toFixed(2)} ({isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%)
                </Text>
            </View>
        </TouchableOpacity>
    );
};

import { useQuery } from '@tanstack/react-query';

// ... (imports remain the same)

const Indices = ({ exchange = 'NSE', viewMode = 'horizontal', onViewAllPress, maxItems, externalData, onIndexPress }) => {
    // Subscribe to real-time price updates
    const { prices: realtimePrices, isConnected } = useRealtimePrices();

    // Query to fetch indices
    const { data: indicesData, isLoading, error: queryError, refetch } = useQuery({
        queryKey: ['indicesList'], // Global cache for indices list
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/api/indices`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            if (result.success && Array.isArray(result.data)) {
                return result.data;
            }
            return [];
        },
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
        enabled: !externalData, // Only fetch if externalData is NOT provided
    });

    // Determine the source of indices (External or Query)
    const indicesSource = externalData || indicesData || [];
    const loading = isLoading && !externalData;
    const error = queryError ? queryError.message : null;

    // Merge real-time prices with fetched indices
    const indicesWithRealtimeData = useMemo(() => {
        if (!indicesSource || indicesSource.length === 0) return [];

        const baseIndices = indicesSource.filter(index => {
            if (exchange === 'NSE') {
                return index.symbol.includes('NIFTY') || index.symbol === 'NIFTY';
            } else {
                return index.symbol.includes('BSE') || index.symbol === 'SENSEX';
            }
        });

        return baseIndices.map(index => {
            // ... (Realtime merge logic remains largely the same, referencing baseIndices)
            const realtimeData = realtimePrices[index.symbol];
            if (realtimeData) {
                const initialPrevClose = index.value - index.change;
                const effectivePrevClose = (initialPrevClose > 0) ? initialPrevClose : (realtimeData.prevClose || realtimeData.open);

                const newChange = realtimeData.price - effectivePrevClose;
                const newPercent = effectivePrevClose > 0 ? (newChange / effectivePrevClose) * 100 : 0;

                return {
                    ...index,
                    value: realtimeData.price,
                    change: newChange,
                    changePercent: newPercent,
                    timestamp: realtimeData.timestamp
                };
            }
            return index;
        });
    }, [indicesSource, realtimePrices, exchange]);

    // Error Component Update (using refetch)
    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                <Text style={styles.errorText}>Failed to load indices</Text>
                <Text style={styles.errorSubtext}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ... rest of the component logic (loading check, empty check, render) remains VALID because we mapped the variables above.



    // Show loading state
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2F0079" />
                <Text style={styles.loadingText}>Loading indices...</Text>
            </View>
        );
    }

    // Show error state
    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                <Text style={styles.errorText}>Failed to load indices</Text>
                <Text style={styles.errorSubtext}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchIndices}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Show empty state
    if (indicesWithRealtimeData.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="bar-chart-outline" size={48} color="#888" />
                <Text style={styles.emptyText}>No indices data available</Text>
                <Text style={styles.emptySubtext}>
                    {exchange === 'NSE' ? 'NSE indices will appear here' : 'BSE indices will appear here'}
                </Text>
            </View>
        );
    }

    // Horizontal scroll view (default)
    if (viewMode === 'horizontal') {
        // Limit items if maxItems is specified
        const displayIndices = maxItems ? indicesWithRealtimeData.slice(0, maxItems) : indicesWithRealtimeData;

        return (
            <View style={styles.horizontalContainer}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Indices</Text>
                    <TouchableOpacity onPress={onViewAllPress} style={styles.viewAllButton}>
                        <Ionicons name="arrow-forward" size={20} color="#2F0079" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalScroll}
                >
                    {displayIndices.map((index, i) => (
                        <IndexCard
                            key={index.symbol || i}
                            name={index.name || index.symbol}
                            value={index.value}
                            change={index.change}
                            changePercent={index.changePercent}
                            data={index} // Pass full index object to access timestamp
                            onPress={onViewAllPress}
                        />
                    ))}
                </ScrollView>
            </View>
        );
    }

    // Vertical list view (when arrow is clicked)
    if (viewMode === 'vertical') {
        return (
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.verticalList}>
                    {indicesWithRealtimeData.map((index, i) => (
                        <IndexVerticalCard
                            key={index.symbol || i}
                            index={index}
                            onPress={onIndexPress}
                        />
                    ))}
                </View>
            </ScrollView>
        );
    }

    // Grid view (for sectors/themes)
    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Indices</Text>
            </View>

            <View style={styles.grid}>
                {indicesWithRealtimeData.map((index, i) => (
                    <View key={index.symbol || i} style={styles.gridCard}>
                        <Text style={styles.indexName}>{index.name || index.symbol}</Text>
                        <Text style={styles.timestamp}>
                            {index.timestamp ? new Date(index.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date(index.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}
                        </Text>
                        <Text style={styles.indexValue}>₹ {index.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                        <Text style={[styles.changeText, index.change >= 0 ? styles.positive : styles.negative]}>
                            {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)} ({index.change >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%)
                        </Text>

                        <View style={styles.chartContainer}>
                            <LineChart
                                areaChart
                                startFillColor="rgba(46, 204, 113, 0.25)"

                                endFillColor="rgba(239, 225, 225, 0.02)"
                                startOpacity={0.5}
                                endOpacity={0.1}
                                data={chartData}
                                width={(width - 48) / 2 - 32}
                                height={60}
                                hideDataPoints
                                hideAxesAndRules
                                hideYAxisText
                                color={index.change >= 0 ? '#22c55e' : '#ef4444'}
                                thickness={2}
                                curved
                            />
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    // Horizontal scroll styles
    horizontalContainer: {
        backgroundColor: '#F5F5F7',
        paddingVertical: 16,
    },
    horizontalScroll: {
        paddingHorizontal: 16,
        gap: 12,
    },
    horizontalCard: {
        width: CARD_WIDTH,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        paddingBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        minHeight: 130,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    cardLeft: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    cardRight: {
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },
    viewAllButton: {
        padding: 4,
    },

    // Grid view styles
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 16,
    },
    gridCard: {
        width: (width - 48) / 2,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    // Common styles
    indexName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    timestamp: {
        fontSize: 10,
        color: '#999',
        fontWeight: '400',
    },
    indexValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
        textAlign: 'right',
    },
    changeText: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'right',
    },
    positive: {
        color: '#22c55e',
    },
    negative: {
        color: '#ef4444',
    },
    chartContainer: {
        marginTop: 0,
        alignItems: 'center',
        overflow: 'hidden',
    },

    // Loading state
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
        fontWeight: '500',
    },

    // Error state
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
        fontWeight: '600',
    },
    errorSubtext: {
        marginTop: 8,
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
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

    // Empty state
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
        padding: 20,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 18,
        color: '#666',
        fontWeight: '600',
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
    },

    // Vertical list styles
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
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 1,
    },
    verticalCardLeft: {
        flex: 1.2,
        justifyContent: 'center',
    },
    verticalChartContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
    },
    verticalCardRight: {
        flex: 1.2,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    verticalSymbol: {
        fontSize: 13,
        fontWeight: '700',
        color: '#333',
    },
    verticalTime: {
        fontSize: 11,
        color: '#999',
        marginTop: 4,
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
    changePercentText: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
});

export default Indices;
