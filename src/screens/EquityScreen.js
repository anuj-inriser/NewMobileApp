import React, { useState, useCallback, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    FlatList,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AppState, BackHandler, ToastAndroid } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import TopMenuSlider from "../components/TopMenuSlider";
import TopHeader from "../components/TopHeader";
import BottomTabBar from "../components/BottomTabBar";
import MarketTabs from "../components/MarketTabs";
import Indices from "../components/Indices";
import { useRealtimePrices } from "../hooks/useRealtimePrices";
import { apiUrl } from "../utils/apiUrl";
import {
    subscribeSymbols,
    unsubscribeDelayed
} from "../ws/marketSubscriptions";
import Swipeable from "react-native-gesture-handler/Swipeable";

const LeftBuyAction = () => (
    <View style={styles.leftAction}>
        <Text style={styles.buyText}>Buy ››</Text>
    </View>
);
// ✅ MarketCapList Component (inline for now)
const MarketCapList = ({ data, exchange, category, navigation, onBuy }) => {
    const handleBuy = (item) => {
        navigation.navigate("Trade", {
            symbol: item.symbol,
            exchange,
            side: "BUY",
        });
    };
    const renderItem = ({ item }) => {
        const isPositive = item.change >= 0;
        const displayChange =
            typeof item.change === "number"
                ? Math.abs(item.change).toFixed(2)
                : "0.00";

        const displayPercent =
            typeof item.changePercent === "number"
                ? Math.abs(item.changePercent).toFixed(2)
                : "0.00";

        return (
            // <Swipeable
            //     renderLeftActions={() => (
            //         <View style={styles.leftAction}>
            //             <Text style={styles.buyText}>Buy ››</Text>
            //         </View>
            //     )}
            //     onSwipeableLeftOpen={() => onBuy(item)}
            //     overshootLeft={false}
            // >
            <TouchableOpacity
                style={styles.marketCapItem}
                onPress={() =>
                    navigation.navigate("Stocks", {
                        exchange,
                        from: "Market Cap",
                        filterIndex: item.name, // e.g., "Large Cap"
                    })
                }
            >
                <View>
                    <Text style={styles.marketCapName}>
                        {item.group_name || item.name}
                    </Text>
                    <Text style={styles.marketCapSymbol}>{exchange}</Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.price}>
                        ₹ {item.value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </Text>

                    <Text
                        style={[
                            styles.change,
                            isPositive ? styles.positive : styles.negative,
                        ]}
                    >
                        ₹{displayChange} ({displayPercent}%)
                    </Text>

                </View>
            </TouchableOpacity>
            // </Swipeable>
        );
    };

    return (
        <FlatList
            data={data}
            keyExtractor={(item, index) =>
                `${exchange}-${category}-${item.group_name}-${index}`
            }
            renderItem={renderItem}
            contentContainerStyle={styles.marketCapList}
            showsVerticalScrollIndicator={false}
        />
    );
};

// ✅ SectorsList Component
const SectorsList = ({ data, exchange, category, navigation }) => {

    const renderItem = ({ item }) => {
        const isPositive = item.change >= 0;
        const displayChange = isNaN(item.change)
            ? "0.00"
            : Math.abs(item.change).toFixed(2);

        const displayPercent = isNaN(item.changePercent)
            ? "0.00"
            : Math.abs(item.changePercent).toFixed(2);

        return (
            <TouchableOpacity
                style={styles.marketCapItem}
                onPress={() =>
                    navigation.navigate("Stocks", {
                        exchange,
                        from: "Sectors",
                        filterIndex: item.name, // e.g., "IT"
                    })
                }
            >
                <View>
                    <Text style={styles.marketCapName}>
                        {item.group_name || item.name}
                    </Text>
                    <Text style={styles.marketCapSymbol}>{exchange}</Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.price}>
                        ₹ {item.value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </Text>

                    <Text
                        style={[
                            styles.change,
                            isPositive ? styles.positive : styles.negative,
                        ]}
                    >
                        ₹{displayChange} ({displayPercent}%)
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <FlatList
            data={data}
            keyExtractor={(item, index) =>
                `${exchange}-${category}-${item.group_name}-${index}`
            }
            renderItem={renderItem}
            contentContainerStyle={styles.marketCapList}
            showsVerticalScrollIndicator={false}
        />
    );
};

// ✅ ThemesList Component
const ThemesList = ({ data, exchange, category, navigation }) => {
    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.marketCapItem}
            onPress={() =>
                navigation.navigate("Stocks", {
                    exchange,
                    from: "Themes",
                    filterIndex: item.name, // e.g., "Defence"
                })
            }
        >
            <View>
                <Text style={styles.marketCapName}>{item.name}</Text>
                <Text style={styles.marketCapSymbol}>{exchange}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <FlatList
            data={data}
            keyExtractor={(item, index) =>
                `${exchange}-${category}-${item.group_name}-${index}`
            }
            renderItem={renderItem}
            contentContainerStyle={styles.marketCapList}
            showsVerticalScrollIndicator={false}
        />
    );
};

