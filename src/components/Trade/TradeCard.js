import React, { useCallback, useState } from "react";
import GlobalAlert from "../../components/GlobalAlert";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { formatFullPublishedDateTime } from "../../utils/dateFormat";
import { useRealtimePrices } from "../../hooks/useRealtimePrices";
import LinearGradient from "react-native-linear-gradient";
import {
    subscribeSymbols,
    unsubscribeDelayed,
} from "../../ws/marketSubscriptions";

const STATUS_COLORS = {
    Live: global.colors.error,
    "Target Hit": global.colors.secondary,
    "Target Miss": global.colors.error,
    Closed: global.colors.textSecondary,
};

const TradeCard = ({
    script,
    script_id,
    status,
    tradeRecommendation,
    entryDate,
    exitDate,
    entry,
    target,
    stopLoss,
    perspective,
    token,
    potential_profits
}) => {
    const navigation = useNavigation();
    const [showDisclaimer, setShowDisclaimer] = useState(false);
    /* ---------------- REALTIME PRICE ---------------- */
    const { prices } = useRealtimePrices();

    const symbolKey = script?.toUpperCase().trim();
    const rt = prices?.[symbolKey];
    const ltp = rt?.price;
    const prevClose = rt?.prevClose || rt?.open || entry || 0;
    const change = ltp !== undefined ? ltp - prevClose : 0;
    const changePercent =
        prevClose > 0 ? (change / prevClose) * 100 : 0;
    /* ---------------- METER CALC ---------------- */
    const min = Number(stopLoss);
    const max = Number(target);
    const base = Number(entry);

    const currentPrice = typeof ltp === "number" ? ltp : base;

    let meterPercent = 0;

    if (max > min) {
        const safePrice = Math.min(Math.max(currentPrice, min), max);
        meterPercent = ((safePrice - min) / (max - min)) * 100;
    }

    // Extra safety clamp (0–100 hard limit)
    meterPercent = Math.max(0, Math.min(100, meterPercent));


    /* ---------------- SUBSCRIBE SOCKET ---------------- */
    useFocusEffect(
        useCallback(() => {
            if (!script) return;

            const symbols = [script];
            subscribeSymbols(symbols, "TradeCard", "TradeList");

            return () => {
                unsubscribeDelayed(symbols, "TradeCard", "TradeList");
            };
        }, [script])
    );
    const formatDateWithSuffix = (dateString) => {
        if (!dateString) return "";

        const date = new Date(dateString);

        const day = date.getDate();
        const month = date.toLocaleString("en-IN", { month: "short" });
        const year = date.getFullYear();

        const getSuffix = (d) => {
            if (d >= 11 && d <= 13) return "th";
            switch (d % 10) {
                case 1:
                    return "st";
                case 2:
                    return "nd";
                case 3:
                    return "rd";
                default:
                    return "th";
            }
        };

        return `${day}${getSuffix(day)} ${month} ${year}`;
    };

    /* ---------------- UI ---------------- */
    return (
        <>
            <View style={styles.card}>
                {/* HEADER */}
                <View style={styles.topRow}>
                    <View>
                        <View style={styles.titleRow}>
                            <Text style={styles.script}>{script}</Text>
                            <View style={styles.liveBadge}>
                                <Text
                                    style={[
                                        styles.liveText,
                                        { color: STATUS_COLORS[status] },
                                    ]}
                                >
                                    {status}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.profitBadge}>
                            <Text style={styles.profitText}>
                                Profit Potential :{' '}
                                {potential_profits != null &&
                                    potential_profits !== "" &&
                                    !isNaN(potential_profits) ? (
                                    <Text style={{
                                        color: potential_profits < 0 ? global.colors.error : global.colors.success,
                                        fontWeight: 'bold'
                                    }}>
                                        {Math.abs(potential_profits)}%
                                    </Text>
                                ) : null}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() =>
                            navigation.navigate("TradeOrder", {
                                symbol: script,
                                token,
                                name: script,
                                price: entry,
                                quantity: 1,
                                stoploss: stopLoss,
                                target,
                                internaltype: "Place",
                                type: tradeRecommendation,
                            })
                        }
                    >
                        <View
                            style={[
                                styles.buyButton,
                                tradeRecommendation?.toLowerCase() === "sell" && {
                                    backgroundColor: "#E63946",
                                },
                            ]}
                        >
                            <Text style={styles.buyText}>{tradeRecommendation}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* VALUES */}
                <View style={styles.valuesRow}>
                    <View>
                        <Text style={styles.label}>Entry</Text>
                        <Text style={styles.value}>{entry}</Text>
                    </View>
                    <View>
                        <Text style={styles.label}>Target</Text>
                        <Text style={styles.value}>{target}</Text>
                    </View>
                    <View>
                        <Text style={styles.label}>Stop Loss</Text>
                        <Text style={styles.value}>{stopLoss}</Text>
                    </View>
                    <View>
                        <Text style={styles.label}>Perspective</Text>
                        <Text style={styles.value}>{perspective}</Text>
                    </View>
                </View>

                {/* PRICE METER */}
                <View style={styles.meterWrapper}>

                    {/* LTP TOOLTIP (ABOVE POINTER) */}
                    <View
                        style={[
                            styles.pointerWrapper,
                            { left: `${meterPercent}%` },
                        ]}
                    >
                        {/* LTP TOOLTIP */}
                        {typeof ltp === "number" && (
                            <View style={styles.priceBubble}>
                                <Text style={styles.priceText}>₹{ltp.toFixed(2)}</Text>
                                {/* <View style={styles.priceArrow} /> */}
                                <Text
                                    style={{
                                        fontSize: 11,
                                        fontWeight: "600",
                                        color: Number(change) >= 0 ? global.colors.success : global.colors.error,
                                    }}
                                >
                                    {Number(change).toFixed(2)} ({Number(changePercent).toFixed(2)}
                                    %)
                                </Text>
                            </View>
                        )}

                        {/* POINTER */}
                        <View style={styles.pointerLine} />
                        <View style={styles.pointerDot} />
                    </View>




                    {/* PROGRESS BAR */}
                    <LinearGradient
                        colors={["#E63946", "#F4D03F", "#2ECC71"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.meterBar}
                    />

                    {/* SL & TARGET (BELOW BAR) */}
                    <View style={styles.meterBottomLabels}>
                        <Text style={styles.slText}>Stop Loss : ₹{stopLoss}</Text>
                        <Text style={styles.targetText}>Target : ₹{target}</Text>
                    </View>

                </View>


                {/* DATES */}
                <View style={styles.datesRow}>
                    <Text style={styles.dateText}>
                        Entry: {formatDateWithSuffix(entryDate)}

                    </Text>
                    {exitDate && (
                        <Text style={styles.dateText}>
                            Exit: {formatDateWithSuffix(exitDate)}
                        </Text>
                    )}
                </View>

                {/* DISCLAIMER */}
                <TouchableOpacity
                    style={styles.disclaimerBtn}
                    onPress={() => setShowDisclaimer(true)}
                >
                    <Text style={styles.disclaimerText}>Disclaimer</Text>
                </TouchableOpacity>

            </View>
            <GlobalAlert
                visible={showDisclaimer}
                type="error"
                title="Disclaimer"
                message={`All trade calls/ recommendations are provided by SEBI registered research analysts. Users are advised to consult their personal financial advisors before taking any trading or investing positions. Equitty works as a technology platform provider and holds no responsibility on any losses incurred by the users. Certification from NISM, registration with SEBI, or past performance of trading calls does not guarantee any assurance on profitable outcomes on calls/recommendations given on the platform. General Terms & Conditions, Policies and Disclaimers applies to all the content provided on the application, by using the application user confirms and provide their consent to the same.`}
                onClose={() => setShowDisclaimer(false)}
            />
        </>
    );
};

