import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, UIManager, LayoutAnimation } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

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

    const [exchange, setExchange] = useState(selectedExchange || 'NSE');
    const [internalActiveTab, setInternalActiveTab] = useState(initialActiveTab);
    const [isReady, setIsReady] = useState(false);

    // 🔥 Restore exchange BEFORE rendering (no flicker)
    useEffect(() => {
        const restoreExchange = async () => {
            try {
                const savedExchange = await AsyncStorage.getItem(EXCHANGE_KEY);

                if (savedExchange && savedExchange !== exchange) {
                    setExchange(savedExchange);
                    onExchangeChange && onExchangeChange(savedExchange);
                }
            } catch {
                // Keep initial state
            } finally {
                setIsReady(true);
            }
        };

        restoreExchange();
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
                {/* Exchange Toggle */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, exchange === 'NSE' && styles.activeToggle]}
                        onPress={() => handleExchangeToggle('NSE')}
                    >
                        <Text style={[styles.toggleText, exchange === 'NSE' && styles.activeToggleText]}>
                            NSE
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.toggleButton, exchange === 'BSE' && styles.activeToggle]}
                        onPress={() => handleExchangeToggle('BSE')}
                    >
                        <Text style={[styles.toggleText, exchange === 'BSE' && styles.activeToggleText]}>
                            BSE
                        </Text>
                    </TouchableOpacity>
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
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: global.colors.primary,
        borderRadius: 20,
        padding: 2,
        marginRight: 16,
    },
    toggleButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 18,
    },
    activeToggle: {
        backgroundColor: global.colors.background,
        elevation: 2,
        shadowColor: global.colors.textPrimary,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    toggleText: {
        fontSize: 12,
        fontWeight: '600',
        color: global.colors.textSecondary,
    },
    activeToggleText: {
        color: global.colors.secondary,
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