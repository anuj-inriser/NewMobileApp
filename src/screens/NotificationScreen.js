import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { MaterialIcons } from "@expo/vector-icons";
import axiosInstance from "../api/axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NotificationScreen = () => {
    const [notifications, setNotifications] = useState([]);
    const swipeableRefs = useRef({});

    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(() => {
            fetchNotifications();
        }, 1000); // fetch every 1s (you can increase this if needed)

        return () => clearInterval(interval);
    }, []);

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
                <MaterialIcons name="notifications-off" size={48} color="#999" />
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

    const handleDelete = async (item) => {
        console.log("Delete API called for notification id:", item.id);

        try {
            // Close swipe animation first
            swipeableRefs.current[item.id]?.close();

            // small delay to allow swipe animation to complete
            setTimeout(async () => {
                await axiosInstance.delete(`/notification/delete/${item.id}`);

                setNotifications((prev) =>
                    prev.filter((n) => n.id !== item.id)
                );

                console.log("Notification deleted successfully:", item.id);

                // cleanup swipeable ref
                delete swipeableRefs.current[item.id];
            }, 200); // 200ms delay
        } catch (error) {
            console.log("Error deleting notification:", error);
        }
    };

    const renderRightActions = () => {
        // We don’t need a button since swipe itself deletes
        return (
            <View style={styles.actionWrapper}>
                <MaterialIcons name="delete-outline" size={22} color="#555" />
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
                        <MaterialIcons name="access-time" size={14} color="#888" />
                        <Text style={styles.time}>{formatDateTime(item.sent_at)}</Text>
                    </View>
                </View>
            </View>
        </Swipeable>
    );

    return (
        <SafeAreaView edges={["bottom"]} style={styles.container}>
            <FlatList
                data={notifications}
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
        backgroundColor: "#fff",
        paddingBottom: 55,
    },
    card: {
        backgroundColor: "#fff",
        marginHorizontal: 12,
        marginVertical: 6,
        padding: 14,
        borderRadius: 14,
        elevation: 2,
    },
    title: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
    body: { fontSize: 12, color: "#555", marginBottom: 8 },
    footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    badge: { backgroundColor: "#F1ECFF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 11, fontWeight: "500" },
    timeRow: { flexDirection: "row", alignItems: "center" },
    time: { fontSize: 11, color: "#888", marginLeft: 4 },
    actionWrapper: {
        justifyContent: "center",
        alignItems: "center",
        width: 80,
        marginVertical: 6,
        borderRadius: 14,
        backgroundColor: "#ECECEC",
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
        color: "#888",
        fontWeight: "500",
    },

});
