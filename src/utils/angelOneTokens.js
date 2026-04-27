// src/utils/angelOneTokens.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ANGEL_ONE_API_KEY = process.env.EXPO_PUBLIC_ANGEL_ONE_API_KEY || 'IG8g0BMf';

export const ANGEL_ONE_STORAGE_KEYS = {
  AUTH_TOKEN: '@angelone_auth_token',
  FEED_TOKEN: '@angelone_feed_token',
  REFRESH_TOKEN: '@angelone_refresh_token',
  CLIENT_ID: '@angelone_client_id',
};

export const getAngelOneLoginUrl = (state) =>
  `https://smartapi.angelone.in/publisher-login?api_key=${ANGEL_ONE_API_KEY}&state=${state}`;

export const getAngelOneTokens = async () => {
  try {
    const [auth, feed, refresh, clientId] = await Promise.all([
      AsyncStorage.getItem(ANGEL_ONE_STORAGE_KEYS.AUTH_TOKEN),
      AsyncStorage.getItem(ANGEL_ONE_STORAGE_KEYS.FEED_TOKEN),
      AsyncStorage.getItem(ANGEL_ONE_STORAGE_KEYS.REFRESH_TOKEN),
      AsyncStorage.getItem(ANGEL_ONE_STORAGE_KEYS.CLIENT_ID),
    ]);
    return {
      authToken: auth,
      feedToken: feed,
      refreshToken: refresh,
      clientId,
      isAuthenticated: !!auth && !!feed,
    };
  } catch (e) {
    console.error('Token retrieval failed', e);
    return { authToken: null, feedToken: null, refreshToken: null, clientId: null, isAuthenticated: false };
  }
};

export const clearAngelOneTokens = async () => {
  await AsyncStorage.multiRemove(Object.values(ANGEL_ONE_STORAGE_KEYS));
};
