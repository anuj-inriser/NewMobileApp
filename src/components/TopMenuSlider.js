import { Text, StyleSheet, View, ScrollView, TouchableOpacity, Modal, Pressable, Animated, Image, Platform, UIManager, LayoutAnimation } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons"; // for the arrow icon
import { useState, useRef, useEffect } from "react";

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
import Octicons from '@expo/vector-icons/Octicons';
import { useNavigation, useRoute, useNavigationState } from "@react-navigation/native";
import { usePermission } from "../hooks/usePermission";



const TopMenuSlider = ({ currentRoute: propCurrentRoute }) => {
    const canViewNews = usePermission("VIEW_NEWS");
    const canViewLearning = usePermission("VIEW_LEARNING");
    const canViewWatchlist = usePermission("VIEW_WATCHLIST")
    const canViewEquity = usePermission("VIEW_EQUITY")

    const navigation = useNavigation();
    const route = useRoute();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    useEffect(() => {
        if (showUpgradeModal) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                friction: 6,     // lower = more bounce
                tension: 80,
            }).start();
        } else {
            scaleAnim.setValue(0.8);
        }
    }, [showUpgradeModal]);


    // Automatically detect the active route from the navigation state for highlighting
    const currentActiveRoute = useNavigationState(state => {
        if (!state) return null;
        let r = state.routes[state.index];
        while (r && r.state) {
            r = r.state.routes[r.state.index];
        }
        return r?.name;
    });

    const currentRoute = propCurrentRoute || currentActiveRoute || route.name;
    // Function to determine if a tab is active
    const isActiveTab = (tabName) => {
        if (!currentRoute) {
            return false; // Return false if curr
        }
        // Map route names to tab names
        const routeToTabMap = {
            'Equity': 'Equity',
            'EquityHome': 'Equity',
            'TradeOrderList': 'Watchlists',
            'Learning': 'Learning',
            'LearningDetail': 'Learning',
            'ChapterScreen': 'Learning',
            'ChapterDetails': 'Learning',
            'NewsScreen': 'NewsScreen',
            'OrdersScreen': 'OrdersScreen',
            'Trade': 'TradeScreen',
        };
        return routeToTabMap[currentRoute] === tabName;
    };

    // Function to handle tab press
    const handleTabPress = (tabName) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        switch (tabName) {
            case 'Equity':
                if (!canViewEquity) {
                    setShowUpgradeModal(true)
                    return;
                }
                navigation.navigate('MainTabs', { screen: 'Equity' });
                break;
            case 'Watchlists':
                if (!canViewWatchlist) {
                    setShowUpgradeModal(true)
                    return;
                }
                navigation.navigate('MainTabs', { screen: 'TradeOrderList' });
                break;
            case 'Learning':
                if (!canViewLearning) {
                    setShowUpgradeModal(true)
                    return;
                }
                navigation.navigate('MainTabs', {
                    screen: 'Learning'
                });
                break;
            case 'NewsScreen':
                if (!canViewNews) {
                    setShowUpgradeModal(true);
                    return;
                }

                navigation.navigate('App', {
                    screen: 'MainTabs',
                    params: { screen: 'NewsScreen' }
                });
                break;

            case 'OrdersScreen':
                navigation.navigate('App', {
                    screen: 'MainTabs',
                    params: { screen: 'OrdersScreen' }
                });
                break;
            case 'TradeScreen':
                navigation.navigate('App', {
                    screen: 'MainTabs',
                    params: { screen: 'Trade' }
                });
                break;
            default:
                break;
        }
    };

    return (
        <>

            <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContainer}
                >
                    {/* Equity */}
                    <TouchableOpacity
                        style={[
                            styles.tabWhite,
                            isActiveTab('Equity') && styles.activeTab
                        ]}
                        onPress={() => handleTabPress('Equity')}
                    >
                        <Text style={[
                            styles.tabTextDark,
                            isActiveTab('Equity') && styles.activeTabText
                        ]}>
                            Equity
                        </Text>
                    </TouchableOpacity>

                    {/* <TouchableOpacity
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
                </TouchableOpacity> */}

                    <TouchableOpacity
                        style={[
                            styles.tabWhite,
                            isActiveTab('Watchlists') && styles.activeTab
                        ]}
                        onPress={() => handleTabPress('Watchlists')}
                    >
                        <Text
                            style={[
                                styles.tabTextDark,
                                isActiveTab('Watchlists') && styles.activeTabText
                            ]}
                        >
                            Watchlists
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.tabWhite,
                            isActiveTab('Learning') && styles.activeTab
                        ]}
                        onPress={() => handleTabPress('Learning')}
                    >
                        <Text
                            style={[
                                styles.tabTextDark,
                                isActiveTab('Learning') && styles.activeTabText
                            ]}
                        >
                            Learning
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>

            <Modal
                transparent
                animationType="fade"
                visible={showUpgradeModal}
                onRequestClose={() => setShowUpgradeModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View
                        style={[
                            styles.modalBox,
                            { transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        <View style={styles.successIcon}>
                            <Image
                                source={require("../../assets/redalert.png")}
                                style={styles.alertIconImg}
                            />
                        </View>
                        <Text style={styles.modalTitle}>Upgrade Your Plan</Text>
                        <Text style={styles.modalMessage}>
                            Unlock this feature by upgrading your plan.
                        </Text>

                        <Pressable
                            style={styles.modalButton}
                            onPress={() => setShowUpgradeModal(false)}
                        >
                            <Text style={styles.modalButtonText}>OK</Text>
                        </Pressable>
                    </Animated.View>
                </View>
            </Modal>

        </>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: global.colors.background,
        paddingTop: 6,
    },
    activeTab: {
        backgroundColor: global.colors.secondary,
        elevation: 7,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    activeTabText: {
        color: global.colors.background,
        fontWeight: '500',
    },
    scrollContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    tabWhite: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: global.colors.background,
        borderRadius: 40,
        paddingVertical: 7,
        paddingHorizontal: 16,
        marginRight: 8,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    tabTextDark: {
        color: global.colors.secondary,
        fontSize: 12,
        fontFamily: "Poppins-Medium",
        fontWeight: "500",
    },
    tabTextLight: {
        color: global.colors.background,
        fontSize: 13,
        fontFamily: "Poppins-Medium",
        fontWeight: "500",
    },

    tabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: global.colors.background,  // default background white
        paddingHorizontal: 16,
        paddingVertical: 5,
        borderRadius: 40,
        marginRight: 8,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    tabButtonActive: {
        backgroundColor: global.colors.secondary, // purple when active
    },
    tabButtonText: {
        fontSize: 12,
        fontWeight: '500',
        color: global.colors.secondary,
        fontFamily: "Poppins-Medium"
    },
    tabButtonTextActive: {
        color: global.colors.background,
    },
    divider: {
        width: 1.2,
        backgroundColor: global.colors.background,
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
        backgroundColor: global.colors.secondary,
        borderTopLeftRadius: 40,
        borderBottomLeftRadius: 40,
        paddingVertical: 5,
        paddingHorizontal: 14,
    },
    watchlistRight: {
        backgroundColor: global.colors.secondary,
        borderTopRightRadius: 40,
        borderBottomRightRadius: 40,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginLeft: 1,
    },
    activeWatchlistLeft: {
        backgroundColor: global.colors.background,
    },
    activeWatchlistLeft: {
        backgroundColor: global.colors.background,
    },

    // Modal style
    modalOverlay: {
        flex: 1,
        backgroundColor: global.colors.overlay,
        justifyContent: "center",
        alignItems: "center",
    },

    modalBox: {
        width: "80%",
        backgroundColor: global.colors.background,
        borderRadius: 12,
        padding: 20,
        alignItems: "center",
    },

    modalTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: global.colors.secondary,
        marginBottom: 8,
    },

    modalMessage: {
        fontSize: 13,
        color: global.colors.textSecondary,
        textAlign: "center",
        marginBottom: 20,
    },

    modalButton: {
        backgroundColor: global.colors.secondary,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
    },

    modalButtonText: {
        color: global.colors.background,
        fontSize: 14,
        fontWeight: "500",
    },

    successIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },

    alertIconImg: {
        width: 50,
        height: 50,
        resizeMode: "contain",
    },
});

export default TopMenuSlider;