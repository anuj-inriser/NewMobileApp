import React from 'react';
import { View, Text, TouchableOpacity, Share, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

const CouponCodeSection = ({
  couponCode,
  isSelected,
}) => {
  const handleCopy = async () => {
    try {
      await Share.share({
        message: couponCode,
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to share coupon code.');
    }
  };

  return (
    <View style={styles.couponCodeRow}>
      <Text style={[styles.couponCode, isSelected && styles.couponCodeSelected]}>
        {couponCode}
      </Text>
      <TouchableOpacity onPress={handleCopy} activeOpacity={0.7} style={styles.copyBtn}>
        <Ionicons
          name="copy-outline"
          size={16}
          color={isSelected ? COLORS.accent : COLORS.greyMid}
        />
      </TouchableOpacity>
    </View>
  );
};

const OfferCard = ({
  offer,
  isSelected,
  onApply,
  loading,
  statusMessage,
  isError
}) => (
  <View style={[styles.card, isSelected && styles.cardSelected]}>
    <Text style={styles.cardTitle}>{offer.title}</Text>
    <Text style={styles.cardSubtitle}>{offer.subtitle}</Text>

    <View style={styles.cardBottomRow}>
      <CouponCodeSection couponCode={offer.couponCode} isSelected={isSelected} />

      <TouchableOpacity
        onPress={onApply}
        activeOpacity={0.8}
        style={[styles.applyBtn, isSelected && styles.applyBtnSelected]}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Text style={[styles.applyBtnText, isSelected && styles.applyBtnTextSelected]}>
            Apply Coupon
          </Text>
        )}
      </TouchableOpacity>
    </View>

    {statusMessage ? (
      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, isError ? styles.errorText : styles.successText]}>
          {isError ? '❌ ' : '🎉 '}
          {statusMessage}
        </Text>
      </View>
    ) : null}
  </View>
);

export default OfferCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    backgroundColor: COLORS.white,
  },
  cardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.white,
  },
  cardTitle: {
    fontFamily: 'Poppins',
    fontWeight: '700',
    fontSize: 16,
    color: '#333333',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  couponCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  couponCode: {
    fontFamily: 'Poppins',
    fontWeight: '700',
    fontSize: 16,
    color: COLORS.greyMid,
    letterSpacing: 0.5,
  },
  couponCodeSelected: {
    color: COLORS.accent,
  },
  copyBtn: {
    padding: 2,
  },
  applyBtn: {
    backgroundColor: COLORS.greyMid,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnSelected: {
    backgroundColor: COLORS.accent,
  },
  applyBtnText: {
    fontFamily: 'Poppins',
    fontWeight: '500',
    fontSize: 13,
    color: COLORS.white,
    textAlign: 'center',
  },
  applyBtnTextSelected: {
    color: COLORS.white,
  },
  statusContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statusText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
  },
  errorText: {
    color: '#D32F2F',
  },
  successText: {
    color: '#22C55E',
  },
});