export default function EquityScreen({ navigation }) {
    const subscribedOnceRef = useRef(false);
    const { prices: realtimePrices } = useRealtimePrices();
    const route = useRoute();
    const [selectedExchange, setSelectedExchange] = useState("NSE");
    const [selectedCategory, setSelectedCategory] = useState("Indices");
    const [showPreview, setShowPreview] = useState(true);

    // ✅ Market Cap, Sectors, and Themes States
    const [marketCapData, setMarketCapData] = useState([]);
    const [sectorsData, setSectorsData] = useState([]);
    const [themesData, setThemesData] = useState([]);
    const [isMarketCapLoading, setIsMarketCapLoading] = useState(false);
    const [isSectorsLoading, setIsSectorsLoading] = useState(false);
    const [isThemesLoading, setIsThemesLoading] = useState(false);
    const [marketCapError, setMarketCapError] = useState(null);
    const [sectorsError, setSectorsError] = useState(null);
    const [themesError, setThemesError] = useState(null);

    const handleBuyFromHome = useCallback((item) => {
        console.log("item", item);
        navigation.navigate('TradeOrder', {
            symbol: item.sumbol,
            token: item.token,
            name: item.name,
            internaltype: 'Place'
        })
    }, [navigation, selectedExchange]);

    const getCurrentSymbols = () => {
        if (selectedCategory === "Indices") {
            return allData.map(i => i.symbol || i.name);
        }

        if (selectedCategory === "Market Cap") {
            return marketCapData.map(i => i.symbol || i.group_name);
        }

        if (selectedCategory === "Sectors") {
            return sectorsData.map(i => i.symbol || i.group_name);
        }

        if (selectedCategory === "Themes") {
            return themesData.map(i => i.symbol || i.name);
        }

        return [];
    };
    useFocusEffect(
        useCallback(() => {
            let backPressCount = 0;
            let timeout;

            const onBackPress = () => {
                if (backPressCount === 0) {
                    backPressCount = 1;
                    ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
                    timeout = setTimeout(() => {
                        backPressCount = 0;
                    }, 2000);
                    return true; // prevent exit
                } else {
                    clearTimeout(timeout);
                    BackHandler.exitApp(); // ✅ exits app
                    return false;
                }
            };

            const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => {
                backHandler.remove();
                clearTimeout(timeout);
            };
        }, [])
    );
    useFocusEffect(
        useCallback(() => {
            const page = "EquityScreen";
            const context = selectedCategory; // 🔥 VERY IMPORTANT
            const symbols = getCurrentSymbols();

            if (!symbols.length) return;

            // 🟢 Screen active → subscribe
            subscribeSymbols(symbols, page, context);

            const appStateSub = AppState.addEventListener("change", (state) => {
                if (state !== "active") {
                    // ⏱ app background → delayed unsubscribe
                    unsubscribeDelayed(symbols, page, context);
                } else {
                    // 🔄 app foreground again → cancel unsubscribe
                    subscribeSymbols(symbols, page, context);
                }
            });

            return () => {
                // 🚫 screen blur (navigate away OR tab switch)
                // ❗ direct unsubscribe nahi, sirf delay
                unsubscribeDelayed(symbols, page, context);
                appStateSub?.remove();
            };
        }, [
            selectedCategory,
            selectedExchange,
            allData,
            marketCapData,
            sectorsData,
            themesData
        ])
    );
    useEffect(() => {
        if (subscribedOnceRef.current) return;

        const symbols = getCurrentSymbols();
        if (!symbols.length) return;

        const page = "EquityScreen";
        const context = selectedCategory;

        console.log("🚀 AUTO SUBSCRIBE (DATA READY)", symbols);

        subscribeSymbols(symbols, page, context);
        subscribedOnceRef.current = true;
    }, [
        selectedCategory,
        selectedExchange,
        allData,
        marketCapData,
        sectorsData,
        themesData
    ]);

    // ✅ Fetch Market Cap Data
    const fetchMarketCap = useCallback(
        async (exchange) => {
            setIsMarketCapLoading(true);
            setMarketCapError(null);
            try {
                const url =
                    exchange === "BSE"
                        ? `${apiUrl}/api/indicesNew/bsemarketcap`
                        : `${apiUrl}/api/indicesNew/nsemarketcap`;
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const result = await response.json();
                setMarketCapData(result.data || []);
            } catch (err) {
                setMarketCapError(err.message || "Failed to load market cap data");
            } finally {
                setIsMarketCapLoading(false);
            }
        },
        []
    );

    // ✅ Fetch Sectors Data
    const fetchSectors = useCallback(
        async (exchange) => {
            setIsSectorsLoading(true);
            setSectorsError(null);
            try {
                const url =
                    exchange === "BSE"
                        ? `${apiUrl}/api/indicesNew/bsesector`
                        : `${apiUrl}/api/indicesNew/nsesector`;
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const result = await response.json();
                setSectorsData(result.data || []);
            } catch (err) {
                setSectorsError(err.message || "Failed to load sectors data");
            } finally {
                setIsSectorsLoading(false);
            }
        },
        []
    );

    // ✅ Fetch Themes Data
    const fetchThemes = useCallback(
        async (exchange) => {
            setIsThemesLoading(true);
            setThemesError(null);
            try {
                const url =
                    exchange === "BSE"
                        ? `${apiUrl}/api/indicesNew/bsetheme`
                        : `${apiUrl}/api/indicesNew/nsetheme`;
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const result = await response.json();
                setThemesData(result.data || []);
            } catch (err) {
                setThemesError(err.message || "Failed to load themes data");
            } finally {
                setIsThemesLoading(false);
            }
        },
        []
    );

    // ✅ Refetch Market Cap, Sectors, and Themes when exchange changes & tab is active
    useEffect(() => {
        if (selectedCategory === "Market Cap") {
            fetchMarketCap(selectedExchange);
        } else if (selectedCategory === "Sectors") {
            fetchSectors(selectedExchange);
        } else if (selectedCategory === "Themes") {
            fetchThemes(selectedExchange);
        }
    }, [selectedExchange, selectedCategory, fetchMarketCap, fetchSectors, fetchThemes]);

    // ✅ Indices Fetch (unchanged)
    const fetchIndices = async ({ queryKey }) => {
        const [, exchange] = queryKey;
        const url =
            exchange === "BSE"
                ? `${apiUrl}/api/indicesNew/bse`
                : `${apiUrl}/api/indicesNew/nse`;

        const response = await fetch(url);
        if (!response.ok) throw new Error(`API failed: ${response.status}`);
        const result = await response.json();
        return result.data; // must be array
    };

    const {
        data: allData = [],
        isLoading: loading,
    } = useQuery({
        queryKey: ["indices", selectedExchange],
        queryFn: fetchIndices,
        retry: false,
        refetchOnMount: true,
        refetchOnWindowFocus: false,

        onSuccess: (data) => {
            if (subscribedOnceRef.current) return;
            if (!data?.length) return;

            const symbols = data.map(i => i.symbol || i.name).filter(Boolean);
            if (!symbols.length) return;

            console.log("🚀 LOGIN AUTO SUBSCRIBE (INDICES)", symbols);

            subscribeSymbols(symbols, "EquityScreen", "Indices");
            subscribedOnceRef.current = true;
        }
    });

    // ✅ Handlers
    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setShowPreview(false);

        if (category === "Market Cap" && marketCapData.length === 0 && !isMarketCapLoading) {
            fetchMarketCap(selectedExchange);
        }
    };

    const handleExchangeChange = (exchange) => setSelectedExchange(exchange);

    const handleViewAllIndices = () => {
        setSelectedCategory("Indices");
        setShowPreview(false);
    };

    const handleIndexPress = (index) => {
        navigation.navigate("Stocks", {
            exchange: selectedExchange,
            // ✅ NEW: track source context
            from: "Indices",
            filterIndex: index.name,  // e.g., "Nifty 50"
        });
    };

    const getDataForCategory = () => {
        if (selectedCategory === "Indices") return allData;
        return [];
    };

    // ✅ Render Content
    const renderContent = () => {
        // Market Cap Loading
        if (selectedCategory === "Market Cap" && isMarketCapLoading) {
            return (
                <View style={styles.placeholderContainer}>
                    <ActivityIndicator size="large" color="#1a1a1a" />
                    <Text style={styles.loadingText}>
                        Loading {selectedExchange} market cap...
                    </Text>
                </View>
            );
        }

        // Market Cap Error
        if (selectedCategory === "Market Cap" && marketCapError) {
            return (
                <View style={styles.placeholderContainer}>
                    <Text style={styles.errorText}>⚠️ {marketCapError}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => fetchMarketCap(selectedExchange)}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // Market Cap Success
        if (selectedCategory === "Market Cap") {
            if (marketCapData.length === 0) {
                return (
                    <View style={styles.placeholderContainer}>
                        <Text style={styles.placeholderText}>
                            No {selectedExchange} market cap data
                        </Text>
                    </View>
                );
            }
            const marketCapWithRealtime = mergeWithRealtime(
                marketCapData.map(item => {
                    const value = Number(item.ltp || 0);
                    const prevClose = Number(item.prev_close || 0);
                    const change = prevClose > 0 ? value - prevClose : 0;
                    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

                    return {
                        symbol: item.symbol || item.group_name,
                        name: item.group_name,
                        value,
                        prevClose,
                        change,
                        changePercent,
                        timestamp: new Date().toISOString()
                    };
                }),
                realtimePrices
            );


            return (
                <MarketCapList
                    data={marketCapWithRealtime}
                    exchange={selectedExchange}
                    category={selectedCategory}
                    navigation={navigation}
                    onBuy={handleBuyFromHome}
                />
            );

        }

        // Sectors Loading
        if (selectedCategory === "Sectors" && isSectorsLoading) {
            return (
                <View style={styles.placeholderContainer}>
                    <ActivityIndicator size="large" color="#1a1a1a" />
                    <Text style={styles.loadingText}>Loading {selectedExchange} sectors...</Text>
                </View>
            );
        }

        // Sectors Error
        if (selectedCategory === "Sectors" && sectorsError) {
            return (
                <View style={styles.placeholderContainer}>
                    <Text style={styles.errorText}>⚠️ {sectorsError}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => fetchSectors(selectedExchange)}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // Sectors Success
        if (selectedCategory === "Sectors") {
            if (sectorsData.length === 0) {
                return (
                    <View style={styles.placeholderContainer}>
                        <Text style={styles.placeholderText}>No {selectedExchange} sector data</Text>
                    </View>
                );
            }
            const sectorsWithRealtime = mergeWithRealtime(
                sectorsData.map(item => {
                    const value = Number(item.ltp || 0);
                    const prevClose = Number(item.prev_close || 0);
                    const change = prevClose > 0 ? value - prevClose : 0;
                    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

                    return {
                        symbol: item.symbol || item.group_name,
                        name: item.group_name,
                        value,
                        prevClose,
                        change,
                        changePercent,
                        timestamp: new Date().toISOString()
                    };
                }),
                realtimePrices
            );

            return (
                <SectorsList
                    data={sectorsWithRealtime}
                    exchange={selectedExchange}
                    category={selectedCategory}
                    navigation={navigation}
                />
            );

        }

        // Themes Loading
        if (selectedCategory === "Themes" && isThemesLoading) {
            return (
                <View style={styles.placeholderContainer}>
                    <ActivityIndicator size="large" color="#1a1a1a" />
                    <Text style={styles.loadingText}>Loading {selectedExchange} themes...</Text>
                </View>
            );
        }

        // Themes Error
        if (selectedCategory === "Themes" && themesError) {
            return (
                <View style={styles.placeholderContainer}>
                    <Text style={styles.errorText}>⚠️ {themesError}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => fetchThemes(selectedExchange)}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // Themes Success
        if (selectedCategory === "Themes") {
            if (themesData.length === 0) {
                return (
                    <View style={styles.placeholderContainer}>
                        <Text style={styles.placeholderText}>No {selectedExchange} theme data</Text>
                    </View>
                );
            }
            return (
                <ThemesList
                    data={themesData}
                    exchange={selectedExchange}
                    category={selectedCategory}
                    navigation={navigation}
                />
            );
        }

        // Indices Success
        if (selectedCategory === "Indices") {
            const data = getDataForCategory();
            return (
                <Indices
                    exchange={selectedExchange}
                    viewMode={showPreview ? "horizontal" : "vertical"}
                    onViewAllPress={handleViewAllIndices}
                    onIndexPress={handleIndexPress}
                    externalData={data}
                    maxItems={showPreview ? 5 : undefined}
                />
            );
        }

        // Other Tabs (Sectors, Themes, etc.)
        return (
            <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>{selectedCategory} coming soon...</Text>
            </View>
        );
    };

    return (
        <>
            <SafeAreaView
                edges={["top", "bottom"]}
                style={{ flex: 1, backgroundColor: "#fff" }}
            >
                <TopHeader />
                <TopMenuSlider currentRoute={route.name} />
                <MarketTabs
                    onExchangeChange={handleExchangeChange}
                    onCategoryChange={handleCategoryChange}
                    selectedExchange={selectedExchange}
                    activeTab={selectedCategory}
                    additionalTabs={["Sectors", "Themes"]} // Adding "Sectors" and "Themes" to the tabs
                />
                <View style={styles.content}>{renderContent()}</View>
            </SafeAreaView>
            <BottomTabBar />
        </>
    );
}
const mergeWithRealtime = (list, realtimePrices) => {
    return list.map(item => {
        const rt = realtimePrices[item.symbol];
        if (!rt) return item;

        const prevClose =
            item.prevClose ||
            rt.prevClose ||
            rt.open ||
            item.value;

        const change = rt.price - prevClose;
        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

        return {
            ...item,
            value: rt.price,
            change,
            changePercent,
            timestamp: rt.timestamp
        };
    });
};

// ✅ Styles
const styles = StyleSheet.create({
    content: { flex: 1, backgroundColor: "#F5F5F7" },
    placeholderContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5F5F7",
    },
    placeholderText: { fontSize: 16, color: "#888", fontWeight: "500" },
    loadingText: { fontSize: 16, color: "#666", fontWeight: "500", marginTop: 12 },
    errorText: {
        fontSize: 18,
        color: "#ef4444",
        fontWeight: "600",
        marginBottom: 8,
        textAlign: "center",
    },
    errorSubtext: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginBottom: 16,
        paddingHorizontal: 32,
    },
    retryButton: {
        backgroundColor: "#1a1a1a",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    retryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

    // Market Cap List
    marketCapList: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    marketCapItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    marketCapName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1a1a1a",
    },
    marketCapSymbol: {
        fontSize: 12,
        color: "#888",
        marginTop: 2,
    },
    marketCapValue: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1a1a1a",
    },
    positive: {
        color: '#22c55e',
    },
    negative: {
        color: '#ef4444',
    },
    price: { fontSize: 15, fontWeight: '600', color: '#333' },
    change: { fontSize: 12, fontWeight: '600', marginTop: 4 },
    leftAction: {
        justifyContent: "center",
        paddingLeft: 30,
        width: 90,
    },
    buyText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#210F47",
    },
});