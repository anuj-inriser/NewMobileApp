import React, { useState } from "react";
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Modal,
    Platform,
    UIManager,
    LayoutAnimation
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}


const GlobalSubTabMenu = ({
    tabs = [],
    activeTab,
    onTabChange,
    type = "secondary",
    hideShadow = false,
    onLayout,
    showFilter = false,
    filterOptions = [],
    selectedFilter = "All",
    onFilterChange,
}) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const handleFilterSelect = (option) => {
        onFilterChange?.(option);
        setIsFilterOpen(false);
    };

    return (
        <View style={[styles.wrapper, hideShadow && { marginBottom: 0 }]} onLayout={onLayout}>
            <View style={[
                styles.topSliders,
                hideShadow && styles.noShadow
            ]}><ScrollView
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
                                key={tab.tradeTypeId ?? 'all'}
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
                                onPress={() => {
                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                    onTabChange?.(tab);
                                }}
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
            {!hideShadow && (
                <LinearGradient
                    colors={[global.colors.overlayLow, 'transparent']}
                    style={styles.bottomShadow}
                />
            )}

            {/* FILTER BUTTON - below divider line */}
            {showFilter && (
                <View style={styles.filterRow}>
                    <TouchableOpacity
                        style={styles.filterContainer}
                        onPress={() => setIsFilterOpen(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={selectedFilter !== "All" ? "funnel" : "funnel-outline"}
                            size={15}
                            color={global.colors.textPrimary}
                        />
                        <Text style={styles.filterLabel}>Filter</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* FILTER MODAL */}
            <Modal
                visible={isFilterOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsFilterOpen(false)}
            >
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={() => setIsFilterOpen(false)}
                >
                    <View style={styles.filterDropdown}>
                        {filterOptions.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.dropdownItem}
                                onPress={() => handleFilterSelect(option)}
                            >
                                <Text style={styles.dropdownText}>{option}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>


    );
};

export default GlobalSubTabMenu;

const styles = StyleSheet.create({


    wrapper: {
        position: "relative",
        marginBottom: 20,
    },

    topSliders: {
        backgroundColor: global.colors.background,
        zIndex: 2,
        paddingBottom: 6,

        shadowColor: global.colors.textPrimary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
    },

    bottomShadow: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: -5,
        height: 3,
        zIndex: 1,
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
        paddingVertical: 6,
        alignItems: "center",
        paddingLeft: 16,
    },

    tabItem: {
        marginRight: 20,
        paddingVertical: 6,
    },

    /* PRIMARY */

    activePrimaryTab: {
        backgroundColor: global.colors.primary,
        elevation: 4,
        shadowColor: global.colors.primary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },

    inactivePrimaryTab: {
        backgroundColor: global.colors.background,
        elevation: 4,
        shadowColor: global.colors.textPrimary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },

    activePrimaryTabText: {
        color: global.colors.background,
        fontWeight: "500",
    },

    inactivePrimaryTabText: {
        color: global.colors.secondary,
    },

    /* SECONDARY */

    activeSecondaryTab: {
        backgroundColor: global.colors.primary,
        borderRadius: 18,
        paddingVertical: 6,
        paddingHorizontal: 12,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 2,
    },

    inactiveSecondaryTab: {
        backgroundColor: global.colors.background,
    },

    activeSecondaryTabText: {
        color: global.colors.textPrimary,
        fontWeight: "500",
    },

    inactiveSecondaryTabText: {
        color: global.colors.textSecondary,
    },

    tabText: {
        fontSize: 12,
        fontWeight: "500",
    },

    filterRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    filterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    filterLabel: {
        fontSize: 12,
        color: global.colors.textPrimary,
        fontWeight: '600',
    },
    overlay: {
        flex: 1,
        backgroundColor: global.colors.overlay,
        justifyContent: "flex-start",
        alignItems: "flex-end",
    },
    filterDropdown: {
        backgroundColor: global.colors.background,
        borderRadius: 12,
        marginTop: 130,
        marginRight: 20,
        width: 140,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: global.colors.border,
        elevation: 10,
    },
    dropdownItem: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    dropdownText: {
        fontSize: 14,
        color: global.colors.textPrimary,
    },

});
