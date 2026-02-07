import React from "react";
import { View, Text, StyleSheet } from "react-native";

const TradeExecutedCard = ({
    exchange,
    producttype,
    tradingsymbol,
    transactiontype,
    tradevalue,
    fillprice,
    fillsize,
    orderid,
    fillid,
    filltime
}) => {

    const getTypeColor = () => {
        if (!transactiontype) return global.colors.textPrimary;
        const t = transactiontype.toLowerCase();
        if (t === "buy") return global.colors.success;
        if (t === "sell") return global.colors.error;
        return global.colors.textPrimary;
    };

    return (
        <View style={styles.card}>

            {/* HEADER ROW */}
            <View style={styles.headerRow}>
                <Text style={styles.symbol}>{tradingsymbol}</Text>

                <View style={styles.typeTag}>
                    <View style={[styles.typeDot, { backgroundColor: getTypeColor() }]} />
                    <Text style={[styles.typeText, { color: getTypeColor() }]}>
                        {transactiontype}
                    </Text>
                </View>
            </View>

            {/* 3-COL GRID ROWS */}

            {/* Row 1 */}
            <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                    <Text style={styles.label}>Exchange</Text>
                    <Text style={styles.value}>{exchange}</Text>
                </View>

                <View style={styles.gridItem}>
                    <Text style={styles.label}>Product</Text>
                    <Text style={styles.value}>{producttype}</Text>
                </View>

                <View style={styles.gridItem}>
                    <Text style={styles.label}>Trade Value</Text>
                    <Text style={styles.value}>{tradevalue}</Text>
                </View>
            </View>

            {/* Row 2 */}
            <View style={styles.gridRow}>

                <View style={styles.gridItem}>
                    <Text style={styles.label}>Fill Price</Text>
                    <Text style={styles.value}>{fillprice}</Text>
                </View>

                <View style={styles.gridItem}>
                    <Text style={styles.label}>Fill Size</Text>
                    <Text style={styles.value}>{fillsize}</Text>
                </View>
                <View style={styles.gridItem}>
                    <Text style={styles.label}>Fill ID</Text>
                    <Text style={styles.value}>{fillid}</Text>
                </View>
            </View>

            {/* Row 3 */}
            <View style={styles.gridRow}>
                <View style={styles.gridItem2}>
                    <Text style={styles.label}>Order ID</Text>
                    <Text style={styles.value}>{orderid}</Text>
                </View>


                <View style={styles.gridItem2}>
                    <Text style={styles.label}>Fill Time</Text>
                    <Text style={styles.value}>{filltime}</Text>
                </View>
            </View>

        </View>
    );
};

export default TradeExecutedCard;


const styles = StyleSheet.create({
    card: {
        backgroundColor: global.colors.background,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: global.colors.border,
        marginHorizontal: 20,
        marginTop: 10,
    },

    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },

    symbol: {
        fontSize: 16,
        fontWeight: "700",
        color: global.colors.textPrimary,
        flex: 1,
    },

    typeTag: {
        flexDirection: "row",
        alignItems: "center",
    },

    typeDot: {
        width: 10,
        height: 10,
        borderRadius: 50,
        marginRight: 6,
    },

    typeText: {
        fontSize: 14,
        fontWeight: "700",
        textTransform: "uppercase",
    },

    gridRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },

    gridItem: {
        width: "25%",
    },

    gridItem2: {
        width: "50%",
    },

    label: {
        fontSize: 11,
        color: global.colors.textSecondary,
    },

    value: {
        fontSize: 13,
        fontWeight: "600",
        color: global.colors.textPrimary,
        marginTop: 2,
    },
});