import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import {
  DeviceEventEmitter,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
  ScrollView,
  Platform,
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useSubscriptionPlans } from '../hooks/useSubscriptionPlans';
import { useAlert } from '../context/AlertContext';
import PlanDetailModal from '../components/PlanDetailModal';
import { useCoupon } from '../context/CouponContext';
import axiosInstance from '../api/axios';

// ─── Constants ───────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.88);
const CARD_MARGIN = 8;
const SIDE_INSET = (SCREEN_WIDTH - CARD_WIDTH) / 2 - CARD_MARGIN;

const COLORS = {
  primary: '#210F47',
  accent: '#FF9F3F',
  accentLight: '#FFF6EC',
  green: '#22C55E',
  red: '#D32F2F',
  grey: '#666666',
  greyLight: '#F7F7F9',
  white: '#FFFFFF',
  border: '#EAEAEA',
  textDark: '#121212',
};

// ─── Sub-components ───────────────────────────────────────────────────────────
// ─── Sub-components ───────────────────────────────────────────────────────────
function computeTotals(plan, couponDiscount) {
  const planPrice = plan?.planPrice || 0;
  const specialDiscount = plan?.specialDiscount || 0;

  const afterSpecial = Math.max(0, planPrice - specialDiscount);
  const afterCoupon = Math.max(0, afterSpecial - couponDiscount);

  // Calculate 18% GST on the net amount
  const gst = Math.round(afterCoupon * 0.18);
  const total = afterCoupon + gst;

  return { afterSpecial, afterCoupon, gst, total, discount: couponDiscount };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Header = ({ onBack }) => {
  const navigation = useNavigation();
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
      </TouchableOpacity>
      <View style={styles.headingContainer}>
        <Text style={styles.headingLine1}>Checkout</Text>
      </View>
    </View>
  );
};

const PlanCard = ({ plan, isActive, onShowDetails }) => {
  const displayNewPrice = plan.planPrice - plan.specialDiscount;

  return (
    <View style={[styles.planCard, isActive && styles.planCardActive]}>
      {plan.badge && (
        <View style={styles.cardBadge}>
          <Text style={styles.cardBadgeText}>{plan.badge}</Text>
        </View>
      )}
      <View style={[styles.cardTopRow, plan.badge ? styles.cardTopRowWithBadge : null]}>
        <Text style={styles.cardTitle}>{plan.title}</Text>
        <View style={styles.cardPriceBlock}>
          <Text style={styles.cardOldPrice}>₹{plan.planPrice}</Text>
          <Text style={styles.cardNewPrice}>₹{displayNewPrice}</Text>
        </View>
      </View>

      {plan.plan_validity && (
        <Text style={styles.validityText}>{plan.plan_validity}</Text>
      )}

      <TouchableOpacity
        style={styles.detailsIconContainer}
        onPress={() => onShowDetails(plan)}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <Ionicons name="information-circle-outline" size={18} color={COLORS.accent} />
      </TouchableOpacity>
    </View>
  );
};

const PlanCarousel = ({ plans, activePlanId, onPlanChange, onShowDetails }) => {
  const flatRef = useRef(null);

  const onMomentumScrollEnd = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_MARGIN * 2));
    const clamped = Math.max(0, Math.min(index, plans.length - 1));
    onPlanChange(plans[clamped].id);
  };

  return (
    <View style={styles.carouselWrapper}>
      <FlatList
        ref={flatRef}
        data={plans}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled={false}
        disableIntervalMomentum={true}
        snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
        snapToAlignment="center"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
        onMomentumScrollEnd={onMomentumScrollEnd}
        initialScrollIndex={Math.max(0, plans.findIndex((p) => p.id === activePlanId))}
        getItemLayout={(_, index) => ({
          length: CARD_WIDTH + CARD_MARGIN * 2,
          offset: (CARD_WIDTH + CARD_MARGIN * 2) * index,
          index,
        })}
        renderItem={({ item }) => (
          <PlanCard
            plan={item}
            isActive={item.id === activePlanId}
            onShowDetails={onShowDetails}
          />
        )}
      />
    </View>
  );
};

