import React, { useState } from 'react';
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
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';   // ⭐ ADD

// Keys for AsyncStorage
const TOKENS = {
  AUTH_TOKEN: '@angelone_auth_token',
  FEED_TOKEN: '@angelone_feed_token',
  REFRESH_TOKEN: '@angelone_refresh_token',
  CLIENT_ID: '@angelone_client_id',
};

export default function DematScreen({ navigation }) {
  const [showAngelOneModal, setShowAngelOneModal] = useState(false);

  const { setAuthData } = useAuth();   // ⭐ MAIN FIX

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

        setShowAngelOneModal(false);
        navigation.navigate('Equity');
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
      setShowAngelOneModal(false);
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
            onPress={() => navigation.navigate('Equity')}
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
    </SafeAreaView>
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
});
