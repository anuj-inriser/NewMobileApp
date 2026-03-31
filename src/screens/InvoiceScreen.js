import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../context/AuthContext';

const COLORS = {
  primary: '#210F47',
  secondary: '#065F46',
  accent: '#FF9F3F',
  green: '#22C55E',
  grey: '#666666',
  white: '#FFFFFF',
  border: '#EAEAEA',
  textDark: '#333333',
  primaryLight: "#E6E0E9",
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const InvoiceScreen = ({ params, onClose }) => {
  const { userData } = useAuth();
  const { plan, couponDiscount, internal_transaction_id, user_name } = params || {};

  const planPrice = plan?.planPrice || 0;
  const specialDiscount = plan?.specialDiscount || 0;
  const gst = plan?.gst || 0;
  const afterSpecial = planPrice - specialDiscount;
  const mainAmount = (afterSpecial - (couponDiscount || 0)).toFixed(2);
  const total = (parseFloat(mainAmount) + parseFloat(gst)).toFixed(2);
  const [showDetails, setShowDetails] = useState(false);
  const paymentId = params?.payment_id || params?.service_provider_tid || plan?.payment_id || plan?.service_provider_tid || 'N/A';
  const isFailed = params?.status === 'FAILED';
  const viewShotRef = useRef(null);

  const handleDownload = async () => {
    try {
      if (!viewShotRef.current) return;

      // Force show details for capture
      const wasShown = showDetails;
      setShowDetails(true);

      // Give UI a moment to expand
      await new Promise(resolve => setTimeout(resolve, 300));

      // Using captureRef for better native module compatibility
      const uri = await captureRef(viewShotRef, {
        format: "png",
        quality: 0.9,
      });

      const fileName = `Equitty_Receipt_${internal_transaction_id}.png`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.copyAsync({
        from: uri,
        to: fileUri
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Error", "Sharing is not available on this device.");
      }
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Error", "Failed to download receipt.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View ref={viewShotRef} collapsable={false} style={{ backgroundColor: COLORS.white, width: SCREEN_WIDTH }}>
          <LinearGradient
            colors={isFailed ? ['#FEF2F2', '#FFFFFF'] : [COLORS.primaryLight, '#FFFFFF']}
            style={styles.successHeader}
          >
            <View style={[styles.iconContainer, isFailed && { shadowColor: '#EF4444' }]}>
              <Ionicons
                name={isFailed ? "alert-circle" : "checkmark-circle"}
                size={80}
                color={isFailed ? "#EF4444" : COLORS.green}
              />
            </View>
            <Text style={[styles.successTitle, isFailed && { color: '#991B1B' }]}>
              {isFailed ? "Payment Failed" : "Payment Successful!"}
            </Text>
            <Text style={[styles.successSubtitle, isFailed && { color: '#991B1B' }]}>
              {isFailed ? "This transaction could not be completed." : "Your premium subscription is now active."}
            </Text>
          </LinearGradient>

          <View style={styles.invoiceCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.headerRowInner}>
                <Text style={styles.invoiceTitle}>Subscription Receipt</Text>
                <TouchableOpacity onPress={handleDownload} style={styles.downloadBtn}>
                  <Ionicons name="download-outline" size={24} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.divider} />

            <DetailRow label="User Name" value={params?.user_name || userData?.name || 'User'} />
            <DetailRow label="Payment ID" value={paymentId || 'N/A'} />
            <DetailRow label="Transaction ID" value={`#${internal_transaction_id || 'INV-' + Math.floor(Math.random() * 10000)}`} />
            <DetailRow label="Selected Plan" value={plan?.title || 'Premium Plan'} />
            <DetailRow label="Duration" value={plan?.plan_validity || 'N/A'} />
            <DetailRow label="Payment Date" value={params?.created_at ? new Date(params.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />
            <DetailRow label="Payment Gateway" value="Razorpay" />

            <View style={[styles.divider, { backgroundColor: COLORS.primary, height: 1.5, opacity: 0.1, marginTop: 8 }]} />

            <TouchableOpacity
              style={styles.showDetailsBtn}
              onPress={() => setShowDetails(!showDetails)}
              activeOpacity={0.7}
            >
              <Text style={styles.showDetailsText}>Show Full Details</Text>
              <Ionicons
                name={showDetails ? "chevron-up" : "chevron-down"}
                size={18}
                color={COLORS.primary}
              />
            </TouchableOpacity>

            {!showDetails && (
              <View style={{ marginBottom: 10 }} />
            )}

            {showDetails && (
              <View style={styles.detailsContainer}>
                <View style={styles.detailRowSmall}>
                  <Text style={styles.detailLabelSmall}>Main Amount</Text>
                  <Text style={styles.detailValueSmall}>₹{mainAmount}</Text>
                </View>
                <View style={styles.detailRowSmall}>
                  <Text style={styles.detailLabelSmall}>GST (18%)</Text>
                  <Text style={styles.detailValueSmall}>₹{gst.toFixed(2)}</Text>
                </View>
                <View style={[styles.divider, { marginVertical: 8, opacity: 0.05 }]} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount Paid</Text>
                  <Text style={styles.totalValue}>₹{total}</Text>
                </View>
              </View>
            )}

            <View style={styles.footerSpacing} />
            <Text style={styles.copyrightText}>© 2026 Inriser Consulting Private Limited.</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.doneButtonWrapper} onPress={onClose} activeOpacity={0.8}>
          <LinearGradient
            colors={['#3D1C8E', '#210F47']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.doneButton}
          >
            <Text style={styles.doneButtonText}>BACK TO DASHBOARD</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const DetailRow = ({ label, value, color }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, color && { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingBottom: 20,
  },
  successHeader: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  iconContainer: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 2,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  successTitle: {
    fontFamily: 'Poppins',
    fontWeight: '800',
    fontSize: 26,
    color: '#065F46',
    marginBottom: 8,
  },
  successSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 15,
    color: '#065F46',
    opacity: 0.8,
    textAlign: 'center',
  },
  invoiceCard: {
    margin: 24,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  invoiceTitle: {
    fontFamily: 'Poppins',
    fontWeight: '700',
    fontSize: 18,
    color: COLORS.primary,
    flex: 1,
  },
  headerRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
  },
  downloadBtn: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: COLORS.grey,
  },
  detailValue: {
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 14,
    color: COLORS.textDark,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  totalLabel: {
    fontFamily: 'Poppins',
    fontWeight: '700',
    fontSize: 16,
    color: COLORS.primary,
  },
  totalValue: {
    fontFamily: 'Poppins',
    fontWeight: '800',
    fontSize: 24,
    color: COLORS.primary,
  },
  showDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    marginTop: 3,
  },
  showDetailsText: {
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 14,
    color: COLORS.primary,
    marginRight: 6,
  },
  detailsContainer: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
  },
  detailRowSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabelSmall: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: COLORS.grey,
  },
  detailValueSmall: {
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 13,
    color: COLORS.textDark,
  },
  footerSpacing: {
    height: 12,
  },
  copyrightText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    opacity: 0.8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 12,
    color: COLORS.grey,
    lineHeight: 18,
  },
  doneButtonWrapper: {
    marginHorizontal: 24,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  doneButton: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: COLORS.white,
    fontFamily: 'Poppins',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 1.2,
  },
});

export default InvoiceScreen;
