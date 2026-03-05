import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    StyleSheet,
    Text,
    View,
    TouchableOpacity
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useIntervalData } from '../hooks/useIntervalData';
import SparklineChart from './Sparkline';

const { width } = Dimensions.get('window');

const StockListCard = ({ stock, realtime, onPress }) => {
    const apiInterval = '1m';
    const { data: intervalData, loading } = useIntervalData(stock.symbol, apiInterval);

    // Get current price from 1m data (most real-time)
    // const rawPrice = intervalData?.ltp || stock.ltp || 0;
    // const currentPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(rawPrice) || 0;

    // // Use prev_close from stock prop (comes from market_snapshot via API)
    // const prevClose = stock.prev_close ? parseFloat(stock.prev_close) : 0;

    // // Calculate change based on prev_close
    // let currentChange = 0;
    // let currentChangePercent = 0;

    // if (prevClose > 0 && currentPrice > 0) {
    //     currentChange = currentPrice - prevClose;
    //     currentChangePercent = (currentChange / prevClose) * 100;
    // }
    // const basePrevClose = Number(
    //     stock.prev_close ??
    //     realtime?.prevClose ??
    //     realtime?.open ??
    //     0
    // ) || 0;

    const basePrevClose = Number(stock.prev_close) || 0;

    const rawPrice =
        realtime?.price ??
        intervalData?.ltp ??
        stock.ltp ??
        0;

    const currentPrice = Number(rawPrice) || 0;


    const currentChange =
        basePrevClose > 0 ? currentPrice - basePrevClose : 0;

    const currentChangePercent =
        basePrevClose > 0 ? (currentChange / basePrevClose) * 100 : 0;

    const isPositive = currentChange >= 0;
    const displayChange =
        typeof currentChange === "number"
            ? Math.abs(currentChange).toFixed(2)
            : "0.00";

    const displayPercent =
        typeof currentChangePercent === "number"
            ? Math.abs(currentChangePercent).toFixed(2)
            : "0.00";

    const color = isPositive ? global.colors.success : global.colors.error;

    // Prepare Chart Data
    // We strictly want the last 30 points for a clean sparkline (100 is too crowded for 80px)
    const allCandles = intervalData?.candles || [];
    // Take last 30 candles
    const recentCandles = allCandles.slice(-30);

    const chartData = recentCandles.map((item) => {
        const dateObj = new Date(item.time);
        return {
            value: item.close,
            label: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: dateObj
        };
    });

    // Get time from last candle or current time if live
    // Note: Use allCandles for the 'Time' text to ensure we show the absolute latest time, 
    // though chartData comes from recent slice, the last item is the same.
    const lastTime = allCandles.length > 0
        ? new Date(allCandles[allCandles.length - 1].time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toLowerCase()
        : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toLowerCase();


    // Calculate dynamic scaling based on the VISIBLE chart data
    let displayData = chartData;
    let yMin = 0;
    let finalRange = 100;

    if (displayData.length >= 2) {
        const allValues = displayData.map(d => d.value);
        const minVal = Math.min(...allValues);
        const maxVal = Math.max(...allValues); // Download (upper)
        const range = maxVal - minVal;

        // Dynamic padding to ensure curve doesn't clip
        const padding = range > 0 ? range * 0.1 : minVal * 0.01;

        yMin = Math.max(0, minVal - padding);
        const yMax = maxVal + padding;
        finalRange = Math.max(0.05, yMax - yMin);
    } else {
        // Fallback: Generate volatile zigzag if no real data
        const close = currentPrice || 100;
        const open = close - (currentChange || 0);
        const range = Math.abs(currentChange || (close * 0.01));
        const volatility = range * 0.8 || close * 0.002;

        // Create 10-point zigzag pattern for more "zigzag" look
        const rawData = [
            open,
            open + (isPositive ? 1 : -1) * volatility * 0.3,
            open - (isPositive ? 1 : -1) * volatility * 0.2,
            open + (isPositive ? 1 : -1) * volatility * 0.6,
            open + (isPositive ? 1 : -1) * volatility * 0.1,
            open + (isPositive ? 1 : -1) * volatility * 0.8,
            open + (isPositive ? 1 : -1) * volatility * 0.4,
            close
        ];

        displayData = rawData.map(v => ({ value: v }));

        const minVal = Math.min(...rawData);
        const maxVal = Math.max(...rawData);
        const chartRange = maxVal - minVal;
        const padding = chartRange * 0.1;
        yMin = Math.max(0, minVal - padding);
        finalRange = chartRange + 2 * padding;
    }


    return (
        <View style={styles.cardWrapper}>
            <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
                {/* <View> */}
                {/* Left: Info */}
                <View style={styles.infoContainer}>
                    <Text style={styles.companyName}>{stock.symbol}</Text>
                    <Text style={styles.symbol}>{stock.name}</Text>
                    {/* <Text style={styles.time}>{lastTime}</Text> */}
                </View>

                {/* <View style={styles.chartContainer}>
                {loading && displayData.length === 0 ? (
                    <ActivityIndicator size="small" color={color} />
                ) : (
                    <LineChart
                        data={displayData}
                        height={40}
                        width={80}
                        adjustToWidth={true} // Crucial: Fits data to 80px width
                        curved
                        areaChart
                        isAnimated={false}
                        color={color}
                        thickness={2}
                        startFillColor={color}
                        endFillColor={color}
                        startOpacity={0.2}
                        endOpacity={0.0}
                        initialSpacing={0}
                        endSpacing={0}
                        hideDataPoints
                        hideRules
                        rulesThickness={0} // Ensure no rules
                        rulesColor="transparent"
                        hideYAxisText
                        hideXAxisText // Ensure no X axis text
                        hideAxesAndRules
                        xAxisThickness={0} // Ensure no X axis line
                        yAxisThickness={0}
                        xAxisColor="transparent"
                        yAxisColor="transparent"
                        yAxisOffset={yMin}
                        maxValue={finalRange}
                    />
                )}
            </View> */}
            <SparklineChart symbol={stock.symbol} color={color} />

                {/* Right: Price */}
                <View style={styles.verticalCardRight}>
                    <Text style={[styles.verticalPrice]}>
                        {loading && currentPrice === 0 ? '--' : `₹${currentPrice.toFixed(2)}`}
                    </Text>
                    <Text style={[styles.verticalChange, { color }]}>
                        ₹{displayChange} ({displayPercent}%)
                    </Text>
                    {/* <Text style={[styles.change, { color }]}>
                    {loading && currentPrice === 0 ? '--' : `${isPositive ? '+' : ''}${currentChange.toFixed(2)} (${currentChangePercent.toFixed(2)}%)`}
                </Text> */}
                    {/* </View> */}
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    // card: {
    //     backgroundColor: '#fff',
    //     borderRadius: 20,
    //     marginBottom: 10,
    //     paddingVertical: 12,
    //     paddingHorizontal: 16,
    //     borderWidth: 1,
    //     borderColor: '#eee',
    //     flexDirection: 'row',
    //     alignItems: 'center',
    //     justifyContent: 'space-between',
    //     // Minimal shadow
    //     shadowColor: '#000',
    //     shadowOpacity: 0.02,
    //     shadowRadius: 5,
    //     shadowOffset: { width: 0, height: 2 },
    //     elevation: 1,
    // },
    leftContainer: {
        flex: 1.2,
        justifyContent: 'center'
    },
    chartContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
    },
    rightContainer: {
        flex: 1.2,
        alignItems: 'flex-end',
        justifyContent: 'center'
    },
    // symbol: { fontSize: 15, fontWeight: '700', color: '#333' },
    time: { fontSize: 11, color: global.colors.textSecondary, marginTop: 4 },

    price: { fontSize: 15, fontWeight: '600', color: global.colors.textPrimary, },
    change: { fontSize: 12, fontWeight: '600', marginTop: 4 },

    noData: {  color: global.colors.disabled, fontSize: 12 },
    cardWrapper: { marginVertical: 6, marginHorizontal: 4 },
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: global.colors.background,
        padding: 12,
        borderRadius: 14,
        elevation: 2,
    },
    infoContainer: { flex: 1 },
    companyName: { fontSize: 14, fontWeight: "600" },
    symbol: { fontSize: 11, color: global.colors.textPrimary, },
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
});

export default StockListCard;