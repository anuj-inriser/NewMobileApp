import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    AppState,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
// import BottomTabBar from '../components/BottomTabBar';
// import TopHeader from '../components/TopHeader';
import TopMenuSlider from '../components/TopMenuSlider';
import MarketTabs from '../components/MarketTabs';
import StockListCard from '../components/StockListCard';
import { apiUrl } from '../utils/apiUrl';
import { useRealtimePrices } from '../hooks/useRealtimePrices';
import {
    subscribeSymbols,
    unsubscribeDelayed,
} from '../ws/marketSubscriptions';

const StocksScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const {
        exchange: initExchange = 'NSE',
        filterIndex,
        from
    } = route.params || {};

    const [selectedExchange, setSelectedExchange] = useState(initExchange);
    const [selectedCategory, setSelectedCategory] = useState(from || 'Indices');
    const { prices: realtimePrices } = useRealtimePrices();
    const subscribedRef = useRef(false);

    // 🔁 Dynamic fetch based on category + filter
    const fetchStocks = useCallback(async () => {
        let url = '';

        // 🔍 Debug log
        console.log('[StocksScreen] Category:', selectedCategory, '| Filter:', filterIndex, '| Exchange:', selectedExchange);

        url =
            selectedExchange === 'BSE'
                ? `${apiUrl}/api/indicesNew/bseStocks/${filterIndex}`
                : `${apiUrl}/api/indicesNew/nseStocks/${filterIndex}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const text = await response.text();
                console.error(`❌ HTTP ${response.status} from ${url}`, text);
                throw new Error(`API ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            return result?.data || [];
        } catch (err) {
            console.error('Fetch error:', err);
            throw err;
        }
    }, [selectedExchange, selectedCategory, filterIndex]);
    const {
        data: stocksData = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['stocks-screen', selectedExchange, selectedCategory, filterIndex],
        queryFn: fetchStocks,
        retry: 1,
        refetchOnWindowFocus: false,
        onSuccess: (data) => {
            if (subscribedRef.current || !data?.length) return;

            const symbols = Array.from(
                new Set(data.map((s) => s.symbol || s.token).filter(Boolean))
            );
            if (!symbols.length) return;

            const page = 'StocksScreen';
            const context = `${selectedExchange}::${selectedCategory}`;
            subscribeSymbols(symbols, page, context);
            subscribedRef.current = true;
        },
    });

    // 📱 Subscription sync
    useFocusEffect(
        useCallback(() => {
            const page = 'StocksScreen';
            const context = `${selectedExchange}::${selectedCategory}`;
            const symbols = Array.from(
                new Set(stocksData.map((s) => s.symbol || s.token).filter(Boolean))
            );

            if (symbols.length) {
                subscribeSymbols(symbols, page, context);
            }

            const sub = AppState.addEventListener('change', (state) => {
                if (state === 'active') {
                    subscribeSymbols(symbols, page, context);
                } else {
                    unsubscribeDelayed(symbols, page, context);
                }
            });

            return () => {
                unsubscribeDelayed(symbols, page, context);
                sub?.remove();
                subscribedRef.current = false;
            };
        }, [selectedExchange, selectedCategory, stocksData])
    );

    // 🎯 Handlers
    const handleExchangeChange = (exch) => {
        setSelectedExchange(exch);
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
    };

    // 🔁 Refetch on tab/exchange change
    useEffect(() => {
        refetch();
    }, [selectedExchange, selectedCategory, filterIndex, refetch]);

    // 🖼️ Loading / Error UI
    if (isLoading && stocksData.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                {/* <TopHeader /> */}
                <TopMenuSlider currentRoute="Stocks" />
                <View style={styles.placeholderContainer}>
                    <ActivityIndicator size="large" color="#1a1a1a" />
                    <Text style={styles.loadingText}>
                        Loading {selectedCategory} stocks...
                    </Text>
                </View>
                {/* <BottomTabBar /> */}
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                {/* <TopHeader /> */}
                <TopMenuSlider currentRoute="Stocks" />
                <View style={styles.placeholderContainer}>
                    <Text style={styles.errorText}>⚠️ {error.message}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
                {/* <BottomTabBar /> */}
            </SafeAreaView>
        );
    }

    // 🔙 Back label resolver
    const getBackLabel = () => {
        if (filterIndex) return filterIndex;
        if (from === 'Market Cap') return 'Market Cap';
        if (from === 'Sectors') return 'Sectors';
        if (from === 'Themes') return 'Themes';
        return from || 'Back';
    };

    return (
        <SafeAreaView edges={['bottom']} style={styles.container}>
            {/* <TopHeader /> */}
            <TopMenuSlider currentRoute="Equity" />

            {/* ✅ MarketTabs */}
            <MarketTabs
                onExchangeChange={handleExchangeChange}
                onCategoryChange={handleCategoryChange}
                selectedExchange={selectedExchange}
                activeTab={selectedCategory}
                additionalTabs={['Sectors', 'Themes']}
            />

            {from && (
                <View style={styles.headerWithBack}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        {/* <Text style={styles.backIcon}>←</Text> */}
                        <Text style={styles.backText}>Stocks in ({getBackLabel()})</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* 📊 Stock List */}
            <FlatList
                data={stocksData}
                renderItem={({ item }) => (
                    <StockListCard
                        stock={item}
                        realtime={realtimePrices[item.symbol]}
                        onPress={() =>
                            navigation.navigate('Trade', {
                                symbol: item.symbol,
                                exchange: selectedExchange,
                                side: 'BUY',
                            })
                        }
                    />
                )}
                keyExtractor={(item, index) => `${item.symbol || item.token}-${index}`}
                contentContainerStyle={[styles.content, { paddingBottom: 70 }]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {isLoading
                                ? 'Loading...'
                                : `No ${selectedCategory.toLowerCase()} stocks found`}
                        </Text>
                        {selectedCategory === 'Indices' && !filterIndex && (
                            <Text style={[styles.emptyText, { marginTop: 8, fontSize: 13 }]}>
                                Select an index from Equity screen to view stocks.
                            </Text>
                        )}
                    </View>
                }
            />
            {/* <BottomTabBar /> */}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
        marginTop: 12,
    },
    errorText: {
        fontSize: 18,
        color: '#ef4444',
        fontWeight: '600',
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 12,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    headerContext: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        backgroundColor: '#f9f9f9',
    },
    contextText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    emptyContainer: {
        paddingTop: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#888',
        fontSize: 16,
    },

    // 🔙 Back Header
    headerWithBack: {
        paddingHorizontal: 16,
        paddingVertical: 5,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 25,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginRight: 10,
    },
    backText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginLeft: 7,
    },
});

export default StocksScreen;