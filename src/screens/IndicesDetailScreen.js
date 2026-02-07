import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Dimensions, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import TopHeader from '../components/TopHeader';
import StockListCard from '../components/StockListCard';
import { apiUrl } from '../utils/apiUrl';

import { useIntervalData } from '../hooks/useIntervalData';

const { width } = Dimensions.get('window');

const IndicesDetailScreen = ({ route, navigation }) => {
    const { groupName, data: initialData } = route.params || {};
    const [constituents, setConstituents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [indexData, setIndexData] = useState(initialData || { value: 0, change: 0, changePercent: 0 });

    // Fetch 1-minute data for the chart (1 Day view)
    const { data: chartDataResponse, loading: chartLoading } = useIntervalData(groupName, '1m', 375);


    useEffect(() => {
        fetchConstituents();
    }, [groupName]);

    const fetchConstituents = async () => {
        try {
            // Encode groupName to handle spaces (e.g., 'NIFTY 50')
            const encodedName = encodeURIComponent(groupName);
            const baseUrl = apiUrl.baseUrl;
            const response = await fetch(`${baseUrl}/api/indices/${encodedName}/constituents`);
            const result = await response.json();

            if (result.success && Array.isArray(result.data)) {
                setConstituents(result.data);
            }
        } catch (error) {
            console.error('Error fetching constituents:', error);
        } finally {
            setLoading(false);
        }
    };

    // Process chart data
    let chartData = [];
    if (chartDataResponse?.candles && chartDataResponse.candles.length > 0) {
        chartData = chartDataResponse.candles.map(candle => ({ value: candle.close }));
    } else {
        // Fallback if no data (e.g. market just opened or error) - single point or empty
        chartData = indexData.value ? [{ value: indexData.value }] : [];
    }

    const isPositive = indexData.change >= 0;
    const chartColor = isPositive ? global.colors.success : global.colors.error;

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.titleRow}>
                <Text style={styles.title}>{groupName}</Text>
                {/* <Text style={styles.date}>{new Date().toLocaleTimeString()}</Text> */}
            </View>

            <View style={styles.priceRow}>
                <Text style={styles.price}>₹{indexData.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                <Text style={[styles.change, isPositive ? styles.positive : styles.negative]}>
                    {isPositive ? '+' : ''}{indexData.change.toFixed(2)} ({isPositive ? '+' : ''}{indexData.changePercent.toFixed(2)}%)
                </Text>
            </View>

            <View style={styles.chartContainer}>
                <LineChart
                    data={chartData}
                    width={width - 48}
                    height={180}
                    color={chartColor}
                    thickness={3}
                    startFillColor={chartColor}
                    endFillColor={chartColor + '10'} // Transparent fade
                    startOpacity={0.2}
                    endOpacity={0.0}
                    areaChart
                    curved
                    hideDataPoints
                    hideRules
                    hideYAxisText
                    yAxisOffset={indexData.value * 0.97} // Auto-scale roughly
                    initialSpacing={0}
                />
            </View>

            <View style={styles.listHeader}>
                <Text style={styles.listTitle}>Constituents</Text>
                <Text style={styles.countText}>{constituents.length} stocks</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <TopHeader />
            <View style={styles.content}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={global.colors.secondary} />
                        <Text style={{ marginTop: 10, color: global.colors.textSecondary }}>Loading Stocks...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={constituents}
                        keyExtractor={(item) => item.symbol}
                        renderItem={({ item }) => (
                            <StockListCard
                                stock={{
                                    symbol: item.symbol,
                                    name: item.companyName || item.symbol, // Fallback if companyName missing
                                    price: item.price || 0,
                                    change: item.change || 0,
                                    percentChange: item.changePercent || 0,
                                    exchange: item.exchange
                                }}
                            />
                        )}
                        ListHeaderComponent={renderHeader}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: global.colors.background,
    },
    content: {
        flex: 1,
        backgroundColor: global.colors.surface,
    },
    headerContainer: {
        backgroundColor: global.colors.background,
        padding: 24,
        marginBottom: 8,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: global.colors.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    titleRow: {
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: global.colors.textPrimary,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 12,
        marginBottom: 24,
    },
    price: {
        fontSize: 32,
        fontWeight: '700',
        color: global.colors.textPrimary,
    },
    change: {
        fontSize: 16,
        fontWeight: '600',
    },
    positive: { color: global.colors.success },
    negative: { color: global.colors.error },
    chartContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: global.colors.textPrimary,
    },
    countText: {
        fontSize: 14,
        color: global.colors.textSecondary,
    },
    scrollContent: {
        paddingBottom: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default IndicesDetailScreen;