export default TradeCard;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
    card: {
        backgroundColor: global.colors.background,
        borderRadius: 18,
        padding: 14,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: global.colors.border,
        elevation: 3,
    },

    /* ---------- HEADER ---------- */

    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },

    titleRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    script: {
        fontSize: 18,
        fontWeight: "800",
        color: global.colors.secondary,
        marginRight: 8,
    },

    liveBadge: {
        backgroundColor: global.colors.surface,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },

    liveText: {
        fontSize: 11,
        fontWeight: "700",
    },

    profitBadge: {
        marginTop: 6,
        backgroundColor: global.colors.surface,
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },

    profitText: {
        color: global.colors.secondary,
        fontSize: 12,
        fontWeight: "700",
    },

    buyButton: {
        backgroundColor: global.colors.success,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },

    buyText: {
        color: global.colors.background,
        fontWeight: "800",
        fontSize: 13,
    },

    /* ---------- VALUES ---------- */

    valuesRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 14,
    },

    label: {
        fontSize: 11,
        color: global.colors.textSecondary,
    },

    value: {
        fontSize: 14,
        fontWeight: "700",
        color: global.colors.secondary,
    },

    /* ---------- METER ---------- */

    meterWrapper: {
        marginTop: 45,
        // marginBottom: 22,
        position: "relative",
    },

    meterBar: {
        height: 8,
        borderRadius: 8,
    },

    /* POINTER */
    pointerWrapper: {
        position: "absolute",
        top: 0,
        alignItems: "center",
        zIndex: 5,
        transform: [{ translateX: -5 }], // half of dot width
    },

    pointerLine: {
        width: 2,
        height: 12,
        backgroundColor: global.colors.secondary,
    },

    pointerDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: global.colors.secondary,
        marginTop: -2,
    },

    /* LTP TOOLTIP */
    priceBubble: {
        position: "absolute",
        bottom: 24,        // 👈 pointer ke upar
        backgroundColor: global.colors.background,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: global.colors.border,
        zIndex: 10,
        minWidth: 90,
        alignItems: "center",
    },

    priceText: {
        fontSize: 11,
        fontWeight: "700",
        color: global.colors.secondary,
    },

    priceArrow: {
        position: "absolute",
        bottom: -6,
        left: "50%",
        marginLeft: -5,
        width: 0,
        height: 0,
        borderLeftWidth: 5,
        borderRightWidth: 5,
        borderTopWidth: 6,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderTopColor: global.colors.background,
    },

    /* SL / TARGET BELOW BAR */

    meterBottomLabels: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 15,
    },

    slText: {
        fontSize: 11,
        fontWeight: "700",
        color: global.colors.error,
    },

    targetText: {
        fontSize: 11,
        fontWeight: "700",
        color: global.colors.success,
    },

    /* ---------- DATES ---------- */

    datesRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 6,
    },

    dateText: {
        fontSize: 11,
        color: global.colors.textPrimary,
    },

    /* ---------- DISCLAIMER ---------- */

    disclaimerBtn: {
        alignSelf: "flex-end",
        marginTop: 6,
        backgroundColor: "#1F2937",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },

    disclaimerText: {
        color: global.colors.background,
        fontSize: 10,
        fontWeight: "600",
    },
});