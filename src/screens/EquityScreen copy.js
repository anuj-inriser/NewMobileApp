import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Platform,
    TouchableOpacity
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import TopMenuSlider from '../components/TopMenuSlider';
// import TopHeader from '../components/TopHeader';
import { useAuth } from '../context/AuthContext';
// import BottomTabBar from '../components/BottomTabBar';
import MarketTabs from '../components/MarketTabs';
import Indices from '../components/Indices';
import { apiUrl } from '../utils/apiUrl';

export default function EquityScreen({ navigation }) {
    const route = useRoute();
    const { clientId, authToken, feedToken, refreshToken } = useAuth();

    const [selectedExchange, setSelectedExchange] = useState('NSE');
    const [selectedCategory, setSelectedCategory] = useState('Indices'); // Default to Indices
    const [showPreview, setShowPreview] = useState(true); // Show preview initially

    // Fetch indices data using React Query
    const fetchIndices = async () => {
        // Use localhost for Web to avoid Network Failure with IP
        const baseUrl = apiUrl;

        const response = await fetch(`${baseUrl}/api/indices`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
            return result.data;
        } else {
            throw new Error('Invalid response format');
        }
    };

    const { data: allData = [], isLoading: loading, error, refetch } = useQuery({
        queryKey: ['indices'],
        queryFn: fetchIndices
    });

    const handleExchangeChange = (exchange) => {
        setSelectedExchange(exchange);
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setShowPreview(false); // Disable preview when user clicks a tab
    };

    const handleViewAllIndices = () => {
        // Switch to Indices tab to show full list
        setSelectedCategory('Indices');
        setShowPreview(false); // Disable preview to show full list in vertical format
    };

    const handleIndexPress = (index) => {
        // Navigate to Stocks screen and show all stocks in this index
        navigation.navigate('Stocks', {
            exchange: selectedExchange,
            filterIndex: index.symbol || index.name, // Pass index symbol to filter stocks
        });
    };

    // Derived state for filtering
    const getDataForCategory = () => {
        if (!allData.length) return [];

        // Filter by exchange first (NSE/BSE)
        const exchangeData = allData.filter(item =>
            !item.exchange || item.exchange === selectedExchange
        );

        if (selectedCategory === 'Indices') {
            return exchangeData.filter(i => {
                const type = i.type ? i.type.toLowerCase() : '';
                return type === 'index';
            });
        }
        else if (selectedCategory === 'Market Cap') {
            return exchangeData.filter(i => {
                const type = i.type ? i.type.toLowerCase() : '';
                const match = type === 'market cap';
                if (!match && i.type && i.type.includes('Market')) console.log('Failed match:', i.type, type);
                return match;
            });
        }
        else if (selectedCategory === 'Sectors') {
            return exchangeData.filter(i => i.type && i.type.toLowerCase() === 'sector');
        }
        else if (selectedCategory === 'Themes') {
            return exchangeData.filter(i => i.type && i.type.toLowerCase() === 'theme');
        }

        // For Industries etc, return empty or implement mapping
        return [];
    };

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.placeholderContainer}>
                    <ActivityIndicator size="large" color="#2F0079" />
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.placeholderContainer}>
                    <Text style={styles.errorText}>⚠️ {error.message}</Text>
                    <Text style={styles.errorSubtext}>
                        Please check your network connection and try again
                    </Text>
                    <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        const data = getDataForCategory();

        if (['Indices', 'Sectors', 'Market Cap', 'Themes'].includes(selectedCategory)) {
            return (
                <Indices
                    exchange={selectedExchange}
                    viewMode={showPreview ? "horizontal" : "vertical"} // Horizontal for preview, vertical for full list
                    onViewAllPress={handleViewAllIndices}
                    onIndexPress={handleIndexPress}
                    externalData={data}
                    maxItems={showPreview ? 5 : undefined}
                />
            );
        }

        return (
            <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>{selectedCategory} content coming soon...</Text>
            </View>
        );


    };

    return (
        <>
            <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: "#fff" }}>
                {/* <TopHeader /> */}
                <TopMenuSlider currentRoute={route.name} />

                <MarketTabs
                    onExchangeChange={handleExchangeChange}
                    onCategoryChange={handleCategoryChange}
                    activeTab={selectedCategory}
                />

                <View style={styles.content}>
                    {renderContent()}
                </View>

            </SafeAreaView>
            {/* <BottomTabBar /> */}
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
    },
    placeholderText: {
        fontSize: 16,
        color: '#888',
        fontWeight: '500',
    },
    errorText: {
        fontSize: 18,
        color: '#ef4444',
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    errorSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
        paddingHorizontal: 32,
    },
    retryButton: {
        backgroundColor: '#2F0079',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
