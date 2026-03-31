import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
  DeviceEventEmitter,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OfferCard from '../components/OfferCard';
import { useCoupon } from '../context/CouponContext';
import { useAuth } from '../context/AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  primary: '#210F47',
  accent: '#FF9F3F',
  accentLight: '#FFF6EC',
  green: '#22C55E',
  grey: '#666666',
  greyLight: '#F7F7F9',
  greyMid: '#666666',
  white: '#FFFFFF',
  border: '#EAEAEA',
  textDark: '#333333',
};



// ─── Header ───────────────────────────────────────────────────────────────────

const Header = ({ onBack }) => {
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
      </TouchableOpacity>
      <View style={styles.headingContainer}>
        <Text style={styles.headingLine1}>Available</Text>
        <Text style={styles.headingLine2}>Offers</Text>
      </View>
    </View>
  );
};

// ─── OffersScreen ─────────────────────────────────────────────────────────────

import { useSubscriptionPlans } from '../hooks/useSubscriptionPlans';
import { useAlert } from '../context/AlertContext';
import { ActivityIndicator } from 'react-native';

export default function OffersScreen({ isOverlay, onBack, onNavigate, route, params: overlayParams }) {
  const navigation = useNavigation();
  const [selectedId, setSelectedId] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const { userId } = useAuth();
  const { applyCoupon } = useCoupon();
  const { data: backendData, isLoading } = useSubscriptionPlans(userId);

  const activeOffers = backendData?.coupons || [];

  // Extract plan price from params if available
  const params = overlayParams || route?.params || {};
  const orderAmount = params.planPrice || 0;

  const handleApply = async (offer) => {
    setSelectedId(offer.id);
    setIsApplying(true);
    setStatusMessage('');
    setIsError(false);

    try {
      const result = await applyCoupon(offer.couponCode, orderAmount, userId);

      if (result.success) {
        setStatusMessage(`"${offer.couponCode}" applied!`);
        setIsError(false);

        // Brief delay for the user to see the success message before navigating
        setTimeout(() => {
          if (isOverlay && onNavigate) {
            onNavigate('CHECKOUT', { code: offer.couponCode }, true);
          } else {
            navigation.goBack();
          }
        }, 800);
      } else {
        setStatusMessage(result.message);
        setIsError(true);
      }
    } catch (err) {
      setStatusMessage("Something went wrong with the coupon.");
      setIsError(true);
    } finally {
      setIsApplying(false);
    }
  };

  const handleBack = () => {
    if (isOverlay && onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, isOverlay && { backgroundColor: 'transparent' }]} edges={isOverlay ? ['bottom'] : ['top', 'bottom']}>

      <Header onBack={handleBack} />

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 10, fontFamily: 'Poppins', color: COLORS.greyMid }}>Loading Offers...</Text>
        </View>
      ) : activeOffers.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Poppins', color: COLORS.greyMid }}>No active offers available.</Text>
        </View>
      ) : (
        <FlatList
          data={activeOffers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <OfferCard
              offer={item}
              isSelected={selectedId === item.id}
              loading={isApplying && selectedId === item.id}
              onApply={() => handleApply(item)}
              statusMessage={selectedId === item.id ? statusMessage : null}
              isError={selectedId === item.id ? isError : false}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  // ── Header
  headerContainer: {
    flexDirection: "row",
    alignItems: 'left',
    position: 'relative',
    marginBottom: 20,
    marginTop: Platform.OS === 'ios' ? 0 : 20,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headingContainer: {
    flexDirection: "row",
    alignItems: 'left',
    width: '100%',
    paddingLeft: 10,
    marginTop: 50,

  },
  headingLine1: {
    color: COLORS.primary,
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'left',
    paddingRight: 10,
  },
  headingLine2: {
    color: COLORS.accent,
    fontFamily: 'Poppins',
    fontWeight: '800',
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'left',
    marginTop: 2,
  },

  // ── List
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  separator: {
    height: 12,
  },
});
