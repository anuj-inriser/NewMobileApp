import { useEffect, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Modal, Image, AppState, FlatList } from 'react-native';
// import TopHeader from "../components/TopHeader";
import { SafeAreaView } from "react-native-safe-area-context";
// import BottomTabBar from '../components/BottomTabBar';
import { Ionicons } from "@expo/vector-icons";
import PortfolioCard from "../components/PortfolioCard";
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../utils/apiUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceId } from "../utils/deviceId";
import { useRoute } from '@react-navigation/native';
import {
    subscribeSymbols,
    unsubscribeDelayed
} from "../ws/marketSubscriptions";
import { useFocusEffect } from "@react-navigation/native";
import { useRealtimePrices } from "../hooks/useRealtimePrices";
import PortfolioHoldingsCard from "../components/PortfolioHoldingsCard";
import BottomTabBar from "../components/BottomTabBar";

const filterOptions = [
    "All",
    "Buy",
    "Sell",
    "Completed",
    "Pending"
];

const PortfolioScreen = () => {
    const route = useRoute();
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);
    const [originalOrders, setOriginalOrders] = useState([]);
    const [selectedTab, setSelectedTab] = useState(1);
    const [sortOrder, setSortOrder] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState("All");
    const { authToken } = useAuth();
    const [sortOpen, setSortOpen] = useState(false);
    const [brokerFilters, setBrokerFilters] = useState([]);
    const [selectedBroker, setSelectedBroker] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const portfolioSymbols = orders
        .map(o => o.tradingsymbol)
        .filter(Boolean);
    const { prices: realtimePrices } = useRealtimePrices();

    const getRealtimeData = (symbol) => {
        if (!symbol || !authToken) return null;
        const symEq = symbol.endsWith("-EQ") ? symbol : `${symbol}-EQ`;
        const symNoEq = symbol.replace("-EQ", "");

        return realtimePrices[symbol] ||
            realtimePrices[`NSE:${symbol}`] ||
            realtimePrices[`BSE:${symbol}`] ||
            realtimePrices[symEq] ||
            realtimePrices[`NSE:${symEq}`] ||
            realtimePrices[`BSE:${symEq}`] ||
            realtimePrices[symNoEq] ||
            realtimePrices[`NSE:${symNoEq}`] ||
            realtimePrices[`BSE:${symNoEq}`] ||
            null;
    };

    const applyBrokerFilter = (brokerId) => {

        setSelectedBroker(brokerId);  // <-- ⭐ store selected broker

        if (!brokerId) {
            setOrders(originalOrders);
            return;
        }

        const filtered = originalOrders.filter(
            (item) => item.broker_id === brokerId
        );

        setOrders(filtered);
    };

    // Calculate Portfolio Totals
    // const portfolioTotals = orders.reduce((acc, item) => {
    //     const realisedQty = Number(item.realisedquantity) || 0;
    //     const ltp = realtimePrices[item.tradingsymbol]?.price || Number(item.ltp) || 0;
    //     const avg = Number(item.averageprice) || 0;
    //     const invested = avg * realisedQty;
    //     const currentValue = ltp * realisedQty;
    //     const profit = currentValue - invested;

    //     acc.totalCurrent += currentValue;
    //     acc.totalInvested += invested;
    //     acc.totalProfit += profit;

    //     return acc;
    // }, { totalCurrent: 0, totalInvested: 0, totalProfit: 0 });

    const portfolioTotals = orders.reduce((acc, item) => {
        const qty = Number(item.realisedquantity) || 0;

        const rt = getRealtimeData(item.tradingsymbol);
        const ltp = rt?.price ?? Number(item.ltp || 0);
        const prevClose = rt?.prevClose ?? Number(item.close || 0);
        const avg = Number(item.averageprice) || 0;

        const invested = avg * qty;
        const currentValue = ltp * qty;
        const profit = currentValue - invested;

        // 🔥 SAME FORMULA AS PortfolioCard
        const today = (ltp - prevClose) * qty;

        acc.totalInvested += invested;
        acc.totalCurrent += currentValue;
        acc.totalProfit += profit;
        acc.totalToday += today;

        return acc;
    }, {
        totalInvested: 0,
        totalCurrent: 0,
        totalProfit: 0,
        totalToday: 0
    });

    const todayPercent =
        portfolioTotals.totalInvested > 0
            ? (portfolioTotals.totalToday / portfolioTotals.totalInvested) * 100
            : 0;


    const profitPercent = portfolioTotals.totalInvested > 0
        ? ((portfolioTotals.totalProfit / portfolioTotals.totalInvested) * 100)
        : 0;


    useFocusEffect(
        useCallback(() => {
            const page = "PortfolioScreen";
            const context = "HOLDINGS"; // 🔥 FIX
            if (!portfolioSymbols.length) return;

            subscribeSymbols(portfolioSymbols, page, context);

            const sub = AppState.addEventListener("change", (state) => {
                if (state !== "active") {
                    unsubscribeDelayed(portfolioSymbols, page, context);
                } else {
                    subscribeSymbols(portfolioSymbols, page, context);
                }
            });

            return () => {
                unsubscribeDelayed(portfolioSymbols, page, context);
                sub?.remove();
            };
        }, [portfolioSymbols])
    );



    useEffect(() => {
        if (route.params?.defaultTab) {
            setSelectedTab(route.params.defaultTab);
        } else {
            setSelectedTab(1);
        }
    }, [route.params]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const userId = await AsyncStorage.getItem("userId");
            const deviceId = await getDeviceId();

            // Use getPortfolioBalance endpoint for portfolio data (same as EquityScreen)
            const response = await fetch(`${apiUrl}/api/portfolio/get`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                    "userid": userId,
                    "device_mac": deviceId
                }
            });

            const json = await response.json();

            const allOrders = json?.data || [];

            // Deduplicate using tradingsymbol and broker_id
            const seen = new Set();
            const uniqueOrders = allOrders.filter(item => {
                const key = `${item.tradingsymbol}_${item.broker_id}`;
                if (seen.has(key)) {
                    return false;
                }
                seen.add(key);
                return true;
            });

            setOrders(uniqueOrders);
            setOriginalOrders(uniqueOrders);
            setSortOrder(null);

        } catch (error) {
            console.log("❌ API Error:", error.message);
            console.error("Full Error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false)
        }
    };

    useEffect(() => {
        if (selectedTab === 1) {
            fetchOrders();
        }
    }, [selectedTab]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchOrders();
    };

    useEffect(() => {
        const fetchBrokers = async () => {
            try {
                const userId = await AsyncStorage.getItem("userId");
                const deviceId = await getDeviceId();

                const response = await fetch(`${apiUrl}/api/portfolio/getAllBrokers`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                        "userid": userId,
                        "device_mac": deviceId
                    }
                });

                const text = await response.text();
                const json = JSON.parse(text);

                if (json.success) {
                    setBrokerFilters(json.data);
                }

            } catch (err) {
                console.log("Broker fetch error:", err);
            }
        };

        // 👇 CALL IT PROPERLY
        fetchBrokers();
    }, []);

    const sortOrders = (sortType) => {
        let sorted = [...orders];

        // A-Z
        if (sortType === "A-Z") {
            sorted.sort((a, b) =>
                (a.tradingsymbol || "").localeCompare(b.tradingsymbol || "")
            );
        }

        // Z-A
        else if (sortType === "Z-A") {
            sorted.sort((a, b) =>
                (b.tradingsymbol || "").localeCompare(a.tradingsymbol || "")
            );
        }

        // High-Low → on invested value
        else if (sortType === "High-Low") {
            sorted.sort((a, b) => {
                const investedA = Number(a.averageprice || 0) * Number(a.realisedquantity || 0);
                const investedB = Number(b.averageprice || 0) * Number(b.realisedquantity || 0);
                return investedB - investedA;
            });
        }

        // Low-High → on invested value
        else if (sortType === "Low-High") {
            sorted.sort((a, b) => {
                const investedA = Number(a.averageprice || 0) * Number(a.realisedquantity || 0);
                const investedB = Number(b.averageprice || 0) * Number(b.realisedquantity || 0);
                return investedA - investedB;
            });
        }

        setOrders(sorted);
    };

    // 📌 FILTER LOGIC
    const applyFilter = (option) => {
        setSelectedFilter(option);

        if (option === "All") {
            setOrders(originalOrders);
            return;
        }

        const filtered = originalOrders.filter((item) => {
            if (option === "Buy") return item.transaction_type === "Buy";
            if (option === "Sell") return item.transaction_type === "Sell";
            if (option === "Completed") return item.status === "Completed";
            if (option === "Pending") return item.status === "Pending";
            return true;
        });

        setOrders(filtered);
    };

    return (
        <>
            <SafeAreaView style={styles.container} edges={['top']}>
                {/* <TopHeader /> */}

                {/* Sort + Filter Bar */}
                <View style={styles.orderTopBar}>
                    <Text style={styles.orderTitle}>
                        Equity Holdings
                    </Text>
                    <View style={styles.row}>
                        {/* SORT BUTTON */}
                        <TouchableOpacity style={styles.iconRow} onPress={() => setSortOpen(true)}>
                            <Image
                                source={require("../../assets/sorticon.png")}
                                style={{ width: 20, height: 20, resizeMode: "contain" }}
                            />
                            <Text style={styles.actionText}>Sort</Text>
                        </TouchableOpacity>


                        {/* FILTER BUTTON */}
                        {/* <TouchableOpacity style={styles.iconRow} onPress={() => setIsFilterOpen(true)}>
                            <Ionicons
                                name={selectedBroker ? "funnel" : "funnel-outline"}
                                size={16}
                               color={global.colors.textPrimary}
                            />
                            <Text style={styles.actionText}>Filter</Text>
                        </TouchableOpacity> */}

                    </View>
                </View>

                {/* Portfolio Holdings Summary */}
                {/* <PortfolioHoldingsCard
                    totalCurrent={portfolioTotals.totalCurrent}
                    totalInvested={portfolioTotals.totalInvested}
                    profit={portfolioTotals.totalProfit}
                    profitPercent={profitPercent}
                    compactMode={true}
                /> */}



                {/* SORT MODAL */}
                <Modal visible={sortOpen} transparent animationType="fade">
                    <TouchableOpacity
                        style={styles.overlay}
                        onPress={() => setSortOpen(false)}
                        activeOpacity={1}
                    >
                        <View style={styles.filterDropdown}>
                            {["A-Z", "Z-A", "High-Low", "Low-High"].map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setSortOpen(false);
                                        sortOrders(option);
                                    }}
                                >
                                    <Text style={styles.dropdownText}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* FILTER MODAL */}
                <Modal
                    visible={isFilterOpen}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setIsFilterOpen(false)}
                >
                    <TouchableOpacity
                        style={styles.overlay}
                        activeOpacity={1}
                        onPress={() => setIsFilterOpen(false)}
                    >
                        <View style={styles.filterDropdown}>

                            {/* ALWAYS SHOW ALL OPTION FIRST */}
                            <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                    setIsFilterOpen(false);
                                    applyBrokerFilter(null);
                                }}
                            >
                                <Text style={styles.dropdownText}>All</Text>
                            </TouchableOpacity>

                            {/* NOW SHOW ALL BROKERS */}
                            {brokerFilters.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setIsFilterOpen(false);
                                        applyBrokerFilter(item.id);
                                    }}
                                >
                                    <Text style={styles.dropdownText}>{item.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                    </TouchableOpacity>
                </Modal>

                {/* ORDERS LIST */}
                <View style={{flex: 1}}>

                {loading ? (
                    <View style={styles.loaderBox}>
                        <Text style={styles.loaderText}>Loading...</Text>
                    </View>
                ) : (
                    <>
                        <FlatList
                            data={orders}
                            keyExtractor={(item, index) => item.symboltoken + "-" + index}
                            renderItem={({ item }) => {
                                const rt = getRealtimeData(item.tradingsymbol);
                                const ltp = rt?.price ?? Number(item.ltp || 0);
                                const prevClose = rt?.prevClose ?? Number(item.close || 0);

                                return (
                                    <PortfolioCard
                                        name={item.tradingsymbol}
                                        shares={Number(item.realisedquantity || 0)}
                                        invested={Number(
                                            Number((item.averageprice || 0) * (item.realisedquantity || 0)).toFixed(2)
                                        )}
                                        price={Number(
                                            Number(item.averageprice || 0).toFixed(2)
                                        )}
                                        currentValue={Number(
                                            Number(ltp || 0).toFixed(2)
                                        )}
                                        profit={(Number(ltp).toFixed(2) * item.realisedquantity).toFixed(2)}
                                        profitPercent={Number(
                                            (
                                                (Number(ltp || 0) * Number(item.realisedquantity || 0)) -
                                                (Number(item.averageprice || 0) * Number(item.realisedquantity || 0))
                                            ) /
                                            (Number(item.averageprice || 0) * Number(item.realisedquantity || 0)) * 100
                                        ).toFixed(2)}
                                        today={(
                                            (Number(ltp || 0) - Number(prevClose || 0)) *
                                            Number(item.realisedquantity || 0)
                                        )}
                                        todayPercent={(((
                                            (Number(ltp || 0) - Number(prevClose || 0)) *
                                            Number(item.realisedquantity || 0)
                                        ) / Number(
                                            Number((item.averageprice || 0) * (item.realisedquantity || 0)).toFixed(2)
                                        )) * 100).toFixed(2)}
                                    />
                                );
                                }}
                                ListHeaderComponent={
                                      <PortfolioHoldingsCard
                            totalCurrent={portfolioTotals.totalCurrent}
                            totalInvested={portfolioTotals.totalInvested}
                            profit={portfolioTotals.totalToday}
                            profitPercent={todayPercent}
                            compactMode={true}
                        />
                                }
                                    // style={{ marginTop: 10 }}
                                    contentContainerStyle={{  paddingBottom: 100 }}
                            showsVerticalScrollIndicator={false}
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                        />
                    </>
                )}

                </View>
            </SafeAreaView>
            {/* <BottomTabBar /> */}
        </>
    );
};

