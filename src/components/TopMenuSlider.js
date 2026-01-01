import React from "react";
import { Text, StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons"; // for the arrow icon
import Octicons from '@expo/vector-icons/Octicons';
import { useNavigation, useRoute } from "@react-navigation/native";

const TopMenuSlider = ({ currentRoute: propCurrentRoute }) => {
    const navigation = useNavigation();
    const route = useRoute();

    const currentRoute = propCurrentRoute || route.name;
    // Function to determine if a tab is active
    const isActiveTab = (tabName) => {

        if (!currentRoute) {
            return false; // Return false if curr
        }
        // Map route names to tab names
        const routeToTabMap = {
            'Home': 'Home',
            'TradeOrderList': 'Watchlists',
            // 'TradeOrder': 'Watchlists',
            'Learning': 'Learning',
            'LearningDetail': 'Learning',
            'ChapterScreen': 'Learning',
            'ChapterDetails': 'Learning',
            'NewsScreen': 'NewsScreen',
            'OrdersScreen': 'OrdersScreen',
            'TradeScreen': 'TradeScreen',
            'Stocks': 'Stocks',
        };

        return routeToTabMap[currentRoute] === tabName;
    };

    // Function to handle tab press
    const handleTabPress = (tabName) => {
        switch (tabName) {
            case 'Home':
                navigation.navigate('Home');
                break;
            case 'Stocks':
                navigation.navigate('Stocks', {
                    defaultTab: 'All'
                });
                break;
            case 'Watchlists':
                navigation.navigate('TradeOrderList');
                break;
            case 'Learning':
                navigation.navigate('Learning');
                break;
            case 'NewsScreen':
                navigation.navigate('NewsScreen');
                break;
            case 'OrdersScreen':
                navigation.navigate('OrdersScreen');
                break;
            case 'TradeScreen':
                navigation.navigate('TradeScreen');
                break;
            default:
                break;
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                {/* Home */}
                <TouchableOpacity
                    style={[
                        styles.tabWhite,
                        isActiveTab('Home') && styles.activeTab
                    ]}
                    onPress={() => handleTabPress('Home')}
                >
                    <Text style={[
                        styles.tabTextDark,
                        isActiveTab('Home') && styles.activeTabText
                    ]}>
                        Home
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tabWhite,
                        isActiveTab('Stocks') && styles.activeTab
                    ]}
                    onPress={() => handleTabPress('Stocks')}
                >
                    <Text style={[
                        styles.tabTextDark,
                        isActiveTab('Stocks') && styles.activeTabText
                    ]}>
                        Stocks
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        isActiveTab('Watchlists') && styles.tabButtonActive
                    ]}
                    onPress={() => handleTabPress('Watchlists')}
                >
                    <Text
                        style={[
                            styles.tabButtonText,
                            isActiveTab('Watchlists') && styles.tabButtonTextActive
                        ]}
                    >
                        Watchlists
                    </Text>

                    {/* Full-height divider */}
                    {/* <View
                        style={[
                            styles.divider,
                            {
                                backgroundColor: isActiveTab('Watchlists')
                                    ? "#fff"
                                    : "rgba(33,15,71,0.25)"
                            }
                        ]}
                    /> */}

                    {/* <Octicons
                        name="triangle-right"
                        size={15}
                        color={isActiveTab('Watchlists') ? "#fff" : "#210F47"}
                    /> */}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tabWhite,
                        isActiveTab('Learning') && styles.activeTab
                    ]}
                    onPress={() => handleTabPress('Learning')}
                >
                    <Text style={[
                        styles.tabTextDark,
                        isActiveTab('Learning') && styles.activeTabText
                    ]}>
                        Learning
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tabWhite,
                        isActiveTab('NewsScreen') && styles.activeTab
                    ]}
                    onPress={() => handleTabPress('NewsScreen')}
                >
                    <Text style={[
                        styles.tabTextDark,
                        isActiveTab('NewsScreen') && styles.activeTabText
                    ]}>
                        News
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: "#fff",
        paddingTop: 6,
    },
    activeTab: {
        backgroundColor: "#210F47",
        shadowColor: "#210F47",
        shadowOpacity: 0.3,
    },
    activeTabText: {
        color: "#fff",
    },
    scrollContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 6,
    },
    tabWhite: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 40,
        paddingVertical: 5,
        paddingHorizontal: 16,
        marginRight: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 1.5,
        elevation: 2,
    },
    tabTextDark: {
        color: "#210F47",
        fontSize: 12,
        fontFamily: "Poppins-Medium",
        fontWeight: "500",
    },
    tabTextLight: {
        color: "#fff",
        fontSize: 12,
        fontFamily: "Poppins-Medium",
        fontWeight: "500",
    },

    tabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',  // default background white
        paddingHorizontal: 16,
        paddingVertical: 5,
        borderRadius: 40,
        marginRight: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 1.5,
        elevation: 2,
    },
    tabButtonActive: {
        backgroundColor: '#210F47', // purple when active
    },
    tabButtonText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#210F47',
        fontFamily: "Poppins-Medium"
    },
    tabButtonTextActive: {
        color: '#fff',
    },
    divider: {
        width: 1.2,
        backgroundColor: '#fff',
        marginHorizontal: 10,
        alignSelf: "stretch",
    },

    // Watchlist combined button
    watchlistWrapper: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 8,
    },
    watchlistLeft: {
        backgroundColor: "#210F47",
        borderTopLeftRadius: 40,
        borderBottomLeftRadius: 40,
        paddingVertical: 5,
        paddingHorizontal: 14,
    },
    watchlistRight: {
        backgroundColor: "#210F47",
        borderTopRightRadius: 40,
        borderBottomRightRadius: 40,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginLeft: 1,
    },
    activeWatchlistLeft: {
        backgroundColor: "#fff",
    },
    activeWatchlistLeft: {
        backgroundColor: "#fff",
    },
});

export default TopMenuSlider;
