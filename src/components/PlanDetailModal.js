import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const PlanDetailModal = ({ visible, plan, onClose, onSelect }) => {
  if (!plan) return null;

  const planPrice = Number(plan?.planPrice || 0);
  const specialDiscount = Number(plan?.specialDiscount || 0);
  const discountedPrice = Math.max(0, planPrice - specialDiscount);
  const colors = global.colors || {
    secondary: '#210F47',
    warning: '#FF9F3F',
    textPrimary: '#333333',
    textSecondary: '#666666',
    background: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.6)',
    border: '#E5E7EB',
    success: '#22C55E'
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(plan.id);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.container}>
          {/* Header */}
          <LinearGradient
            colors={[colors.secondary, colors.background]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.headerTitle}>{plan.title}</Text>
                <Text style={styles.headerSubtitle}>Full Plan Details</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>


            {/* Price Block */}
            <View style={styles.priceContainer}>
              <View>
                <Text style={styles.priceLabel}>TOTAL AMOUNT</Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.newPrice, { color: colors.secondary }]}>₹{discountedPrice}</Text>
                  {specialDiscount > 0 && (
                    <Text style={styles.oldPrice}>₹{planPrice}</Text>
                  )}
                </View>
              </View>

            </View>

            <View style={styles.divider} />

            {/* Benefits Content */}
            <Text style={[styles.sectionHeading, { color: colors.secondary }]}>Plan Benefits</Text>

            <View style={styles.descriptionBox}>
              <Text style={[styles.descriptionText, { color: colors.textPrimary }]}>
                {plan.description}
              </Text>
            </View>

            {/* Extra padding for scroll */}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const FeatureItem = ({ text, color }) => (
  <View style={styles.featureItem}>
    <Ionicons name="checkmark-circle" size={20} color={color} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: global.colors?.overlay || 'rgba(0,0,0,0.6)',
  },
  container: {
    width: width * 0.9,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '85%',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 6,
    borderRadius: 20,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  validityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  validityText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'Poppins',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    transform: [{ rotate: '2deg' }],
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'Poppins',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newPrice: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Poppins',
  },
  oldPrice: {
    fontSize: 16,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginLeft: 10,
    fontFamily: 'Poppins',
    marginTop: 4,
  },
  savingsBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  savingsText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'Poppins',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Poppins',
    marginBottom: 12,
  },
  descriptionBox: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Poppins',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureText: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 10,
    lineHeight: 20,
    flex: 1,
    fontFamily: 'Poppins',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionBtn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 10,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
});

export default PlanDetailModal;
