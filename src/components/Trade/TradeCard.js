import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { formatFullPublishedDateTime } from "../../utils/dateFormat";
import { useNavigation } from '@react-navigation/native';

const STATUS_COLORS = {
    "Live": "#D32F2F",
    "Target Hit": "#22C55E",
    "Target Miss": "#D32F2F",
    "Closed": "#666666",
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
  ltp,
  change,
  changePercent,
}) => {
  const navigation = useNavigation();

  const statusColor = STATUS_COLORS[status] || "#666666";

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.scriptStatusContainer}>
         
            <Text style={styles.script}>{script}</Text>
            <Text style={[styles.status, { color: statusColor }]}>
              {status}
            </Text>
          
          {/* LTP DISPLAY */}
          {ltp && (
            <View style={{ marginLeft: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#000" }}>
                ₹{Number(ltp).toFixed(2)}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: Number(change) >= 0 ? "#22C55E" : "#D32F2F",
                }}
              >
                {Number(change).toFixed(2)} ({Number(changePercent).toFixed(2)}
                %)
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => {
            navigation.navigate("TradeOrder", {
              symbol: script, // Use script name (e.g. RELIANCE) instead of ID
              token: token,
              name: script,
              price: entry,
              quantity: 1,
              stoploss: stopLoss,
              target: target,
              internaltype: "Place",
              type: tradeRecommendation, // Buy or Sell
            });
          }}
          activeOpacity={0.7}
        >
          <View
            style={[
              tradeRecommendation === "Buy" || tradeRecommendation === "buy"
                ? styles.greenBadge
                : styles.redBadge,
            ]}
          >
            <Text style={styles.badgeText}>{tradeRecommendation}</Text>
          </View>
        </TouchableOpacity>
      </View>

                {/* Dates */}
                <View style={styles.datesRow}>
                    {exitDate ? (
                        <>
                            <Text style={styles.smallText}>
                                <Text style={styles.smallBold}>Entry: </Text>
                                {formatFullPublishedDateTime(entryDate)}
                            </Text>
                            <Text style={styles.smallText}>
                                <Text style={styles.smallBold}>Exit: </Text>
                                {formatFullPublishedDateTime(exitDate)}
                            </Text>
                        </>
                    ) : (
                        // Only show entry date, no label
                        <Text style={styles.smallText}>
                            <Text style={styles.smallBold}>Entry: </Text>
                            {formatFullPublishedDateTime(entryDate)}
                        </Text>
                    )}
                </View>

                {/* Data Row */}
                <View style={styles.dataRow}>
                    <View>
                        <Text style={styles.dataLabel}>Entry</Text>
                        <Text style={styles.dataValue}>{entry}</Text>
                    </View>
                    <View>
                        <Text style={styles.dataLabel}>Target</Text>
                        <Text style={styles.dataValue}>{target}</Text>
                    </View>
                    <View>
                        <Text style={styles.dataLabel}>Stop Loss</Text>
                        <Text style={styles.dataValue}>{stopLoss}</Text>
                    </View>
                    <View>
                        <Text style={styles.dataLabel}>Perspective</Text>
                        <Text style={styles.dataValue}>{perspective}</Text>
                    </View>
                </View>

                {/* Disclaimer */}
                <Text style={styles.disclaimer}>Disclaimer</Text>
                <Text style={styles.disclaimerText}>lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit amet.</Text>
            </View>
        );
    };


const styles = StyleSheet.create({
    card: {
        width: '100%',
        height: 160,
        alignSelf: "center",
        backgroundColor: "#fff",
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 12,
        marginVertical: 5,
        borderColor: "#eee",
        borderWidth: 1,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },

    scriptStatusContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
    },

    script: {
        fontSize: 16,
        fontWeight: "700",
        color: "#210F47",
        marginRight: 6,
    },

    status: {
        fontSize: 12,
        fontWeight: "600",
        marginTop: 2, // Slight upward alignment
    },
    greenBadge: {
        backgroundColor: "#22C55E",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 20,
        width: 51,
        height: 24,
        textAlign: "center",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 4,
    },
    redBadge: {
        backgroundColor: "#D32F2F",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 20,
        width: 51,
        height: 24,
        textAlign: "center",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 4,
    },
    badgeText: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "700",
        textAlign: "center",
    },
    datesRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    smallText: {
        fontSize: 10,
        color: "#747474",
    },
    smallBold: {
        fontSize: 10,
        color: "#565555ff",
        fontWeight: "600",
    },
    dataRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    dataLabel: {
        fontSize: 12,
        color: "#666666",
        fontWeight: "400"
    },
    dataValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#565555ff",
    },
    dataValueBold: {
        fontSize: 13,
        fontWeight: "800",
        color: "#333",
    },
    disclaimer: {
        fontSize: 9,
        color: "#8a8a8a",
        // marginTop: 2,
    },
    disclaimerText: {
        fontSize: 9,
        color: "#8a8a8a",
        marginBottom: 5
    }
});


export default TradeCard;