const CouponSection = ({
  couponCode,
  setCouponCode,
  couponDiscount,
  onApply,
  onNavigateToOffers,
  isValidating,
  couponMessage,
  isCouponError
}) => {
  return (
    <View style={styles.offersSection}>
      <TouchableOpacity
        style={styles.offersHeader}
        onPress={onNavigateToOffers}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>Offers</Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.accent} />
      </TouchableOpacity>

      <View style={styles.couponRow}>
        <TextInput
          style={styles.couponInput}
          placeholder="Enter Coupon Code"
          placeholderTextColor="#666666"
          value={couponCode}
          onChangeText={(t) => setCouponCode(t.toUpperCase())}
          autoCapitalize="characters"
        />
        <TouchableOpacity onPress={onApply} activeOpacity={0.8} style={styles.applyBtn} disabled={isValidating}>
          {isValidating ? (
            <ActivityIndicator size="small" color={COLORS.accent} />
          ) : (
            <Text style={styles.applyBtnText}>Apply</Text>
          )}
        </TouchableOpacity>
      </View>

      {couponMessage ? (
        <Text style={[styles.couponMessage, isCouponError ? styles.couponError : styles.couponSuccess]}>
          {isCouponError ? '❌ ' : '🎉 '}
          {couponMessage}
        </Text>
      ) : couponDiscount > 0 ? (
        <Text style={styles.couponHelper}>
          🎉 You saved ₹{couponDiscount} on this plan.
        </Text>
      ) : null}
    </View>
  );
};

const PaymentSummary = ({ plan, couponDiscount }) => {
  const { total, gst, discount } = computeTotals(plan, couponDiscount);

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.sectionTitle}>Payment Summary</Text>
      <View style={styles.summaryDivider} />

      <SummaryRow label="Plan Price" value={`₹${plan?.planPrice || 0}`} />
      <SummaryRow
        label="Special Discount"
        value={`-₹${plan?.specialDiscount || 0}`}
        valueColor={COLORS.green}
      />
      <SummaryRow
        label="Coupon Discount"
        value={discount > 0 ? `-₹${discount}` : '—'}
        valueColor={discount > 0 ? COLORS.green : COLORS.grey}
      />
      <SummaryRow label="GST (18%)" value={`₹${gst}`} />

      <View style={styles.totalDivider} />

      <SummaryRow
        label="Total Payable"
        value={`₹${total}`}
        bold
      />
    </View>
  );
};

const SummaryRow = ({ label, value, valueColor, bold }) => (
  <View style={styles.summaryRow}>
    <Text style={[styles.summaryLabel, bold && styles.summaryLabelBold]}>{label}:</Text>
    <Text
      style={[
        styles.summaryValue,
        { color: valueColor ?? COLORS.textDark },
        bold && styles.summaryValueBold,
      ]}
    >
      {value}
    </Text>
  </View>
);

const TermsCheckbox = ({ agreed, onToggle }) => (
  <TouchableOpacity style={styles.termsRow} onPress={onToggle} activeOpacity={0.7}>
    <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
      {agreed && <Ionicons name="checkmark" size={13} color={COLORS.white} />}
    </View>
    <Text style={styles.termsText}>I agree to the terms.</Text>
  </TouchableOpacity>
);

const ProceedButton = ({ onPress, loading, disabled }) => (
  <View style={styles.proceedWrapper}>
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.proceedTouchable} disabled={loading || disabled}>
      <LinearGradient
        colors={['#3D1C8E', '#210F47']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.proceedBtn, (loading || disabled) && { opacity: 0.7 }]}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.proceedBtnText}>PROCEED TO PAY</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  </View>
);

