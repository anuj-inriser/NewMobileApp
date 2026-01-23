import React from "react";
import { View, Text, StyleSheet } from "react-native";

const PortfolioHoldingsCard = ({
  totalCurrent = 0,
  totalInvested = 0,
  profit = 0,
  profitPercent = 0,
  compactMode = false
}) => {
  const formatAmount = (num) => {
    if (num >= 10000000) return (num / 10000000).toFixed(2) + " Cr";
    if (num >= 100000) return (num / 100000).toFixed(2) + " L";
    if (num >= 1000) return (num / 1000).toFixed(2) + " K";
    return num.toFixed(2);
  };

  const profitColor = profit >= 0 ? "#22C55E" : "#EF4444";
  const profitDisplay = profit >= 0 ? `+₹${formatAmount(Math.abs(profit))}` : `-₹${formatAmount(Math.abs(profit))}`;
  const percentDisplay = profitPercent >= 0 ? `+${profitPercent.toFixed(2)}%` : `${profitPercent.toFixed(2)}%`;

  return (
    <View style={[styles.card, compactMode && styles.cardCompact]}>
      <View style={styles.mainSection}>
        <Text style={styles.label}>Portfolio Value</Text>
        <Text style={styles.portfolioValue}>₹ {formatAmount(totalCurrent)}</Text>
        
        <View style={styles.gainSection}>
          <Text style={styles.gainLabel}>Today's Gain/Loss</Text>
          <View style={styles.gainRow}>
            <Text style={[styles.gainAmount, { color: profitColor }]}>
              {profitDisplay}
            </Text>
            <Text style={[styles.gainPercent, { color: profitColor }]}>
              {" "}({percentDisplay})
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.holdingsRow}>
          <View style={styles.dot} />
          <Text style={styles.holdingsLabel}>Equity Holdings</Text>
          <Text style={styles.holdingsAmount}>₹ {formatAmount(totalInvested)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardCompact: {
    marginVertical: 8,
    padding: 16,
  },
  mainSection: {
    width: "100%",
  },
  label: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
    marginBottom: 6,
  },
  portfolioValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#210F47",
    marginBottom: 16,
  },
  gainSection: {
    marginBottom: 16,
  },
  gainLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
    marginBottom: 4,
  },
  gainRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  gainAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  gainPercent: {
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 12,
  },
  holdingsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#210F47",
    marginRight: 10,
  },
  holdingsLabel: {
    flex: 1,
    fontSize: 14,
    color: "#444",
    fontWeight: "500",
  },
  holdingsAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#210F47",
  },
});

export default PortfolioHoldingsCard;
