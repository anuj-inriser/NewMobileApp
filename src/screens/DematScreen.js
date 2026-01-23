import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Modal,
    Platform,
    Alert,
    Animated,
    Pressable
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';   // ⭐ ADD
import { usePermission } from '../hooks/usePermission';

// Keys for AsyncStorage
const TOKENS = {
    AUTH_TOKEN: '@angelone_auth_token',
    FEED_TOKEN: '@angelone_feed_token',
    REFRESH_TOKEN: '@angelone_refresh_token',
    CLIENT_ID: '@angelone_client_id',
};

export default function DematScreen({ navigation }) {
    const [showAngelOneModal, setShowAngelOneModal] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const { setAuthData } = useAuth();   // ⭐ MAIN FIX

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

    const canViewEquity = usePermission("VIEW_EQUITY")

    const angelOneUrl =
        'https://smartapi.angelone.in/publisher-login?api_key=IG8g0BMf&state=statevariable';

    const handleWebViewNavigation = async (navState) => {
        const { url } = navState;

        // Check if redirect URL contains tokens
        if (url.includes('auth_token=') && url.includes('feed_token=')) {
            try {
                const urlObj = new URL(url);

                const auth_token = urlObj.searchParams.get('auth_token');
                const feed_token = urlObj.searchParams.get('feed_token');
                const refresh_token = urlObj.searchParams.get('refresh_token');

                if (!auth_token || !feed_token) {
                    throw new Error('Missing tokens in redirect');
                }

                // 🔥 Save tokens locally
                await AsyncStorage.setItem(TOKENS.AUTH_TOKEN, auth_token);
                await AsyncStorage.setItem(TOKENS.FEED_TOKEN, feed_token);
                await AsyncStorage.setItem(TOKENS.REFRESH_TOKEN, refresh_token);

                let clientId = null;

                // Extract clientId from JWT
                try {
                    const payload = JSON.parse(atob(auth_token.split('.')[1]));
                    clientId = payload.username;

                    await AsyncStorage.setItem(TOKENS.CLIENT_ID, clientId);
                } catch (err) {
                    console.warn('⚠️ Could not decode JWT for clientId');
                }

                await setAuthData({
                    authToken: auth_token,
                    feedToken: feed_token,
                    refreshToken: refresh_token,
                    clientId: clientId,
                });

                Alert.alert('Success', 'Angel One login successful!');

                // setShowAngelOneModal(false);
                navigation.navigate('App', { screen: 'Equity' });
            } catch (err) {
                console.error('❌ Token save failed:', err);
                Alert.alert('Error', 'Login succeeded but token save failed.');
            }
        }

        // Cancel / Error
        if (
            url.includes('cancel=true') ||
            (url.includes('/login') && url.includes('error='))
        ) {
            console.warn('Login cancelled or failed');
            // setShowAngelOneModal(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Image
                    source={require('../../assets/demat.png')}
                    style={styles.image}
                    resizeMode="contain"
                />
                <Text style={styles.title}>Connect your existing broker.</Text>

                <View style={styles.dotsContainer}>
                    <TouchableOpacity onPress={() => setShowAngelOneModal(true)}>
                        <Image
                            source={require('../../assets/angelone.png')}
                            style={styles.brokerIcon}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                    <Image
                        source={require('../../assets/grow.png')}
                        style={styles.brokerIcon}
                        resizeMode="contain"
                    />
                    <Image
                        source={require('../../assets/zerodha.png')}
                        style={styles.brokerIcon}
                        resizeMode="contain"
                    />
                    <Image
                        source={require('../../assets/book.png')}
                        style={styles.brokerIcon}
                        resizeMode="contain"
                    />
                </View>

                <Text style={styles.disclaimer}>
                    You can securely connect your existing broker accounts,{' '}
                    <Text style={{ fontWeight: '700' }}>we do not charge you for trades</Text>{' '}
                    taken through this application. Trades happen securely through your broker
                    account only.
                </Text>

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.nextBtn}
                        onPress={() => {
                            if (!canViewEquity) {
                                setShowUpgradeModal(true)
                                return;
                            }
                            navigation.navigate('App', { screen: 'Equity' })
                        }}
                    >
                        <Text style={styles.nextText}>Let's Drive in</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* AngelOne Login Modal */}
            <Modal
                visible={showAngelOneModal}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowAngelOneModal(false)}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setShowAngelOneModal(false)}
                    >
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>

                    <WebView
                        source={{ uri: angelOneUrl }}
                        style={styles.webview}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        useWebKit={true}
                        onNavigationStateChange={handleWebViewNavigation}
                        onError={(e) => {
                            console.error('WebView error:', e.nativeEvent);
                            Alert.alert('Error', 'Failed to load Angel One login.');
                        }}
                    />
                </View>
            </Modal>

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
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scroll: { padding: 24, alignItems: 'center' },
    image: { width: '100%', height: 250, marginTop: 100 },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#210F47',
        marginVertical: 10,
        alignSelf: 'flex-start',
    },
    brokerIcon: {
        width: 35,
        height: 35,
        marginHorizontal: 8,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        width: '100%',
        marginTop: 20,
    },
    nextBtn: {
        backgroundColor: '#210F47',
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 25,
    },
    nextText: { color: '#fff', fontWeight: '600' },
    disclaimer: {
        fontSize: 12,
        color: '#444',
        textAlign: 'left',
        lineHeight: 18,
    },
    modalContainer: { flex: 1, backgroundColor: '#fff' },
    closeButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        right: 20,
        zIndex: 10,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    webview: {
        flex: 1,
        marginTop: Platform.OS === 'ios' ? 60 : 40,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },

    modalBox: {
        width: "80%",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        alignItems: "center",
    },

    modalTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#210F47",
        marginBottom: 8,
    },

    modalMessage: {
        fontSize: 13,
        color: "#555",
        textAlign: "center",
        marginBottom: 20,
    },

    modalButton: {
        backgroundColor: "#210F47",
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
    },

    modalButtonText: {
        color: "#fff",
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
