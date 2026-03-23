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

const BottomTabBar = ({ state, descriptors, navigation, forceShow = false }) => {
  const canViewCommunity = usePermission("VIEW_EXPLORE");
  const canViewTrade = usePermission("VIEW_TRADE");
  const canViewIdeas = usePermission("VIEW_IDEAS");
  const canViewNews = usePermission("VIEW_NEWS");
  // const navigation = useNavigation();
  // const currentRouteName = useNavigationState((state) => getActiveRouteName(state));
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

  const tabs = React.useMemo(() => [
    { name: "Home", component: "Equity", isPermission: true, icon: require("../../assets/homemenu.png") },
    { name: "News", component: "NewsScreen", isPermission: canViewNews, icon: require("../../assets/newsmennu.png") },
    { name: "Explore", component: "StockTimelineScreen", isPermission: canViewCommunity, icon: require("../../assets/exploremenu.png") },
    { name: "Ideas", component: "Trade", isPermission: canViewIdeas, icon: require("../../assets/ideasmenu.png"), isRootNav: false },
    { name: "Portfolio", component: "AdvancedChart", isPermission: canViewTrade, icon: require("../../assets/trademenu.png"), isRootNav: true },
  ], [canViewNews, canViewCommunity, canViewIdeas, canViewTrade]);

  if (!state || !state.routes || typeof state.index !== 'number') {
    return null; // or empty view
  }

  // Hide bottom bar when on Trade tab (AdvancedChart screen)
  const currentRoute = state.routes[state.index];
  if (currentRoute.name === 'AdvancedChart' && !forceShow) {
    return null;
  }

  return (
    <View style={[styles.absoluteBar, { paddingBottom: insets.bottom }]}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const currentRoute = state.routes[state.index] ?? {};
          const isActive = currentRoute.name === tab.component;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => {
                if (!tab.isPermission) {
                  setShowUpgradeModal(true);
                  return;
                }
                // Navigate to root-level screen (AdvancedChart) or App stack screen
                if (tab.isRootNav) {
                  navigation.navigate(tab.component, {
                    symbol: "NSE:RELIANCE-EQ",
                  });
                } else {
                  if (!isActive) {
                    navigation.navigate('App', {
                      screen: 'MainTabs',
                      params: { screen: tab.component }
                    });
                  }
                }
              }}
            >
              <View style={[styles.iconWrapper, isActive && styles.activeBackground]}>
                <Image source={tab.icon} style={styles.iconImg} resizeMode="contain" />
                {tab.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.label, { color: isActive ? global.colors.secondary : global.colors.textSecondary }]}>
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
    backgroundColor: global.colors.background,
  },

  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 6,
    minHeight: 55,
    borderTopWidth: 1,
    borderColor: global.colors.border,
    backgroundColor: global.colors.background,
  },

  tabItem: { alignItems: "center", flex: 1 },
  iconWrapper: { position: "relative", justifyContent: "center", alignItems: "center", height: 32, },

  iconImg: { width: 22, height: 22 },
  label: { fontSize: 12, marginTop: 3, fontWeight: "500" },

  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: global.colors.error,
    borderRadius: 10,
    paddingHorizontal: 4,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: global.colors.background, fontSize: 10, fontWeight: "700" },

  activeBackground: {
    backgroundColor: global.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  // Modal style
  modalOverlay: {
    flex: 1,
    backgroundColor: global.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "80%",
    backgroundColor: global.colors.background,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: global.colors.secondary,
    marginBottom: 8,
  },

  modalMessage: {
    fontSize: 13,
    color: global.colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },

  modalButton: {
    backgroundColor: global.colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },

  modalButtonText: {
    color: global.colors.background,
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