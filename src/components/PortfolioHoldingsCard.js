import React from "react";
import { View, Text, StyleSheet } from "react-native";

const PortfolioHoldingsCard = ({
  totalCurrent = 0,
  totalInvested = 0,
  profit = 0,
  profitPercent = 0,
  compactMode = false,
}) => {
  const formatAmount = (num) => {
    if (num >= 10000000) return (num / 10000000).toFixed(2) + " Cr";
    if (num >= 100000) return (num / 100000).toFixed(2) + " L";
    if (num >= 1000) return (num / 1000).toFixed(2) + " K";
    return num.toFixed(2);
  };

  // const profitColor = profit >= 0 ? global.colors.success : global.colors.error;
  // const profitDisplay = profit >= 0 ? `₹${formatAmount(Math.abs(profit))}` : `₹${formatAmount(Math.abs(profit))}`;
  // const percentDisplay = profitPercent >= 0 ? `${profitPercent.toFixed(2)}%` : `${profitPercent.toFixed(2)}%`;

    const totalProfit = totalCurrent - totalInvested;
    const totalProfitDisplay = `₹${Math.abs(totalProfit).toFixed(2)}`;
  const totalProfitPercent =
    totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
    const totalProfitPercentDisplay = `${Math.abs(totalProfitPercent).toFixed(2)}%`;

  const profitColor = profit >= 0 ? global.colors.success : global.colors.error;

  const profitDisplay = `₹${Math.abs(profit).toFixed(2)}`;

  const percentDisplay = `${Math.abs(profitPercent).toFixed(2)}%`;

  return (
    <View style={[styles.card, compactMode && styles.cardCompact]}>
      <View style={styles.mainSection}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.label}>Portfolio Value</Text>
            <Text style={styles.portfolioValue}>
              ₹ {Math.abs(totalCurrent).toFixed(2)}
            </Text>
          </View>
          <View style={styles.gainSection}>
            <Text style={styles.gainLabel}>Today's Gain/Loss</Text>
            <View style={styles.gainRow}>
              <Text style={[styles.gainAmount, { color: profitColor }]}>
                {profitDisplay}
              </Text>
              <Text style={[styles.gainPercent, { color: profitColor }]}>
                {" "}
                ({percentDisplay})
              </Text>
            </View>
            <View style={styles.gainSection}>
              <Text style={styles.gainLabel}>Total Gain/Loss</Text>
              <View style={styles.gainRow}>
                <Text style={[styles.gainAmount, { color: profitColor }]}>
                  {totalProfitDisplay}
                </Text>
                <Text style={[styles.gainPercent, { color: profitColor }]}>
                  {" "}
                  ({totalProfitPercentDisplay})
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.holdingsRow}>
          <View style={styles.dot} />
          <Text style={styles.holdingsLabel}>Equity Holdings</Text>
          <Text style={styles.holdingsAmount}>
            ₹ {Math.abs(totalInvested).toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: global.colors.background,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: global.colors.textPrimary,
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
    color: global.colors.textSecondary,
    fontWeight: "600",
    marginBottom: 6,
  },
  portfolioValue: {
    fontSize: 20,
    fontWeight: "700",
    // color: global.colors.secondary,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  gainSection: {
    alignItems: "flex-end",
    marginTop: 10,
  },
  gainLabel: {
    fontSize: 12,
    color: global.colors.textSecondary,
    fontWeight: "500",
    marginBottom: 4,
    textAlign: "right",
  },
  gainRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  gainAmount: {
    fontSize: 14,
    fontWeight: "500",
  },
  gainPercent: {
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: global.colors.border,
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
    backgroundColor: global.colors.secondary,
    marginRight: 10,
  },
  holdingsLabel: {
    flex: 1,
    fontSize: 14,
    color: global.colors.textPrimary,
    fontWeight: "500",
  },
  holdingsAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: global.colors.secondary,
  },
});

export default PortfolioHoldingsCard;
