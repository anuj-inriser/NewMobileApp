import React from "react";
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
} from "react-native";


const GlobalSubTabMenu = ({
    tabs = [],
    activeTab,
    onTabChange,
    type = "secondary",
    hideShadow = false,
    onLayout,
}) => {

    return (
        <View style={[styles.wrapper, hideShadow && { marginBottom: 0 }]} onLayout={onLayout}>
            <View style={[
                styles.topSliders,
                hideShadow && styles.noShadow
            ]}> <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabScroll}
                contentContainerStyle={styles.tabScrollContent}
            >
                    {tabs.map((tab) => {

                        const isActive =
                            activeTab?.tradeTypeId === tab.tradeTypeId;

                        const tabName = tab.tradeTypeName;

                        return (
                            <TouchableOpacity
                                key={tab.tradeTypeId}
                                style={[
                                    styles.tabItem,
                                    isActive
                                        ? (type === "primary"
                                            ? styles.activePrimaryTab
                                            : styles.activeSecondaryTab)
                                        : (type === "primary"
                                            ? styles.inactivePrimaryTab
                                            : styles.inactiveSecondaryTab)
                                ]}
                                onPress={() => onTabChange?.(tab)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.tabText,
                                    isActive
                                        ? (type === "primary"
                                            ? styles.activePrimaryTabText
                                            : styles.activeSecondaryTabText)
                                        : (type === "primary"
                                            ? styles.inactivePrimaryTabText
                                            : styles.inactiveSecondaryTabText)
                                ]}>
                                    {tabName}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}

                </ScrollView>
            </View>
        </View>


    );
};

export default GlobalSubTabMenu;

const styles = StyleSheet.create({


    wrapper: {
        position: "relative",
        marginBottom: 5,
    },

    topSliders: {
        backgroundColor: global.colors.background,
        zIndex: 2,
        paddingBottom: 6,
        paddingHorizontal: 12,

        shadowColor: global.colors.textPrimary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 3,

        borderBottomWidth: 1,
        borderBottomColor: global.colors.overlayLow,
    },

    noShadow: {
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
    },

    tabScroll: {
        flexGrow: 0,
    },

    tabScrollContent: {
        paddingRight: 16,
        paddingVertical: 5,
        alignItems: "center",
        paddingLeft: 16,
    },

    tabItem: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginRight: 8,
    },

    /* PRIMARY */

    activePrimaryTab: {
        backgroundColor: global.colors.secondary,
        elevation: 4,
        shadowColor: global.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },

    inactivePrimaryTab: {
        backgroundColor: global.colors.background,
        elevation: 2,
        shadowColor: global.colors.textPrimary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },

    activePrimaryTabText: {
        color: global.colors.background,
        fontWeight: "700",
    },

    inactivePrimaryTabText: {
        color: global.colors.secondary,
    },

    /* SECONDARY */

    activeSecondaryTab: {
        backgroundColor: global.colors.surface,
        elevation: 3,
        shadowColor: global.colors.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },

    inactiveSecondaryTab: {
        backgroundColor: global.colors.background,
    },

    activeSecondaryTabText: {
        color: global.colors.textPrimary,
        fontWeight: "700",
    },

    inactiveSecondaryTabText: {
        color: global.colors.textSecondary,
    },

    tabText: {
        fontSize: 14,
        fontWeight: "500",
    },


});