const PaymentModal = ({ visible, onClose, paymentUrl, onPaymentSuccess, onPaymentFailure }) => {
  const extractPaymentId = (url) => {
    try {
      const match = url.match(/[?&]razorpay_payment_id=([^&]+)/);
      return match ? match[1] : null;
    } catch (e) { return null; }
  };
  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={() => onClose(false)}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
          <TouchableOpacity onPress={() => onClose(false)} style={{ padding: 10 }}>
            <Ionicons name="close" size={28} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '700', marginLeft: 10, color: COLORS.primary }}>Complete Payment</Text>
        </View>
        <WebView
          originWhitelist={['*']}
          source={{ uri: paymentUrl }}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          injectedJavaScript={`
            (function() {
              var observer = new MutationObserver(function(mutations) {
                const text = document.body.innerText;
                if (text.includes('Payment Successful') || 
                    text.includes('Payment Success') ||
                    text.includes('Order Successful') ||
                    text.includes('Payment captured') ||
                    text.includes('Payment authorized')) {
                  window.ReactNativeWebView.postMessage('PAYMENT_SUCCESS');
                  observer.disconnect();
                } else if (text.includes('Payment Failed') || 
                           text.includes('Transaction Failed') ||
                           text.includes('Something went wrong')) {
                  window.ReactNativeWebView.postMessage('PAYMENT_FAILED');
                  observer.disconnect();
                }
              });
              observer.observe(document.body, { childList: true, subtree: true });
            })();
            true;
          `}
          onMessage={(event) => {
            if (event.nativeEvent.data === 'PAYMENT_SUCCESS') {
              onPaymentSuccess && onPaymentSuccess();
              onClose(true);
            } else if (event.nativeEvent.data === 'PAYMENT_FAILED') {
              onPaymentFailure && onPaymentFailure('The payment attempt failed.');
              onClose(false);
            }
          }}
          onLoadStart={(navState) => {
            const url = navState.nativeEvent.url;
            if (
              url.includes('payment-success') ||
              url.includes('status=captured') ||
              url.includes('status=paid') ||
              url.includes('razorpay.com/payment/status')
            ) {
              const pid = extractPaymentId(url);
              onPaymentSuccess && onPaymentSuccess(pid);
              onClose(true);
            } else if (url.includes('status=failed')) {
              onPaymentFailure && onPaymentFailure('Payment explicitly failed.');
              onClose(false);
            }
          }}
          onNavigationStateChange={(navState) => {
            if (
              navState.url.includes('payment-success') ||
              navState.url.includes('status=captured') ||
              navState.url.includes('status=paid') ||
              navState.url.includes('razorpay.com/payment/status')
            ) {
              const pid = extractPaymentId(navState.url);
              onPaymentSuccess && onPaymentSuccess(pid);
              onClose(true);
            } else if (navState.url.includes('status=failed')) {
              onPaymentFailure && onPaymentFailure('Payment explicitly failed.');
              onClose(false);
            }
          }}
          onShouldStartLoadWithRequest={(request) => {
            if (
              request.url.includes('payment-success') ||
              request.url.includes('status=captured') ||
              request.url.includes('status=paid') ||
              request.url.includes('razorpay.com/payment/status')
            ) {
              const pid = extractPaymentId(request.url);
              onPaymentSuccess && onPaymentSuccess(pid);
              onClose(true);
              return false;
            } else if (request.url.includes('status=failed')) {
              onPaymentFailure && onPaymentFailure('Payment explicitly failed.');
              onClose(false);
              return false;
            }
            return true;
          }}
          renderLoading={() => <ActivityIndicator size="large" color={COLORS.accent} style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -20, marginTop: -20 }} />}
        />
      </SafeAreaView>
    </Modal>
  );
};

// ─── Main CheckoutScreen ──────────────────────────────────────────────────────

