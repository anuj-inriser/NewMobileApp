import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, UIManager, LayoutAnimation, Modal, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const EXCHANGE_KEY = 'MARKET_SELECTED_EXCHANGE';

const MarketTabs = ({
    Pointer,
    onExchangeChange,
    onCategoryChange,
    tabs = ['Indices', 'Market Cap', 'Sectors'],
    selectedExchange,
    activeTab: controlledActiveTab,
    initialActiveTab = null,
}) => {

    // 🔥 Initialize with NSE or the parent's choice
    const [exchange, setExchange] = useState(selectedExchange || 'NSE');
    const [internalActiveTab, setInternalActiveTab] = useState(initialActiveTab);
    const [isReady, setIsReady] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // 🔥 Sync with parent and ensure NSE is notified on mount if no selection exists
    useEffect(() => {
        if (!selectedExchange && exchange === 'NSE') {
            onExchangeChange && onExchangeChange('NSE');
        }
        setIsReady(true);
    }, []);

    // 🔄 Sync if parent updates selectedExchange
    useEffect(() => {
        if (selectedExchange && selectedExchange !== exchange) {
            setExchange(selectedExchange);
        }
    }, [selectedExchange]);

    const activeTab =
        controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

    // 🔥 Toggle Exchange + persist
    const handleExchangeToggle = async (exch) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExchange(exch);
        setIsDropdownOpen(false);
        onExchangeChange && onExchangeChange(exch);
        try {
            await AsyncStorage.setItem(EXCHANGE_KEY, exch);
        } catch { }
    };

    const handleTabPress = (tab) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (controlledActiveTab === undefined) {
            setInternalActiveTab(tab);
        }
        onCategoryChange && onCategoryChange(tab);
    };

    return (
        <View style={styles.wrapper}>
            <View style={styles.container}>
                {/* Exchange Dropdown */}
                <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <Text style={styles.dropdownButtonText}>{exchange}</Text>
                        <Ionicons 
                            name={isDropdownOpen ? "chevron-up" : "chevron-down"} 
                            size={16} 
                            color={global.colors.secondary} 
                        />
                    </TouchableOpacity>

                    {isDropdownOpen && (
                        <Modal
                            transparent={true}
                            visible={isDropdownOpen}
                            animationType="fade"
                            onRequestClose={() => setIsDropdownOpen(false)}
                        >
                            <Pressable 
                                style={styles.modalOverlay} 
                                onPress={() => setIsDropdownOpen(false)}
                            >
                                <View style={styles.dropdownMenu}>
                                    {['NSE', 'BSE','All'].map((item) => (
                                        <TouchableOpacity
                                            key={item}
                                            style={[
                                                styles.dropdownItem,
                                                exchange === item && styles.activeDropdownItem
                                            ]}
                                            onPress={() => handleExchangeToggle(item)}
                                        >
                                            <Text style={[
                                                styles.dropdownItemText,
                                                exchange === item && styles.activeDropdownItemText
                                            ]}>
                                                {item}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </Pressable>
                        </Modal>
                    )}
                </View>

                {/* Tabs */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsScroll}
                >
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
                            onPress={() => handleTabPress(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
            <LinearGradient
                colors={[global.colors.overlayLow, 'transparent']}
                style={styles.bottomShadow}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: "relative",
        marginBottom: 4,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: global.colors.background,
        zIndex: 2,
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
    dropdownContainer: {
        marginRight: 10,
        zIndex: 1000,
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: global.colors.primary,
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: global.colors.primary
    },
    dropdownButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: global.colors.secondary,
        marginRight: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'flex-start',
        paddingTop: 140, // Adjust based on header height
        paddingLeft: 16,
    },
    dropdownMenu: {
        backgroundColor: global.colors.background,
        borderRadius: 12,
        width: 100,
        padding: 4,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        borderWidth: 1,
        borderColor: global.colors.overlayLow,
    },
    dropdownItem: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    activeDropdownItem: {
        backgroundColor: global.colors.primary,
    },
    dropdownItemText: {
        fontSize: 14,
        color: global.colors.textSecondary,
        fontWeight: '500',
    },
    activeDropdownItemText: {
        color: global.colors.secondary,
        fontWeight: '700',
    },
    tabsScroll: {
        alignItems: 'center',
        paddingHorizontal: 3,
        paddingVertical: 6,
    },
    tabItem: {
        marginRight: 20,
        paddingVertical: 6,
    },
    activeTabItem: {
        backgroundColor: global.colors.primary,
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 16,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    tabText: {
        fontSize: 12,
        color: global.colors.textSecondary,
        fontWeight: '500',
    },
    activeTabText: {
        color: global.colors.textPrimary,
        fontWeight: '500',
    },
});

export default MarketTabs;