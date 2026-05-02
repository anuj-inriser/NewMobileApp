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
import * as Device from "expo-device";
import axiosInstance from "../api/axios";
import {
    subscribeSymbols,
    unsubscribeDelayed
} from "../ws/marketSubscriptions";
import { useFocusEffect } from "@react-navigation/native";
import { useRealtimePrices } from "../hooks/useRealtimePrices";
import PortfolioHoldingsCard from "../components/PortfolioHoldingsCard";
import BottomTabBar from "../components/BottomTabBar";
import ManualEntryModal from "../components/ManualEntryModal";
import { useDrawer } from "../context/DrawerContext";

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
    const { openStockInfoDrawer } = useDrawer();
    const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
    const [longPressOpen, setLongPressOpen] = useState(false);
    const [selectedHolding, setSelectedHolding] = useState(null);
    const [manualEntry, setManualEntry] = useState({
        id: null,
        script: '',
        exchange: '',
        purchaseDate: null,
        quantity: '',
        avgPrice: '',
    });
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

    const portfolioTotals = orders.reduce((acc, item) => {
        const qty = Number(item.realisedquantity) || 0;

        const rt = getRealtimeData(item.symboltoken);
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
        if (!authToken) return;
        fetchOrders();
    }, [selectedTab]);

    const logRefresh = async () => {
        try {
            const userId = await AsyncStorage.getItem("userId");
            const deviceId =
                Device.osBuildId || Device.modelId || Device.deviceName || "Unknown";

            await axiosInstance.post("/eventlog", {
                user_id: userId || "",
                success: true,
                device_id: deviceId,
                event_group_id: 3,
                event_type: "Portfolio",
                content: "Refreshed",
                app_version: "1.0.0"
            });
        } catch (err) {
            console.log("Logging failed", err);
        }
    };

    const onRefresh = async () => {
        if (!authToken) return;
        setRefreshing(true);
        await fetchOrders();
        logRefresh();
    };

    useEffect(() => {
        const fetchBrokers = async () => {
            try {
                const userId = await AsyncStorage.getItem("userId");
                 const deviceId =
                        Device.osBuildId || Device.modelId || Device.deviceName || "Unknown";

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

    const handleSaveHolding = async () => {
        try {
            setLoading(true);
            const userId = await AsyncStorage.getItem("userId");
            const deviceId = await getDeviceId();

            const payload = {
                id: manualEntry.id,
                user_id: userId,
                device_mac: deviceId,
                tradingsymbol: manualEntry.script,
                exchange: manualEntry.exchange,
                purchaseDate: manualEntry.purchaseDate ? manualEntry.purchaseDate.toISOString() : new Date().toISOString(),
                quantity: Number(manualEntry.quantity),
                averageprice: Number(manualEntry.avgPrice),
                update_holding: manualEntry.id ? 1 : 0,
                broker_id: 0
            };

            const url = manualEntry.id 
                ? `${apiUrl}/api/portfolio/update-holding` 
                : `${apiUrl}/api/portfolio/create-holding`;

            const method = manualEntry.id ? "PUT" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: {
                    "Authorization": `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload)
            });

            const json = await response.json();
            if (json.success) {
                setIsManualEntryOpen(false);
                fetchOrders();
                setManualEntry({
                    id: null,
                    script: '',
                    exchange: '',
                    purchaseDate: null,
                    quantity: '',
                    avgPrice: '',
                });
            } else {
                alert(json.message || "Failed to save holding");
            }
        } catch (error) {
            console.error("Save Holding Error:", error);
            alert("An error occurred while saving");
        } finally {
            setLoading(false);
        }
    };

    const handleLongPress = (item) => {
        if (item.broker_id === 0) {
            setSelectedHolding(item);
            setLongPressOpen(true);
        }
    };

    const handleEdit = () => {
        setLongPressOpen(false);
        if (selectedHolding) {
            setManualEntry({
                id: selectedHolding.id,
                script: selectedHolding.tradingsymbol,
                exchange: selectedHolding.exchange,
                purchaseDate: selectedHolding.created_at ? new Date(selectedHolding.created_at) : new Date(),
                quantity: String(selectedHolding.quantity || 0),
                avgPrice: String(selectedHolding.averageprice || 0),
            });
            setIsManualEntryOpen(true);
        }
    };

    const handleDelete = async () => {
        if (!selectedHolding) return;
        
        try {
            setLoading(true);
            setLongPressOpen(false);
            
            const response = await fetch(`${apiUrl}/api/portfolio/delete-holding`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id: selectedHolding.id })
            });

            const json = await response.json();
            if (json.success) {
                fetchOrders();
            } else {
                alert(json.message || "Failed to delete holding");
            }
        } catch (error) {
            console.error("Delete Error:", error);
            alert("Failed to delete");
        } finally {
            setLoading(false);
        }
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
                <View style={{ flex: 1, marginBottom: 50 }}>

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
                                    const rt = getRealtimeData(item.symboltoken);
                                    const ltp = rt?.price ?? Number(item.ltp || 0);
                                    const prevClose = rt?.prevClose ?? Number(item.close || 0);

                                    return (
                                        <PortfolioCard
                                            name={item.tradingsymbol}
                                            shares={Number(item.quantity || 0)}
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
                                            onPress={() => openStockInfoDrawer(item.symboltoken, item.tradingsymbol, "chart", item.isin, {
                                                name: item.tradingsymbol,
                                                price: ltp,
                                                exchange: item.exchange,
                                            })}
                                            onLongPress={() => handleLongPress(item)}
                                            brokerId={item.broker_id}
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
                                contentContainerStyle={{ paddingBottom: 100 }}
                                showsVerticalScrollIndicator={false}
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                            />
                        </>
                    )}

                </View>
            </SafeAreaView>

            {/* FAB - Floating Action Button */}
            <TouchableOpacity 
                style={styles.fab} 
                onPress={() => setIsManualEntryOpen(true)}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={32} color={global.colors.secondary} />
            </TouchableOpacity>

            <ManualEntryModal 
                visible={isManualEntryOpen}
                onClose={() => {
                    setIsManualEntryOpen(false);
                    setManualEntry({
                        id: null,
                        script: '',
                        exchange: '',
                        purchaseDate: null,
                        quantity: '',
                        avgPrice: '',
                    });
                }}
                data={manualEntry}
                onChange={(field, value) => setManualEntry(prev => ({ ...prev, [field]: value }))}
                onSave={handleSaveHolding}
            />

            {/* LONG PRESS ACTIONS MODAL */}
            {
                
    
            <Modal visible={longPressOpen} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    onPress={() => setLongPressOpen(false)}
                    activeOpacity={1}
                >
                    <View style={styles.longPressMenu}>
                        <Text style={styles.menuHeader}>{selectedHolding?.tradingsymbol}</Text>
                        
                        <TouchableOpacity style={styles.menuActionItem} onPress={handleEdit}>
                            <Ionicons name="create-outline" size={20} color={global.colors.textPrimary} />
                            <Text style={styles.menuActionText}>Edit Holding</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.menuActionItem, { borderBottomWidth: 0 }]} onPress={handleDelete}>
                            <Ionicons name="trash-outline" size={20} color={global.colors.error} />
                            <Text style={[styles.menuActionText, { color: global.colors.error }]}>Delete Holding</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
                    }
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
    },
    optionsContainer: {
        backgroundColor: "#FFF",
        borderRadius: 20,
        padding: 20,
        width: "80%",
        alignItems: "center",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    optionsTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: global.colors.textPrimary,
        marginBottom: 20,
    },
    optionItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 15,
        width: "100%",
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    optionText: {
        fontSize: 16,
        marginLeft: 15,
        color: global.colors.textPrimary,
    },
    closeOption: {
        borderBottomWidth: 0,
        marginTop: 5,
        justifyContent: "center",
    },
    closeOptionText: {
        fontSize: 16,
        fontWeight: "600",
        color: global.colors.textSecondary,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    longPressMenu: {
        backgroundColor: global.colors.background,
        borderRadius: 16,
        width: '70%',
        padding: 10,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    menuHeader: {
        fontSize: 16,
        fontWeight: '700',
        color: global.colors.textPrimary,
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: global.colors.border,
        textAlign: 'center',
    },
    menuActionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: global.colors.border,
    },
    menuActionText: {
        fontSize: 15,
        fontWeight: '500',
        marginLeft: 12,
        color: global.colors.textPrimary,
    },
    fab: {
        position: 'absolute',
        bottom: 100,
        right: 25,
        width: 50,
        height: 50,
        borderRadius: 32.5,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        zIndex: 999,
    },
});