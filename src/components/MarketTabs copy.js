import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const MarketTabs = ({ Pointer, onExchangeChange, onCategoryChange, tabs = ['Indices', 'Market Cap', 'Sectors'], selectedExchange, activeTab: controlledActiveTab, initialActiveTab = null }) => {
    const [exchange, setExchange] = useState(selectedExchange || 'NSE');

    // Sync if selectedExchange prop changes
    React.useEffect(() => {
        if (selectedExchange) setExchange(selectedExchange);
    }, [selectedExchange]);

    const [internalActiveTab, setInternalActiveTab] = useState(initialActiveTab); // No tab selected by default

    // Use controlled activeTab if provided, otherwise use internal state
    const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

    const handleExchangeToggle = (exch) => {
        setExchange(exch);
        onExchangeChange && onExchangeChange(exch);
    };
    const handleTabPress = (tab) => {
        if (controlledActiveTab === undefined) {
            setInternalActiveTab(tab);
        }
        onCategoryChange && onCategoryChange(tab);
    };

    // const tabs = ['Indices', 'Sectors', 'Industries', 'Themes'];

    return (
        <View style={styles.container}>
            {/* Exchange Toggle (NSE | BSE) */}
            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[styles.toggleButton, exchange === 'NSE' && styles.activeToggle]}
                    onPress={() => handleExchangeToggle('NSE')}
                >
                    <Text style={[styles.toggleText, exchange === 'NSE' && styles.activeToggleText]}>NSE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleButton, exchange === 'BSE' && styles.activeToggle]}
                    onPress={() => handleExchangeToggle('BSE')}
                >
                    <Text style={[styles.toggleText, exchange === 'BSE' && styles.activeToggleText]}>BSE</Text>
                </TouchableOpacity>
            </View>

            {/* Tabs ScrollView */}
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
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F7',
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
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    toggleText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666666',
    },
    activeToggleText: {
        color: '#2F0079',
    },
    tabsScroll: {
        alignItems: 'center',
    },
    tabItem: {
        marginRight: 20,
        paddingVertical: 6,
    },
    activeTabItem: {
        // borderBottomWidth: 2,
        // borderBottomColor: '#2F0079',
        backgroundColor: '#E6E0E9',
        borderRadius: 20,
        paddingVertical: 4,
        paddingHorizontal: 15,
    },
    tabText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#333333',
        fontWeight: '700',
    },
});

export default MarketTabs;
