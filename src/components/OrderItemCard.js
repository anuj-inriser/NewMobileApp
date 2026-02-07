import React, { useRef } from "react";
import { View, Text, StyleSheet, Alert, Image } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";

const OrderItemCard = ({ name, type, shares, status, price, ltp, onModify, onCancel, broker }) => {
    const isCancelled = status?.toString().toLowerCase() === "cancelled";
    const statusLower = status?.toString().trim().toLowerCase();

    // Cancel should not work for cancelled or rejected
    const disableCancel =
        statusLower === "cancelled" ||
        statusLower === "canceled" ||
        statusLower === "rejected";

    // Modify should not work for cancelled or completed
    const disableModify =
        statusLower === "cancelled" ||
        statusLower === "canceled" ||
        statusLower === "completed" ||
        statusLower === "executed";

    const swipeRef = useRef(null);

    // 🔵 Status Color Logic
    const getStatusColor = () => {
        if (!status) return global.colors.disabled;

        const s = status.toString().trim().toLowerCase();

        if (["complete", "completed", "executed"].includes(s)) return global.colors.success; // Green
        if (["cancelled", "canceled", "rejected"].includes(s)) return global.colors.error; // Red
        if (
            s === "pending" ||
            s === "open" ||
            s === "trigger pending" ||
            s === "put order req received" ||
            s === "put order request was received"
        ) return global.colors.warning; // Yellow
        return global.colors.disabled;
    };

    // 🔵 Format first letter uppercase
    const formatStatus = (s) => {
        if (!s) return "";
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    };

    // 🔵 BUY / SELL color logic
    const getTypeColor = () => {
        if (!type) return global.colors.textPrimary;

        const t = type.toString().trim().toLowerCase();
        if (t === "buy") return global.colors.success;  // Green
        if (t === "sell") return global.colors.error; // Red

        return global.colors.textPrimary;
    };

    const closeSwipe = () => swipeRef.current?.close();

    const handleLeftSwipe = () => {
        onModify?.();
        closeSwipe();
    };

    const handleRightSwipe = () => {

        Alert.alert(
            "Cancel Order",
            "Are you sure you want to cancel this order?",
            [
                {
                    text: "No",
                    style: "cancel",
                    onPress: () => {
                        swipeRef.current?.close();
                    }
                },
                {
                    text: "Yes",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            if (onCancel) {
                                await onCancel();
                            }
                        } catch (err) {
                            console.error("Cancel API failed:", err);
                        } finally {
                            swipeRef.current?.close();
                        }
                    }
                }
            ],
            { cancelable: true }
        );
    };

    return (
        <Swipeable
            ref={swipeRef}
            renderLeftActions={() =>
                !disableModify ? (
                    <View style={styles.leftAction}>
                        <Text style={styles.leftText}>Modify ››</Text>
                    </View>
                ) : null
            }
            renderRightActions={() =>
                !disableCancel ? (
                    <View style={styles.rightAction}>
                        <Text style={styles.rightText}>‹‹ Cancel</Text>
                    </View>
                ) : null
            }

            onSwipeableLeftOpen={
                !disableModify ? handleLeftSwipe : undefined
            }

            onSwipeableRightOpen={
                !disableCancel ? handleRightSwipe : undefined
            }

            overshootLeft={false}
            overshootRight={false}
        >
            <View style={styles.card}>

                <View style={styles.mainRow}>

                    {/* LEFT SECTION */}
                    <View style={styles.leftSection}>
                        <Text style={styles.stockName} numberOfLines={1}>{name}</Text>

                        <View style={styles.buyRow}>
                            {broker === 1 ? (
                                <Image
                                    source={require("../../assets/angelone.png")}
                                    style={styles.brokerIcon}
                                />
                            ) : (
                                <></>
                                // <View style={[styles.buyDot, { backgroundColor: getTypeColor() }]} />
                            )}

                            <Text style={[styles.buyText, { color: getTypeColor() }]}>
                                {type ? type.toUpperCase() : ""}
                            </Text>
                        </View>
                    </View>

                    {/* CENTER SECTION */}
                    <View style={styles.centerSection}>
                        <Text style={styles.sharesLabel}>Shares</Text>
                        <Text style={styles.sharesValue}>{shares}</Text>
                    </View>

                    {/* RIGHT SECTION */}
                    <View style={styles.rightSection}>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                            <Text style={[styles.statusText, { color: getStatusColor() }]}>
                                {formatStatus(status)}
                            </Text>
                        </View>

                        <Text style={styles.priceText}>{price}</Text>
                    </View>

                </View>

            </View>
        </Swipeable>
    );
};

export default OrderItemCard;

const styles = StyleSheet.create({
    leftAction: {
        justifyContent: "center",
        paddingLeft: 30,
        width: 90,
        borderRadius: 14,
    },
    leftText: {
        fontSize: 12,
        fontWeight: "700",
        color: global.colors.secondary,
    },
    rightAction: {
        justifyContent: "center",
        paddingLeft: 35,
        width: 110,
        borderRadius: 14,
    },
    rightText: {
        fontSize: 12, fontWeight: "700", color: global.colors.error
    },

    card: {
        backgroundColor: global.colors.background,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: global.colors.border,
        marginHorizontal: 20,
        marginTop: 5,
        elevation: 0,
        shadowColor: "transparent",
    },

    mainRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    leftSection: { flex: 1.3 },

    stockName: {
        fontSize: 14,
        fontWeight: "700",
        color: global.colors.textPrimary,
        marginBottom: 4,
    },

    buyRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    buyDot: {
        width: 10,
        height: 10,
        borderRadius: 50,
        marginRight: 6,
    },

    buyText: {
        fontSize: 14,
        fontWeight: "700",
    },

    centerSection: {
        flex: 1,
        alignItems: "center",
    },

    sharesLabel: {
        fontSize: 12,
        color: global.colors.textSecondary,
        fontWeight: "500",
    },

    sharesValue: {
        fontSize: 12,
        fontWeight: "700",
        color: global.colors.textPrimary,
        marginTop: 2,
    },

    rightSection: {
        flex: 1,
        alignItems: "flex-end",
    },

    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },

    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 4,
    },

    statusText: {
        fontSize: 13,
        fontWeight: "600",
    },

    priceText: {
        fontSize: 14,
        fontWeight: "700",
        color: global.colors.textPrimary,
    },
    brokerIcon: {
        width: 12,
        height: 12,
        marginRight: 6,
        borderRadius: 20,
    },
});