import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Animated,
    TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { MaterialIcons } from "@expo/vector-icons";
import axiosInstance from "../api/axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const UNDO_TIMEOUT = 5000;

const NotificationScreen = () => {
    const [notifications, setNotifications] = useState([]);
    const swipeableRefs = useRef({});
    const undoTimerRef = useRef(null);
    const [undoItem, setUndoItem] = useState(null);
    const pendingDeleteIds = useRef(new Set());
    const [listData, setListData] = useState([]);

    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(() => {
            fetchNotifications();
        }, 1000); // fetch every 1s (you can increase this if needed)

        return () => clearInterval(interval);
    }, []);
    useEffect(() => {
        setListData(
            notifications.filter(
                (item) => !pendingDeleteIds.current.has(item.id)
            )
        );
    }, [notifications]);
    const fetchNotifications = async () => {
        try {
            const userId = await AsyncStorage.getItem("userId"); // get user id from storage
            const response = await axiosInstance.get(
                `/notification/getNotificationUserWise?userId=${userId}`
            );
            setNotifications(response?.data?.data ?? []);
        } catch (error) {
            console.log("Error fetching notifications:", error);
        }
    };
    const EmptyNotifications = () => {
        return (
            <View style={styles.emptyContainer}>
                <MaterialIcons name="notifications-off" size={48} color={global.colors.disabled} />
                <Text style={styles.emptyText}>No Notification Found</Text>
            </View>
        );
    };

    const formatDateTime = (date) => {
        if (!date) return "";
        const d = new Date(date);
        return (
            d.toLocaleDateString("en-IN") +
            " " +
            d.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
            })
        );
    };

    // const handleDelete = async (item) => {
    //     console.log("Delete API called for notification id:", item.id);

    //     try {
    //         // Close swipe animation first
    //         swipeableRefs.current[item.id]?.close();

    //         // small delay to allow swipe animation to complete
    //         setTimeout(async () => {
    //             await axiosInstance.delete(`/notification/delete/${item.id}`);

    //             setNotifications((prev) =>
    //                 prev.filter((n) => n.id !== item.id)
    //             );

    //             console.log("Notification deleted successfully:", item.id);

    //             // cleanup swipeable ref
    //             delete swipeableRefs.current[item.id];
    //         }, 200); // 200ms delay
    //     } catch (error) {
    //         console.log("Error deleting notification:", error);
    //     }
    // };

    const handleDelete = (item) => {
        // console.log("Swipe delete initiated for:", item.id);

        // Close swipe animation
        swipeableRefs.current[item.id]?.close();

        // Mark item as pending delete (hide from UI)
        pendingDeleteIds.current.add(item.id);

        // Trigger UI update immediately
        setListData((prev) => prev.filter((n) => n.id !== item.id));

        // Store item for undo
        setUndoItem(item);

        // Clear any existing undo timer
        if (undoTimerRef.current) {
            clearTimeout(undoTimerRef.current);
        }

        // Start undo countdown
        undoTimerRef.current = setTimeout(async () => {
            try {
                // Actual backend delete happens ONLY after timeout
                await axiosInstance.delete(`/notification/delete/${item.id}`);

                // Remove permanently from source data
                setNotifications((prev) =>
                    prev.filter((n) => n.id !== item.id)
                );

                // Cleanup
                pendingDeleteIds.current.delete(item.id);
                setUndoItem(null);
                delete swipeableRefs.current[item.id];

                console.log("Notification permanently deleted:", item.id);
            } catch (error) {
                console.log("Error deleting notification:", error);
            }
        }, UNDO_TIMEOUT);
    };

    const handleUndo = () => {
        if (!undoItem) return;

        clearTimeout(undoTimerRef.current);

        pendingDeleteIds.current.delete(undoItem.id);

        setListData((prev) => [undoItem, ...prev]);

        setUndoItem(null);
    };

    const renderRightActions = () => {
        // We don’t need a button since swipe itself deletes
        return (
            <View style={styles.actionWrapper}>
                <MaterialIcons name="delete-outline" size={22} color={global.colors.textSecondary} />
            </View>
        );
    };

    const renderItem = ({ item }) => (
        <Swipeable
            ref={(ref) => (swipeableRefs.current[item.id] = ref)}
            renderRightActions={renderRightActions}
            renderLeftActions={null}
            overshootRight={false}
            overshootLeft={false}
            rightThreshold={40}
            leftThreshold={10000} // left swipe disabled
            onSwipeableOpen={() => handleDelete(item)} // swipe triggers delete
        >
            <View style={styles.card}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>

                <View style={styles.footer}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            Type: {item?.data?.type ?? "N/A"}
                        </Text>
                    </View>

                    <View style={styles.timeRow}>
                        <MaterialIcons name="access-time" size={14} color={global.colors.disabled} />
                        <Text style={styles.time}>{formatDateTime(item.sent_at)}</Text>
                    </View>
                </View>
            </View>
        </Swipeable>
    );

    return (
        <SafeAreaView edges={["bottom"]} style={styles.container}>
            {undoItem && (
                <View style={styles.undoBar}>
                    <Text style={styles.undoText}>
                        {undoItem.script_name} removed
                    </Text>
                    <TouchableOpacity onPress={handleUndo}>
                        <Text style={styles.undoAction}>UNDO</Text>
                    </TouchableOpacity>
                </View>
            )}
            <FlatList
                data={listData}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<EmptyNotifications />}
            />
        </SafeAreaView>
    );
};

export default NotificationScreen;

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: global.colors.background,
        paddingBottom: 55,
    },
    card: {
        backgroundColor: global.colors.background,
        marginHorizontal: 12,
        marginVertical: 6,
        padding: 14,
        borderRadius: 14,
        elevation: 2,
    },
    title: { fontSize: 14, fontWeight: "600", marginBottom: 4, color: global.colors.textPrimary },
    body: { fontSize: 12, color: global.colors.textSecondary, marginBottom: 8 },
    footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    badge: { backgroundColor: global.colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 11, fontWeight: "500", color: global.colors.textPrimary },
    timeRow: { flexDirection: "row", alignItems: "center" },
    time: { fontSize: 11, color: global.colors.textSecondary, marginLeft: 4 },
    actionWrapper: {
        justifyContent: "center",
        alignItems: "center",
        width: 80,
        marginVertical: 6,
        borderRadius: 14,
        backgroundColor: global.colors.surface,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 250,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 14,
        color: global.colors.textSecondary,
        fontWeight: "500",
    },
    undoBar: {
        position: "absolute",
        bottom: 70,
        left: 16,
        right: 16,
        backgroundColor: "#2E2E2E",
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        elevation: 20,
        zIndex: 9999,
    },
    undoText: { color: "#fff", fontSize: 13 },
    undoAction: { color: "#4CAF50", fontWeight: "700" },
});