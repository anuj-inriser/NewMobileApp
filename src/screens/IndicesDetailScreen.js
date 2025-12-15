import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Dimensions, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import TopHeader from '../components/TopHeader';
import StockListCard from '../components/StockListCard';
import { apiUrl } from '../utils/apiUrl';

const { width } = Dimensions.get('window');

const IndicesDetailScreen = ({ route, navigation }) => {
    const { groupName, data: initialData } = route.params || {};
    const [constituents, setConstituents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [indexData, setIndexData] = useState(initialData || { value: 0, change: 0, changePercent: 0 });

    useEffect(() => {
        fetchConstituents();
    }, [groupName]);

    const fetchConstituents = async () => {
        try {
            // Encode groupName to handle spaces (e.g., 'NIFTY 50')
            const encodedName = encodeURIComponent(groupName);
            const baseUrl = Platform.OS === 'web' ? 'http:// 192.168.1.18' : apiUrl;
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

    // Mock Chart Data for the Index (Placeholders as per user request "chart will make after")
    // We try to make it look like the index trend.
    const chartData = [
        { value: indexData.value * 0.98 },
        { value: indexData.value * 0.985 },
        { value: indexData.value * 0.99 },
        { value: indexData.value * 0.988 },
        { value: indexData.value * 1.002 },
        { value: indexData.value * 1.005 },
        { value: indexData.value },
    ];

    const isPositive = indexData.change >= 0;
    const chartColor = isPositive ? '#22c55e' : '#ef4444';

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
                        <ActivityIndicator size="large" color="#2F0079" />
                        <Text style={{ marginTop: 10, color: '#666' }}>Loading Stocks...</Text>
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
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    headerContainer: {
        backgroundColor: '#fff',
        padding: 24,
        marginBottom: 8,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: "#000",
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
        color: '#1f2937',
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
        color: '#111827',
    },
    change: {
        fontSize: 16,
        fontWeight: '600',
    },
    positive: { color: '#22c55e' },
    negative: { color: '#ef4444' },
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
        color: '#1f2937',
    },
    countText: {
        fontSize: 14,
        color: '#6b7280',
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