export default function CheckoutScreen({ isOverlay, onBack, onNavigate, params: overlayParams }) {
  const navigation = useNavigation();
  const route = useRoute();

  // Use overlayParams if present, fallback to route.params
  const params = overlayParams || route.params || {};

  const { userId, userData } = useAuth();
  const { data: backendData, isLoading: plansLoading } = useSubscriptionPlans();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [internalTransactionId, setInternalTransactionId] = useState('');

  // Resilient unpacking: handle both [] and { plans: [] }
  const backendPlans = Array.isArray(backendData) ? backendData : (backendData?.plans || []);
  const backendCoupons = backendData?.coupons || [];

  // Combine plans
  const PLANS_DYNAMIC = [
    ...(backendPlans || [])
      .filter(plan => {
        const d = String(plan.display || '').toLowerCase().trim();
        return d !== 'no' && d !== 'none'; // Only hide if explicitly "No" or "None"
      })
      .map(plan => ({
        id: String(plan.plan_id),
        plan_key: plan.plan_key,
        title: plan.plan_name,
        badge: plan.tip || (plan.plan_key === '3month' ? 'Popular' : 'Starter'),
        description: plan.description || `${plan.plan_validity} plan.`,
        planPrice: plan.full_amount || plan.amount,
        specialDiscount: (plan.full_amount - plan.amount) || 0,
        gst: 0,
        isPopular: plan.tip === 'Most Bought' || plan.plan_key === '3month',
        button_code: plan.button_code,
        plan_type: plan.plan_type,
        plan_validity: plan.plan_validity
      }))
  ];

  const [activePlanId, setActivePlanId] = useState(String(params.planId || ''));
  const activePlan = PLANS_DYNAMIC.find((p) => p.id === activePlanId) || PLANS_DYNAMIC[0];
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetailPlan, setSelectedDetailPlan] = useState(null);

  // Update activePlanId when params change
  useEffect(() => {
    if (params.planId) {
      setActivePlanId(String(params.planId));
    }
  }, [params.planId]);

  const { appliedCoupon, isValidating: isValidatingCoupon, applyCoupon, clearCoupon, calculateDiscount } = useCoupon();
  const [agreed, setAgreed] = useState(true);
  const [couponMessage, setCouponMessage] = useState('');
  const [isCouponError, setIsCouponError] = useState(false);

  // Sync initial coupon if passed via params
  useEffect(() => {
    if (params.code && !appliedCoupon) {
      applyCoupon(params.code, activePlan?.planPrice || 0, userId);
    }
  }, [params.code]);

  // Calculate dynamic discount based on coupon rules via Context helper
  const couponDiscount = calculateDiscount(activePlan?.planPrice || 0);

  const { afterSpecial, afterCoupon, gst, total } = computeTotals(
    activePlan,
    couponDiscount
  );

  const [couponCode, setCouponCode] = useState(params.code || '');

  const handleApplyCoupon = async (codeToApply = couponCode) => {
    setCouponMessage('');
    if (!codeToApply) {
      clearCoupon();
      return;
    }

    const planPrice = activePlan?.planPrice || 0;
    const specialDiscount = activePlan?.specialDiscount || 0;
    const baseAmount = Math.max(0, planPrice - specialDiscount);

    if (baseAmount <= 0) {
      setCouponMessage("Please select a valid plan first.");
      setIsCouponError(true);
      return;
    }

    const result = await applyCoupon(codeToApply, baseAmount, userId);
    if (!result.success) {
      setCouponMessage(result.message);
      setIsCouponError(true);
    } else {
      setCouponCode(codeToApply);
      setCouponMessage(`"${codeToApply}" applied successfully!`);
      setIsCouponError(false);
    }
  };

  // When coming back from Offers Screen with an applied coupon event
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('APPLY_COUPON', ({ code }) => {
      setCouponCode(code);
      handleApplyCoupon(code); // Trigger validation immediately
    });
    return () => sub.remove();
  }, [activePlanId, userId]); // Dependencies needed for handleApplyCoupon context

  const handlePayment = async () => {
    if (!agreed) {
      Alert.alert("Terms", "Please agree to the terms and conditions.");
      return;
    }

    try {
      setIsSubscribing(true);

      let response;
      const { total, gst } = computeTotals(activePlan, couponDiscount);
      const cgst_sgst = Math.round(gst / 2);

      if (activePlan?.plan_type === 'One Time') {
        // Use Create Order for One-Time plans
        response = await axiosInstance.post('/paymentgateway/create-order', {
          user_id: userId,
          plan_id: activePlan.id,
          plan_name: activePlan.title,
          plan_validity: activePlan.plan_validity,
          invoice_amount: activePlan.planPrice,
          total_invoice_amount: total,
          discount_code: couponDiscount > 0 ? appliedCoupon?.offer_code : null,
          discount_amount: couponDiscount || 0,
          cgst_rate: 0,
          cgst: 0,
          sgst_rate: 0,
          sgst: 0,
          igst_rate: 18,
          igst: gst,
          invoice_amount_net: total - gst
        });
      } else {
        // Use Subscribe for Recurring plans
        response = await axiosInstance.post('/subscription/subscribe', {
          user_id: userId,
          plan_key: activePlanId,
          coupon_code: couponDiscount > 0 ? appliedCoupon?.offer_code : null
        });
      }

      if (response.data.status) {
        // Normalize payment link from different endpoints
        const link = response.data.result.payment_link || response.data.result.payment_link_url;
        const internalId = response.data.result.internal_transaction_id;

        if (link) {
          setPaymentUrl(link);
          setInternalTransactionId(internalId);
          setShowPaymentModal(true);
        } else {
          Alert.alert("Success", "Subscription initiated. Please check your email for payment link.");
        }
      } else {
        Alert.alert("Error", response.data.message || "Failed to initiate transaction");
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert("Error", error?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleBack = () => {
    if (isOverlay && onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  const navigateToOffers = () => {
    const navParams = { planId: activePlanId, planPrice: activePlan?.planPrice };
    if (isOverlay && onNavigate) {
      onNavigate('OFFERS', navParams, true);
    } else {
      navigation.navigate('Offers', navParams);
    }
  };

  if (plansLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, isOverlay && { backgroundColor: 'transparent' }]}>
        <Header onBack={handleBack} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 10, fontFamily: 'Poppins' }}>Loading plans...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const [isPaid, setIsPaid] = useState(false);
  const [razorpayPaymentId, setRazorpayPaymentId] = useState('');
  const razorpayPaymentIdRef = useRef(''); // Use ref to avoid state race condition on navigation

  return (
    <View style={[styles.safeArea, isOverlay && { backgroundColor: 'transparent' }]}>
      <Header onBack={handleBack} />
      <View style={styles.pageContent}>
        {PLANS_DYNAMIC.length > 0 && (
          <PlanCarousel
            plans={PLANS_DYNAMIC}
            activePlanId={activePlanId}
            onPlanChange={(id) => {
              setActivePlanId(id);
              setIsPaid(false);
            }}
            onShowDetails={(p) => {
              setSelectedDetailPlan(p);
              setDetailModalVisible(true);
            }}
          />
        )}
        <CouponSection
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          couponDiscount={couponDiscount}
          onNavigateToOffers={navigateToOffers}
          isValidating={isValidatingCoupon}
          onApply={() => handleApplyCoupon(couponCode)}
          couponMessage={couponMessage}
          isCouponError={isCouponError}
        />
        <PaymentSummary plan={activePlan} couponDiscount={couponDiscount} />
        <TermsCheckbox agreed={agreed} onToggle={() => setAgreed(!agreed)} />
      </View>
      <ProceedButton
        onPress={handlePayment}
        loading={isSubscribing}
        disabled={!agreed}
      />

      {/* CUSTOM PLAN DETAIL MODAL */}
      <PlanDetailModal
        visible={detailModalVisible}
        plan={selectedDetailPlan}
        onClose={() => setDetailModalVisible(false)}
        onSelect={(id) => {
          setActivePlanId(id);
          setDetailModalVisible(false); // Close modal after selection
        }}
      />

      <PaymentModal
        visible={showPaymentModal}
        onClose={(wasSuccessful) => {
          setShowPaymentModal(false);
          // Only navigate to INVOICE if payment was successful
          // We use 'wasSuccessful' flag passed from modal to avoid state race condition
          if ((wasSuccessful || isPaid) && isOverlay && onNavigate) {
            const { total, gst } = computeTotals(activePlan, couponDiscount);
            onNavigate('INVOICE', {
              plan: { ...activePlan, gst }, // Add calculated gst here
              couponDiscount,
              internal_transaction_id: internalTransactionId,
              payment_id: razorpayPaymentIdRef.current || razorpayPaymentId, // Use ref for current value
              user_name: userData?.name || 'User',
            }, true);
          }
        }}
        paymentUrl={paymentUrl}
        onPaymentSuccess={(pid) => {
          setIsPaid(true);
          if (pid) {
            setRazorpayPaymentId(pid);
            razorpayPaymentIdRef.current = pid;
          }
        }}
        onPaymentFailure={(msg) => Alert.alert("Payment Failed", msg || "Something went wrong with the transaction.")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  headerContainer: {
    flexDirection: "row",
    alignItems: 'left',
    position: 'relative',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 0 : 15,
    marginBottom: 10,
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
  },
  headingLine2: {
    color: COLORS.accent,
    fontFamily: 'Poppins',
    fontWeight: '800',
    fontSize: 12,
    lineHeight: 32,
    textAlign: 'left',
    marginTop: 2,
  },
  pageContent: { flex: 1 },
  carouselWrapper: { marginTop: 20, marginBottom: 6 },
  carouselContent: { paddingHorizontal: SIDE_INSET },
  planCard: { width: CARD_WIDTH, marginHorizontal: CARD_MARGIN, backgroundColor: COLORS.greyLight, borderRadius: 20, padding: 16, minHeight: 136, position: 'relative' },
  planCardActive: { backgroundColor: '#FFEDDB', borderColor: COLORS.accent, borderWidth: 1.5, shadowColor: COLORS.accent, shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
  cardBadge: { position: 'absolute', top: 0, left: 0, backgroundColor: COLORS.red, borderTopLeftRadius: 20, borderBottomRightRadius: 12, paddingHorizontal: 12, paddingVertical: 5, zIndex: 10 },
  cardBadgeText: { color: COLORS.white, fontFamily: 'Poppins', fontWeight: '700', fontSize: 11 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardTopRowWithBadge: { marginTop: 28 },
  cardTitle: { fontFamily: 'Poppins', fontWeight: '700', fontSize: 22, color: COLORS.accent, flex: 1, marginRight: 8 },
  cardPriceBlock: { alignItems: 'flex-end' },
  cardOldPrice: { fontFamily: 'Poppins', fontSize: 13, color: COLORS.grey, textDecorationLine: 'line-through' },
  cardNewPrice: { fontFamily: 'Poppins', fontWeight: '800', fontSize: 22, color: COLORS.primary },
  detailsIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 20, // Match card radius
    gap: 4,
  },
  detailsText: {
    color: COLORS.white,
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 12,
  },
  validityText: {
    color: COLORS.grey,
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 12,
    position: 'absolute',
    bottom: 12,
    left: 16,
  },
  cardDesc: { fontFamily: 'Poppins', fontSize: 11, color: COLORS.grey, lineHeight: 16 },
  offersSection: { marginHorizontal: 20, marginTop: 18, marginBottom: 2 },
  offersHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontFamily: 'Poppins', fontWeight: '700', fontSize: 17, color: COLORS.textDark },
  couponRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.2, borderColor: COLORS.primary, borderRadius: 28, paddingLeft: 18, paddingRight: 4, height: 50, backgroundColor: COLORS.white },
  couponInput: { flex: 1, fontFamily: 'Poppins', fontSize: 14, color: COLORS.textDark, paddingVertical: 0 },
  applyBtn: { paddingHorizontal: 18, paddingVertical: 8 },
  applyBtnText: { fontFamily: 'Poppins', fontWeight: '700', fontSize: 14, color: COLORS.accent },
  couponHelper: { fontFamily: 'Poppins', fontSize: 13, color: COLORS.green, marginTop: 8, marginLeft: 4 },
  couponMessage: { fontFamily: 'Poppins', fontSize: 13, marginTop: 8, marginLeft: 4 },
  couponError: { color: COLORS.red },
  couponSuccess: { color: COLORS.green },
  summaryCard: { marginHorizontal: 20, marginTop: 18, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 16 },
  summaryDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryLabel: { fontFamily: 'Poppins', fontSize: 14, color: COLORS.grey },
  summaryLabelBold: { color: COLORS.textDark, fontWeight: '700', fontSize: 15 },
  summaryValue: { fontFamily: 'Poppins', fontSize: 14, color: COLORS.textDark },
  summaryValueBold: { fontWeight: '800', fontSize: 16 },
  totalDivider: { height: 1, backgroundColor: COLORS.border, marginBottom: 12, marginTop: 4 },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 16, gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  termsText: { fontFamily: 'Poppins', fontSize: 13, color: COLORS.grey },
  proceedWrapper: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border },
  proceedTouchable: { borderRadius: 28, overflow: 'hidden' },
  proceedBtn: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  proceedBtnText: { fontFamily: 'Poppins', fontWeight: '700', fontSize: 16, color: COLORS.white, letterSpacing: 1 },
});
