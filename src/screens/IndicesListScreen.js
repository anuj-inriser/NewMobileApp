import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import TopHeader from '../components/TopHeader';
import { apiUrl } from '../utils/apiUrl';

const IndicesListScreen = ({ route, navigation }) => {
    const { exchange = 'NSE', type = 'index' } = route.params || {};
    const [indices, setIndices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchIndices();
    }, [exchange, type]);

    const fetchIndices = async () => {
        try {
            setLoading(true);
            const baseUrl = Platform.OS === 'web' ? 'http://0.0.0.0:3002' : apiUrl;
            const response = await fetch(`${baseUrl}/api/indices`);
            const result = await response.json();

            if (result.success && Array.isArray(result.data)) {
                // Filter by exchange and type
                const filtered = result.data.filter(item => {
                    const matchExchange = !exchange || item.exchange === exchange;
                    const matchType = !type || (item.type && item.type.toLowerCase() === type.toLowerCase());
                    return matchExchange && matchType;
                });
                setIndices(filtered);
            }
        } catch (error) {
            console.error('Error fetching indices:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderIndexCard = ({ item }) => {
        const isPositive = item.change >= 0;

        // Generate simple chart data
        const chartData = [];
        const previousValue = item.value - item.change;
        for (let i = 0; i < 10; i++) {
            const progress = i / 9;
            const value = previousValue + (item.change * progress);
            chartData.push({ value: Math.max(0, value) });
        }

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('IndicesDetail', {
                    groupName: item.name || item.symbol,
                    data: item
                })}
            >
                <View style={styles.cardLeft}>
                    <Text style={styles.symbol}>{item.symbol}</Text>
                    <Text style={styles.time}>
                        {new Date().toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        })}
                    </Text>
                </View>

                <View style={styles.cardCenter}>
                    <LineChart
                        data={chartData}
                        width={100}
                        height={40}
                        color={isPositive ? '#22c55e' : '#ef4444'}
                        thickness={1.5}
                        hideDataPoints
                        hideAxesAndRules
                        hideYAxisText
                        curved
                        areaChart
                        startFillColor={isPositive ? '#22c55e' : '#ef4444'}
                        endFillColor={isPositive ? '#22c55e10' : '#ef444410'}
                        startOpacity={0.2}
                        endOpacity={0.0}
                        initialSpacing={0}
                    />
                </View>

                <View style={styles.cardRight}>
                    <Text style={styles.price}>
                        ₹{item.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                    <Text style={[styles.change, isPositive ? styles.positive : styles.negative]}>
                        {isPositive ? '+' : ''}{item.change.toFixed(2)} ({isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%)
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <TopHeader />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    {/* <Ionicons name="arrow-back" size={24} color={ global.colors.secondary} /> */}
                </TouchableOpacity>
                <Text style={styles.title}>
                    {type === 'sector' ? 'Sectors' : 'Indices'} ({exchange})
                </Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={global.colors.secondary} />
                </View>
            ) : (
                <FlatList
                    data={indices}
                    renderItem={renderIndexCard}
                    keyExtractor={(item, index) => item.symbol || index.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: global.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: global.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: global.colors.surface,
    },
    backButton: {
        marginRight: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: global.colors.secondary,
    },
    listContent: {
        padding: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor:global.colors.background,
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: global.colors.border,
    },
    cardLeft: {
        flex: 1,
    },
    symbol: {
        fontSize: 16,
        fontWeight: '700',
        color: global.colors.secondary,
        marginBottom: 4,
    },
    time: {
        fontSize: 11,
        color:  global.colors.textSeconadary,
    },
    cardCenter: {
        width: 100,
        alignItems: 'center',
        marginHorizontal: 12,
    },
    cardRight: {
        alignItems: 'flex-end',
    },
    price: {
        fontSize: 16,
        fontWeight: '700',
        color: global.colors.secondary,
        marginBottom: 4,
    },
    change: {
        fontSize: 12,
        fontWeight: '600',
    },
    positive: {
        color: global.colors.success,
    },
    negative: {
        color:  global.colors.error,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default IndicesListScreen;
