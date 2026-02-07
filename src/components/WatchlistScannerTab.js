import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axiosInstance from "../api/axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiUrl } from "../utils/apiUrl";

const WatchlistScannerTab = ({ onWatchlistSelect }) => {
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLists = async () => {
            try {
                const userId = await AsyncStorage.getItem("userId");
                if (!userId) {
                    setLoading(false);
                    return;
                }

                const res = await axiosInstance.get(`${apiUrl}/api/wishlistcontrol`, {
                    params: { user_id: userId }
                });
                const listData = res?.data?.data || [];
                setLists(
                    listData.map((item) => ({
                        id: item.wishlist_id,
                        name: item.wishlist_name,
                        user: item.user_id,
                    }))
                );
            } catch (err) {
                console.error("❌ WatchlistScannerTab Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLists();
    }, []);

    const renderWatchlistCard = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onWatchlistSelect && onWatchlistSelect(item)}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>📁</Text>
                <Ionicons name="bookmark" size={20} color={global.colors.secondary} />
            </View>

            <Text style={styles.name} numberOfLines={2}>
                {item.name}
            </Text>

            <View style={styles.footer}>
                <Text style={styles.footerText}>My Watchlist</Text>
                <Ionicons name="chevron-forward" size={16} color={global.colors.secondary} />
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={global.colors.secondary} />
            </View>
        );
    }

    if (lists.length === 0) {
        return (
            <View style={styles.center}>
                <Ionicons name="documents-outline" size={48} color={global.colors.textSecondary} />
                <Text style={styles.emptyText}>No watchlists found.</Text>
                <Text style={styles.subEmptyText}>Create one in the Watchlist screen.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>My Watchlists</Text>
            <FlatList
                data={lists}
                renderItem={renderWatchlistCard}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.gridContainer}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: global.colors.background,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: global.colors.textPrimary,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
    },
    gridContainer: {
        padding: 12,
        paddingBottom: 24,
    },
    columnWrapper: {
        justifyContent: "space-between",
        marginBottom: 16,
    },
    card: {
        width: "48%",
        backgroundColor: global.colors.background,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: global.colors.border,
        shadowColor: global.colors.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    cardIcon: {
        fontSize: 32,
    },
    name: {
        fontSize: 16,
        fontWeight: "700",
        color: global.colors.textPrimary,
        marginBottom: 12,
        minHeight: 40,
    },
    footer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: global.colors.surface,
        borderRadius: 8,
    },
    footerText: {
        fontSize: 12,
        color: global.colors.secondary,
        fontWeight: "600",
    },
    emptyText: {
        fontSize: 16,
        color: global.colors.textPrimary,
        fontWeight: "600",
        marginTop: 16,
    },
    subEmptyText: {
        fontSize: 14,
        color: global.colors.textSecondary,
        marginTop: 4,
        textAlign: "center",
    },
});

export default WatchlistScannerTab;
