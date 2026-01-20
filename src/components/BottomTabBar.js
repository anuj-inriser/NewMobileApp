import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal, Animated, Pressable } from "react-native";
import { useNavigation, useNavigationState } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePermission } from "../hooks/usePermission";

// Helper to find the current active route name recursively
const getActiveRouteName = (state) => {
  if (!state || !state.routes || state.index == null) return null;
  const route = state.routes[state.index];
  if (route.state) {
    return getActiveRouteName(route.state);
  }
  return route.name;
};

const BottomTabBar = () => {
  const canViewPortfolio = usePermission("VIEW_PORTFOLIO");
  const canViewCommunity = usePermission("VIEW_COMMUNITY");
  const canViewTrade = usePermission("VIEW_TRADE");
  const canViewIdeas = usePermission("VIEW_IDEAS");
  const navigation = useNavigation();
  const currentRouteName = useNavigationState((state) => getActiveRouteName(state));
  const insets = useSafeAreaInsets();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    if (showUpgradeModal) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,     // lower = more bounce
        tension: 80,
      }).start();
    } else {
      scaleAnim.setValue(0.8);
    }
  }, [showUpgradeModal]);

  const tabs = [
    { name: "Home", component: "Equity", isPermission: true, icon: require("../../assets/homemenu.png") },
    { name: "Portfolio", component: "Portfolio", isPermission: canViewPortfolio, icon: require("../../assets/portfoliomenu.png") },
    { name: "Community", component: "StockTimelineScreen", isPermission: canViewCommunity, icon: require("../../assets/communitymenu.png") },
    { name: "Ideas", component: "Trade", isPermission: canViewIdeas, icon: require("../../assets/ideasmenu.png") },
    { name: "Trade", component: "OrdersScreen", isPermission: canViewTrade, icon: require("../../assets/trademenu.png") },
  ];

  return (
    <View style={[styles.absoluteBar, { paddingBottom: insets.bottom }]}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = currentRouteName === tab.component;
          // console.log("isActive", isActive)
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => {
                if (!tab.isPermission) {
                  setShowUpgradeModal(true)
                  return;
                }
                navigation.navigate("App", {
                  screen: tab.component,
                })
              }
              }
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

      <Modal
        transparent
        animationType="fade"
        visible={showUpgradeModal}
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalBox,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            <View style={styles.successIcon}>
              <Image
                source={require("../../assets/redalert.png")}
                style={styles.alertIconImg}
              />
            </View>
            <Text style={styles.modalTitle}>Upgrade Your Plan</Text>
            <Text style={styles.modalMessage}>
              Unlock this feature by upgrading your plan.
            </Text>

            <Pressable
              style={styles.modalButton}
              onPress={() => setShowUpgradeModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
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
  // Modal style
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#210F47",
    marginBottom: 8,
  },

  modalMessage: {
    fontSize: 13,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },

  modalButton: {
    backgroundColor: "#210F47",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },

  modalButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },

  successIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  alertIconImg: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
});

export default BottomTabBar;
