import React, { useState } from "react";
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    Platform,
    UIManager,
    LayoutAnimation
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * GlobalTopMenu - A reusable header slider with optional filter dropdown.
 * 
 * @param {Array} tabs - [{ id, name }]
 * @param {Object} activeTab - The currently selected tab object
 * @param {Function} onTabChange - Callback when a tab is pressed
 * @param {Array} filterOptions - Array of strings for the filter dropdown
 * @param {String} selectedFilter - The active filter value
 * @param {Function} onFilterChange - Callback when a filter is selected
 * @param {Boolean} showFilter - Whether to show the filter icon
 */
const GlobalTopMenu = ({
    tabs = [],
    activeTab,
    onTabChange,
    filterOptions = [],
    selectedFilter = "All",
    onFilterChange,
    showFilter = false,
    type = "primary", // "primary" = Solid Purple, "secondary" = Subtle Grey
    hideShadow = false, // If true, bottom shadow and border are hidden
    onLayout, // Callback for measuring component height
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
            ]}>
                <View style={styles.mainContainer}>
                    {/* TAB SCROLLER */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.tabScroll}
                        contentContainerStyle={styles.tabScrollContent}
                    >
                        {tabs.map((tab, index) => {
                            // Use scriptTypeId for Trade categories, id for other screens
                            const isActive = tab.scriptTypeId
                                ? activeTab?.scriptTypeId === tab.scriptTypeId
                                : activeTab?.id === tab.id;

                            // Robust name fallback
                            const tabName = tab.name || tab.scriptTypeName || tab.category || tab.category_name || tab.title || (typeof tab === 'string' ? tab : "");

                            return (
                                <TouchableOpacity
                                    key={tab.id || tab.scriptTypeId || index}
                                    style={[
                                        styles.tabItem,
                                        isActive
                                            ? (type === "primary" ? styles.activePrimaryTab : styles.activeSecondaryTab)
                                            : (type === "primary" ? styles.inactivePrimaryTab : null)
                                    ]}
                                    onPress={() => {
                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                        onTabChange?.(tab);
                                    }}
                                >
                                    <Text style={[
                                        styles.tabText,
                                        isActive
                                            ? (type === "primary" ? styles.activePrimaryTabText : styles.activeSecondaryTabText)
                                            : (type === "primary" ? styles.inactivePrimaryTabText : null)
                                    ]}>
                                        {tabName}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* FILTER BUTTON */}
                    {showFilter && (
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
                    )}
                </View>
            </View>
            {!hideShadow && (
                <LinearGradient
                    colors={[global.colors.overlayLow, 'transparent']}
                    style={styles.bottomShadow}
                />
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

export default GlobalTopMenu;

const styles = StyleSheet.create({
    wrapper: {
        position: "relative",
        marginBottom: 5,
    },
    topSliders: {
        backgroundColor: global.colors.background,
        zIndex: 2,
        paddingTop: 6,
        paddingHorizontal: 0,
        // iOS shadow (Android ignores)
        shadowColor: global.colors.textPrimary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        // borderBottomWidth: 1,
        // borderBottomColor: global.colors.overlayLow,
    },
    noShadow: {
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
    },
    bottomShadow: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: -15,
        height: 3,
        zIndex: 1,
    },
    mainContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tabScroll: {
        flex: 1,
    },
    tabScrollContent: {
        paddingLeft: 16,
        paddingRight: 16,
        paddingVertical: 5,
        alignItems: 'center',
    },
    tabItem: {
        paddingVertical: 7,
        paddingHorizontal: 16,
        borderRadius: 40,
        marginRight: 8,
    },
    activePrimaryTab: {
        backgroundColor: global.colors.secondary,
        elevation: 7,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    inactivePrimaryTab: {
        backgroundColor: global.colors.background,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    activeSecondaryTab: {
        backgroundColor: global.colors.primary  ,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 18,
        elevation: 3,
        shadowColor: global.colors.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '500',
        fontFamily: "Poppins-Medium",
        color: global.colors.textSecondary,
    },
    activePrimaryTabText: {
        color: global.colors.background,
        fontWeight: "500",
    },
    inactivePrimaryTabText: {
        color: global.colors.secondary,
    },
    activeSecondaryTabText: {
        color: global.colors.textPrimary,
        fontWeight: "500",
    },
    filterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderLeftWidth: 1,
        borderLeftColor: global.colors.border,
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
