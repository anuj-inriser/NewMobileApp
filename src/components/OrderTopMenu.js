import React, { useState, useEffect } from "react";
import {
  Text,
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const OrderTopMenu = ({
  items = [],
  defaultSelected = "Intraday",
  onSelect,
}) => {
  const [selected, setSelected] = useState(defaultSelected);
  useEffect(() => {
    setSelected(defaultSelected);
  }, [defaultSelected]);
  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <View style={styles.shadowWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {items.map((item) => {
            const isActive = selected === item.name;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  setSelected(item.name);
                  if (onSelect) onSelect(item.name);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.tabWhite, isActive && styles.activeTab]}>
                  <Text
                    style={[
                      styles.tabTextDark,
                      isActive && styles.tabTextActive,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.name}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: global.colors.background,
  },

  shadowWrapper: {
    backgroundColor: global.colors.background,
    paddingTop: 1,
    shadowColor: global.colors.textPrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    width: "100%",
    borderBottomWidth: 0,
  },

  scrollContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 8,
  },

  tabWhite: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 32,
    backgroundColor: global.colors.background,
    borderRadius: 40,
    paddingVertical: 7,
    paddingHorizontal: 20,
    marginRight: 12,
    shadowColor: global.colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1.5,
    elevation: 1,
  },

  activeTab: {
    backgroundColor: global.colors.secondary,
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },

  tabTextDark: {
    color: global.colors.secondary,
    fontSize: 13,
    fontWeight: "500",
  },

  tabTextActive: {
    color: global.colors.background,
  },
});

export default OrderTopMenu;