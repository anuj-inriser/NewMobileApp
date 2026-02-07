import React from "react";
import { View, Text, StyleSheet } from "react-native";

const PortfolioCard = ({
    name,
    shares,
    invested,
    price,
    currentValue,
    profit,
    profitPercent,
    today,
    todayPercent
}) => {

    // Safely convert all values to number
    const toNum = (val) => {
        const num = Number(val);
        return isNaN(num) ? 0 : num;
    };

    // Colors based on + / - values
    const profitColor = toNum(profit) >= 0 ? global.colors.success : global.colors.error;
    const profitPercentColor = toNum(profitPercent) >= 0 ? global.colors.success : global.colors.error;
    const todayColor = toNum(today) >= 0 ? global.colors.success : global.colors.error;
    const todayPercentColor = toNum(todayPercent) >= 0 ? global.colors.success : global.colors.error;
    const currentValueColor = toNum(currentValue) >= 0 ? global.colors.success : global.colors.error;

    // Number formatter
    const formatNumber = (num) => {
        const n = toNum(num);
        return new Intl.NumberFormat("en-IN").format(Math.abs(n));
    };

    return (
        <View style={styles.card}>
            <View style={styles.row}>

                {/* LEFT SIDE */}
                <View style={{ flex: 1.6 }}>
                    <Text style={styles.name}>
                        {name}{" "}
                        <Text style={styles.sharesText}>
                            (Share : {formatNumber(shares)})
                        </Text>
                    </Text>

                    <Text style={styles.label}>Invested : ₹{formatNumber(invested)}</Text>
                    <Text style={styles.label}>Avg. Price : ₹{formatNumber(price)}</Text>
                </View>

                {/* RIGHT SIDE */}
                <View style={styles.rightBlock}>
                    <Text style={[styles.profit]}>
                        ₹{formatNumber(profit)}
                        <Text style={[styles.percentText, { color: profitPercentColor }]}>
                            {" "}({formatNumber(profitPercent)}%)
                        </Text>
                    </Text>

                    <Text style={[styles.today, { color: currentValueColor }]}>
                        <Text style={styles.rightLabel}>LTP :</Text> ₹{formatNumber(currentValue)}
                    </Text>

                    <Text style={styles.today}>
                        <Text style={styles.rightLabel}>Today : </Text>
                        <Text style={{ color: todayColor }}>
                            ₹{formatNumber(today)}
                        </Text>
                        {" "}
                        <Text style={{ color: todayPercentColor }}>
                            ({formatNumber(todayPercent)}%)
                        </Text>
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default PortfolioCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: global.colors.background,
        padding: 14,
        borderRadius: 16,
        marginHorizontal: 20,
        marginVertical: 6,
        borderWidth: 1,
        borderColor: global.colors.border,
        shadowColor: global.colors.textPrimary,
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },

    row: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    percentText: {
        fontSize: 10,
        fontWeight: "500",
    },

    name: {
        fontSize: 15,
        fontWeight: "700",
        color: global.colors.textPrimary,
        marginBottom: 4,
    },

    sharesText: {
        fontSize: 10,
        fontWeight: "600",
        color: global.colors.textSecondary,
    },

    label: {
        fontSize: 12,
        color: global.colors.textSecondary,
        marginBottom: 2,
    },

    rightBlock: {
        flex: 1,
        alignItems: "flex-end",
        marginTop: 3,
    },

    rightLabel: {
        fontSize: 12,
        color: global.colors.textSecondary,
        marginBottom: 2,
    },

    profit: {
        fontSize: 14,
        fontWeight: "700",
        marginBottom: 2,
    },

    today: {
        fontSize: 10,
        textAlign: "right"
    },
});