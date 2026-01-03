import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BottomTabBar = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const tabs = [
    { name: "Home", component: "Equity", icon: require("../../assets/homemenu.png") },
    { name: "Portfolio", component: "PortfolioScreen", icon: require("../../assets/portfoliomenu.png") },
    { name: "Community", component: "StockTimelineScreen", icon: require("../../assets/communitymenu.png")},
    { name: "Ideas", component: "TradeScreen", icon: require("../../assets/ideasmenu.png") },
    { name: "Trade", component: "OrdersScreen", icon: require("../../assets/trademenu.png") },
  ];

  return (
    <View style={[styles.absoluteBar, { paddingBottom: insets.bottom }]}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = route.name === tab.component;

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(tab.component)}
            >
              <View style={[styles.iconWrapper, isActive && styles.activeBackground]}>
                <Image source={tab.icon} style={styles.iconImg} resizeMode="contain" />
                {tab.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.label, { color: isActive ? "#210F47" : "#555" }]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  absoluteBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
  },

  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 6,
    minHeight: 55,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },

  tabItem: { alignItems: "center" },
  iconWrapper: { position: "relative", justifyContent: "center", alignItems: "center" },

  iconImg: { width: 22, height: 22 },
  label: { fontSize: 12, marginTop: 3, fontWeight: "500" },

  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#E53935",
    borderRadius: 10,
    paddingHorizontal: 4,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  activeBackground: {
    backgroundColor: "#E6E0E9",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
});

export default BottomTabBar;