export default PortfolioScreen;

const styles = StyleSheet.create({
    loaderBox: {
        flex: 1,
        marginTop: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    loaderText: {
        fontSize: 16,
        fontWeight: "600",
        color: global.colors.textSecondary,
    },
    container: {
        flex: 1,
        backgroundColor: global.colors.background
    },
    topSliders: {
        backgroundColor: global.colors.background,
        elevation: 10,
        shadowColor: global.colors.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        marginTop: -3,
        paddingTop: 3,
        marginBottom: 10
    },

    orderTopBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginTop: -30,
    },

    orderTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: global.colors.textPrimary,
        marginBottom: 10,
    },

    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
    },

    iconRow: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 18,
    },

    actionText: {
        marginLeft: 6,
        fontSize: 13,
        color: "#000",
        fontWeight: "600",
    },

    overlay: {
        flex: 1,
        backgroundColor: global.colors.overlay,
        justifyContent: "flex-start",
        alignItems: "flex-end",
    },

    filterDropdown: {
        backgroundColor: global.colors.background,
        borderRadius: 10,
        marginTop: 185,
        marginRight: 20,
        width: 120,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: global.colors.border,
        elevation: 6,
        shadowColor: global.colors.secondary,
        shadowOpacity: 0.15,
        shadowRadius: 5,
        zIndex: 1000,
    },
    dropdownItem: {
        paddingVertical: 6,
        paddingHorizontal: 10,
    },

    dropdownText: {
        fontSize: 14,
        color: global.colors.textPrimary,
        borderBottomWidth: 0.5,
        borderBottomColor: global.colors.border,
    },
});