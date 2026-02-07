import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

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

    const [exchange, setExchange] = useState(null);
    const [internalActiveTab, setInternalActiveTab] = useState(initialActiveTab);
    const [isReady, setIsReady] = useState(false);

    // 🔥 Restore exchange BEFORE rendering (no flicker)
    useEffect(() => {
        const restoreExchange = async () => {
            try {
                const savedExchange = await AsyncStorage.getItem(EXCHANGE_KEY);

                if (savedExchange) {
                    setExchange(savedExchange);
                    onExchangeChange && onExchangeChange(savedExchange);
                } else {
                    const fallback = selectedExchange || 'NSE';
                    setExchange(fallback);
                    onExchangeChange && onExchangeChange(fallback);
                }
            } catch {
                const fallback = selectedExchange || 'NSE';
                setExchange(fallback);
                onExchangeChange && onExchangeChange(fallback);
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
        setExchange(exch);
        onExchangeChange && onExchangeChange(exch);
        try {
            await AsyncStorage.setItem(EXCHANGE_KEY, exch);
        } catch { }
    };

    const handleTabPress = (tab) => {
        if (controlledActiveTab === undefined) {
            setInternalActiveTab(tab);
        }
        onCategoryChange && onCategoryChange(tab);
    };

    // ⛔ Prevent render until exchange is resolved
    if (!isReady || !exchange) return null;

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
        marginBottom: 10,
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
        shadowRadius: 2,
    },
    bottomShadow: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: -5,
        height: 1,
        zIndex: 1,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: global.colors.surface,
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
    },
    tabItem: {
        marginRight: 20,
        paddingVertical: 6,
    },
    activeTabItem: {
        backgroundColor: global.colors.surface,
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 16,
        elevation: 4,
        shadowColor: global.colors.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 3,
    },
    tabText: {
        fontSize: 14,
        color: global.colors.textSecondary,
        fontWeight: '500',
    },
    activeTabText: {
        color: global.colors.textPrimary,
        fontWeight: '700',
    },
});

export default MarketTabs;