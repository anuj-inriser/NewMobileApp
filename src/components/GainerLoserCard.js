import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useIntervalData } from '../hooks/useIntervalData';

const { width } = Dimensions.get('window');

const GainerLoserCard = ({ symbol, name, price, change, percentChange }) => {
    // Always fetch 1D data for Gainers/Losers
    const { data, loading } = useIntervalData(symbol, '1d');

    const currentPrice = price ?? data?.ltp ?? 0;
    const priceChange = change ?? data?.priceChange ?? 0;
    const percentageChange = percentChange ?? data?.percentChange ?? 0;
    const isPositive = priceChange >= 0;
    const color = isPositive ? global.colors.success : global.colors.error;

    // Prepare chart data
    const candles = data?.candles || [];
    const values = candles.map((c) => c.close);
    const min = values.length > 0 ? Math.min(...values) : 0;
    const max = values.length > 0 ? Math.max(...values) : 0;
    const range = max - min;

    const chartData = candles.map((c) => ({ value: c.close - min }));

    // Loading state
    if (loading && !data) {
        return (
            <View style={styles.card}>
                <View style={styles.leftSection}>
                    <View style={styles.iconPlaceholder} />
                    <View>
                        <Text style={styles.name}>{name}</Text>
                        <Text style={styles.symbol}>{symbol}</Text>
                    </View>
                </View>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            {/* Left: Icon & Name */}
            <View style={styles.leftSection}>
                <View style={styles.logoFallback}>
                    <Text style={styles.logoFallbackText}>{symbol[0]}</Text>
                </View>
                <View>
                    <Text style={styles.name} numberOfLines={1}>{name}</Text>
                    <Text style={styles.symbol}>{symbol}</Text>
                </View>
            </View>

            {/* Middle: Mini Chart */}
            <View style={styles.chartSection}>
                {chartData.length > 0 && (
                    <LineChart
                        data={chartData}
                        height={40}
                        width={80}
                        maxValue={Math.max(0.1, range)}
                        yAxisOffset={0}
                        initialSpacing={0}
                        endSpacing={0}
                        spacing={chartData.length > 1 ? 80 / (chartData.length - 1) : 80}
                        color={color}
                        thickness={2}
                        startFillColor={color}
                        endFillColor={color}
                        startOpacity={0.2}
                        endOpacity={0.0}
                        hideDataPoints
                        hideRules
                        hideAxesAndRules
                        hideYAxisText
                        curved
                        areaChart
                    />
                )}
            </View>

            {/* Right: Price Info */}
            <View style={styles.rightSection}>
                <Text style={styles.price}>₹ {currentPrice.toFixed(2)}</Text>
                <Text style={[styles.change, { color }]}>
                    {isPositive ? '+' : ''}₹{Math.abs(priceChange).toFixed(2)} ({Math.abs(percentageChange).toFixed(2)}%)
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: global.colors.background,
        padding: 12,
        borderRadius: 14,
        elevation: 2,
        marginVertical: 6,
    },
    logoFallback: {
        width: 34, height: 34,
        borderRadius: 17,
        backgroundColor: global.colors.secondary,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    logoFallbackText: { color: global.colors.background, fontWeight: "700", fontSize: 13 },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1.2,
    },
    iconPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: global.colors.surface,
        marginRight: 12,
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
        color: global.colors.textPrimary,
        marginBottom: 2,
    },
    symbol: {
        fontSize: 12,
        fontWeight: '500',
        color: global.colors.textSecondary,
    },
    chartSection: {
        width: 70,
        height: 40,
    },
    rightSection: {
        alignItems: 'flex-end',
        flex: 1,
    },
    price: {
        fontSize: 14, fontWeight: "600",
        color: global.colors.textPrimary,
        marginBottom: 2,
    },
    change: {
        fontSize: 10,
        fontWeight: '600',
        textAlign: "right",
        width: 80
    },
    loadingText: {
        fontSize: 12,
        color: global.colors.disabled,
    },
});

export default GainerLoserCard;