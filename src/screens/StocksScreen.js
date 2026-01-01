import React, { useState, useCallback, useRef } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View, Text, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomTabBar from '../components/BottomTabBar';
import TopHeader from "../components/TopHeader";
import TopMenuSlider from '../components/TopMenuSlider';
import MarketTabs from '../components/MarketTabs';
import StockListCard from '../components/StockListCard';
import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '../utils/apiUrl';
import { useRealtimePrices } from '../hooks/useRealtimePrices';
import { useFocusEffect } from '@react-navigation/native';
import {
    subscribeSymbols,
    unsubscribeDelayed
} from '../ws/marketSubscriptions';

const StocksScreen = ({ route }) => {
    const { exchange, filterIndex, defaultTab } = route.params || {};

    const [selectedExchange, setSelectedExchange] = useState(exchange || 'NSE');
    const [selectedTab, setSelectedTab] = useState(defaultTab || 'Gainers');
    const { prices: realtimePrices } = useRealtimePrices();
    const getSymbols = () => {
        return Array.from(
            new Set(
                stocksData
                    .map(s => s?.symbol || s?.token)
                    .filter(Boolean)
            )
        );
    };
    useFocusEffect(
        useCallback(() => {
            const page = "StocksScreen";
            const context = `${selectedExchange}::${filterIndex || selectedTab}`;

            const appStateSub = AppState.addEventListener("change", (state) => {
                if (state !== "active") {
                    unsubscribeDelayed(
                        Object.keys(realtimePrices),
                        page,
                        context
                    );
                }
            });

            return () => {
                unsubscribeDelayed(
                    Object.keys(realtimePrices),
                    page,
                    context
                );
                appStateSub?.remove();
                subscribedRef.current = false;
            };
        }, [selectedExchange, selectedTab, filterIndex])
    );

    const fetchStocks = async () => {
        let url = '';
        // if (selectedTab === 'All' && !filterIndex) {
        //     url =
        //         selectedExchange === 'BSE'
        //             ? `${apiUrl}/api/indicesNew/bseAllStocks`
        //             : `${apiUrl}/api/indicesNew/nseAllStocks`;
        // }
        // // ✅ Index based stocks
        // else {
        url =
            selectedExchange === 'BSE'
                ? `${apiUrl}/api/indicesNew/bseStocks/${filterIndex}`
                : `${apiUrl}/api/indicesNew/nseStocks/${filterIndex}`;
        // }
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API failed ${response.status}`);
        }

        const result = await response.json();
        return result?.data || [];
    };


    const subscribedRef = useRef(false);

    const {
        data: stocksData = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ['stocks', selectedExchange, selectedTab, filterIndex],
        queryFn: fetchStocks,
        refetchOnWindowFocus: false,

        onSuccess: (data) => {
            if (!data?.length) return;
            if (subscribedRef.current) return;

            const symbols = Array.from(
                new Set(
                    data
                        .map(s => s?.symbol || s?.token)
                        .filter(Boolean)
                )
            );

            if (!symbols.length) return;

            const page = "StocksScreen";
            const context = `${selectedExchange}::${filterIndex || selectedTab}`;

            console.log("🚀 AUTO SUBSCRIBE (STOCKS)", symbols);

            subscribeSymbols(symbols, page, context);
            subscribedRef.current = true;
        }
    });


    // const stockTabs = ['All', 'Gainers', 'Losers', 'Breakout', '52W High', '52W Low'];
    const stockTabs = ['Gainers', 'Losers', 'Breakout', '52W High', '52W Low'];

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#2F0079" />
                <Text style={styles.loadingText}>Loading stocks...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>⚠️ Failed to load stocks</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <TopHeader />
            <TopMenuSlider currentRoute="Stocks" />

            <MarketTabs
                tabs={stockTabs}
                selectedExchange={selectedExchange}
                activeTab={selectedTab}
                initialActiveTab="Gainers"
                onExchangeChange={setSelectedExchange}
                onCategoryChange={setSelectedTab}
            />

            <FlatList
                data={stocksData}
                renderItem={({ item }) => (
                    <StockListCard
                        stock={item}
                        realtime={realtimePrices[item.symbol]}
                    />
                )}
                keyExtractor={(item, index) =>
                    `${item.symbol}-${index}`
                }
                contentContainerStyle={[styles.content, { paddingBottom: 55 }]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={{ paddingTop: 40, alignItems: 'center' }}>
                        <Text style={{ color: '#888' }}>No stocks found</Text>
                    </View>
                }
            />
            <BottomTabBar />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', },
    loadingText: { fontSize: 16, color: "#666", fontWeight: "500", marginTop: 12 },
    errorText: { fontSize: 18, color: "#ef4444", fontWeight: "600", textAlign: "center" },
    content: { paddingHorizontal: 16, paddingBottom: 20, marginTop: 10 },
});

export default StocksScreen;
