import React from "react";
import { Text, StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TopFundamentalSlider = ({
    learningCategory = [],
    selectedCategory,
    onTabChange,
    isClickable = true
}) => {

    let tabs = [];

    // Learning Page
    if (learningCategory.length > 0) {
        tabs = learningCategory.map(c => ({
            id: c.id,
            name: c.name,
            type: "learning"
        }));
    }
    // Stock Timeline Page
    else {
        tabs = [
            { id: "Latest", name: "Latest", type: "stock" },
            { id: "Watchlists", name: "Watchlists", type: "stock" },
            { id: "Gainers", name: "Gainers", type: "stock" },
            { id: "Losers", name: "Losers", type: "stock" },
        ];
    }

    // Determine active/selected tab
    let selectedId =
        typeof selectedCategory === "object"
            ? selectedCategory?.id
            : selectedCategory;

    // CLICK HANDLER
    const handlePress = (item) => {
        if (!isClickable) return;

        if (item.type === "learning") {
            return onTabChange(item);
        }

        if (item.type === "stock") {
            return onTabChange(item.id);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                {tabs.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[
                            styles.tabItem,
                            selectedId === item.id && styles.activeTab
                        ]}
                        onPress={() => handlePress(item)}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                selectedId === item.id && styles.activeTabText
                            ]}
                        >
                            {item.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { backgroundColor: global.colors.background },
    scrollContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 5,
        paddingHorizontal: 20,
    },

    tabItem: {
        backgroundColor: global.colors.background,
        borderRadius: 40,
        paddingVertical: 4,
        paddingHorizontal: 16,
        marginRight: 10,
        elevation: 2,
        shadowColor: global.colors.surface,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 1.5,
    },

    tabText: {
        color: global.colors.textSecondary,
        fontSize: 12,
        fontWeight: "500",
    },

    activeTab: {
        backgroundColor: global.colors.surface,
    },

    activeTabText: {
        color: global.colors.textPrimary,
        fontWeight: "600",
    },
});

export default TopFundamentalSlider;