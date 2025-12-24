import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Modal, Image } from 'react-native';
import TopHeader from "../components/TopHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTabBar from '../components/BottomTabBar';
import { Ionicons } from "@expo/vector-icons";
import PortfolioCard from "../components/PortfolioCard";
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../utils/apiUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceId } from "../utils/deviceId";
import { useRoute } from '@react-navigation/native';

const filterOptions = [
    "All",
    "Buy",
    "Sell",
    "Completed",
    "Pending"
];

const PorfolioScreen = () => {
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


    useEffect(() => {
        if (route.params?.defaultTab) {
            setSelectedTab(route.params.defaultTab);
        } else {
            setSelectedTab(1);
        }
    }, [route.params]);
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                let url = "";
                if (selectedTab === 1) url = `${apiUrl}/api/portfolio/get`;
                // if (selectedTab === 2) url = `${apiUrl}/api/order/get`;
                // if (selectedTab === 3) url = `${apiUrl}/api/position/get`;

                const userId = await AsyncStorage.getItem("userId");
                const deviceId = await getDeviceId();

                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                        "userid": userId,
                        "device_mac": deviceId
                    }
                });
                const text = await response.text();
                const data = JSON.parse(text);
                setOrders(data?.data || []);
                setOriginalOrders(data?.data || []);
                setSortOrder(null);

            } catch (error) {
                console.log("API Error:", error);
            } finally {
                setLoading(false); // ⬅️ STOP LOADING
            }
        };
        fetchOrders();
    }, [selectedTab]);

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
            <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
                <TopHeader />

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
                        <TouchableOpacity style={styles.iconRow} onPress={() => setIsFilterOpen(true)}>
                            <Ionicons
                                name={selectedBroker ? "funnel" : "funnel-outline"}
                                size={16}
                                color="#000"
                            />
                            <Text style={styles.actionText}>Filter</Text>
                        </TouchableOpacity>

                    </View>
                </View>
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
                {loading ? (
                    <View style={styles.loaderBox}>
                        <Text style={styles.loaderText}>Loading...</Text>
                    </View>
                ) : (
                    <ScrollView style={{ marginTop: 10 }}>
                        {orders.map((item, index) => (
                            <PortfolioCard
                                key={item.symboltoken + "-" + index}
                                name={item.tradingsymbol}

                                shares={Number(item.realisedquantity || 0)}

                                invested={Number(
                                    Number((item.averageprice || 0) * (item.realisedquantity || 0)).toFixed(2)
                                )}

                                price={Number(
                                    Number(item.averageprice || 0).toFixed(2)
                                )}

                                currentValue={Number(
                                    Number(item.ltp || 0).toFixed(2)
                                )}

                                profit={(Number(item.ltp).toFixed(2) * item.realisedquantity).toFixed(2)}

                                profitPercent={Number(
                                    (
                                        (Number(item.ltp || 0) * Number(item.realisedquantity || 0)) -
                                        (Number(item.averageprice || 0) * Number(item.realisedquantity || 0))
                                    ) /
                                    (Number(item.averageprice || 0) * Number(item.realisedquantity || 0)) * 100
                                ).toFixed(2)}

                                today={(
                                    (Number(item.ltp || 0) - Number(item.close || 0)) *
                                    Number(item.realisedquantity || 0)
                                )}

                                todayPercent={(((
                                    (Number(item.ltp || 0) - Number(item.close || 0)) *
                                    Number(item.realisedquantity || 0)
                                ) / Number(
                                    Number((item.averageprice || 0) * (item.realisedquantity || 0)).toFixed(2)
                                )) * 100).toFixed(2)}
                            />
                        ))}
                    </ScrollView>
                )}
            </SafeAreaView>
            <BottomTabBar />
        </>
    );
};

export default PorfolioScreen;

const styles = StyleSheet.create({
    loaderBox: {
        marginTop: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    loaderText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#555",
    },
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    topSliders: {
        backgroundColor: "#fff",
        elevation: 10,
        shadowColor: "#000",
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
        marginTop: 5,
    },

    orderTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#000",
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
    },

    iconRow: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 18,
    },

    actionText: {
        marginLeft: 4,
        fontSize: 13,
        color: "#000",
    },

    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-start",
        alignItems: "flex-end",
    },

    filterDropdown: {
        backgroundColor: "#fff",
        borderRadius: 10,
        marginTop: 90,
        marginRight: 20,
        width: 120,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: "#eee",
        elevation: 6,
        shadowColor: "#210F47",
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
        color: "#000",
        borderBottomWidth: 0.5,
        borderBottomColor: "#eee",
    },
});
