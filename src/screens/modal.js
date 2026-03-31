import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { useAlert } from '../context/AlertContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import PlanDetailModal from '../components/PlanDetailModal';

const COLORS = {
  primary: '#210F47',
  accent: '#FF9F3F',
  accentLight: '#FFEDDB',
  red: '#D32F2F',
  grey: '#666666',
  white: '#FFFFFF',
  border: '#EAEAEA',
  textDark: '#333333',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Reusable Header Component
 */
const Header = ({ onBack }) => {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      {/* <View style={styles.svgContainer}> */}
      {/* Crown border (laurel wreath) */}
      {/* <Image
          source={require('../../assets/crown_border.svg')}
          style={styles.crownBorderImage}
          resizeMode="contain"
        /> */}
      {/* Crown on top, centered */}
      {/* <Image
          source={require('../../assets/Crown_Image.png')}
          style={styles.crownImage}
          resizeMode="contain"
        /> */}
      {/* </View> */}

      <View style={styles.headingContainer}>
        <Text style={styles.headingLine1}>Upgrade to</Text>
        <Text style={styles.headingLine2}>Premium Features</Text>

        {/* Curvy line below heading */}
        <View style={styles.curveContainer}>
          <Image
            source={require('../../assets/heading_line.svg')}
            style={styles.headingLineImage}
            resizeMode="stretch"
          />
        </View>
      </View>
    </View>
  );
};

/**
 * Reusable Category Menu Component
 */
const CategoryMenu = ({ categories, selectedCategory, onSelect }) => {
  return (
    <View style={styles.menuContainerWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.menuScrollContent}
      >
        <View style={styles.menuContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={styles.menuButtonWrapper}
              onPress={() => onSelect(category)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={selectedCategory === category ? ['#FFEDDB', '#FFEDDB'] : ['transparent', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.menuButton}
              >
                <Text style={[styles.menuText, selectedCategory === category && styles.menuTextActive]}>
                  {category}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* <View style={styles.saveBadgeContainer}>
        <View style={styles.saveBadge}>
          <Text style={styles.saveBadgeText}>Save 25%</Text>
        </View>
        <Image
          source={require('../../assets/curly_arrow.svg')}
          style={styles.curlyArrowImage}
          resizeMode="contain"
        />
      </View> */}
    </View>
  );
};

/**
 * Reusable Plan Card Component
 */
const PlanCard = ({ plan, isSelected, onSelect, onShowDetails }) => {
  return (
    <TouchableOpacity
      style={styles.cardWrapper}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={isSelected ? ['#FFFFFF', '#FFF2E0'] : [COLORS.white, COLORS.white]}
        style={[
          styles.cardContainer,
          isSelected && styles.cardContainerSelected,
        ]}
      >
        {plan.badge && (
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeText}>{plan.badge}</Text>
          </View>
        )}

        <View style={[styles.cardHeader, plan.badge ? { marginTop: 12 } : null]}>
          <Text style={styles.cardTitle}>{plan.title}</Text>
        </View>


        <View style={styles.priceRow}>
          <Text style={styles.oldPrice}>₹{plan.planPrice}</Text>
          <Text style={styles.newPrice}>₹{plan.planPrice - plan.specialDiscount}</Text>
        </View>

        {plan.plan_validity && (
          <Text style={styles.validityText}>{plan.plan_validity}</Text>
        )}

        <TouchableOpacity
          style={styles.detailsIconContainer}
          onPress={() => onShowDetails(plan)}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          activeOpacity={0.6}
        >
          <Ionicons name="information-circle-outline" size={18} color={COLORS.accent} />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity >
  );
};

/**
 * Reusable Subscribe Button Component
 */
const SubscribeButton = ({ onPress }) => {
  return (
    <View style={styles.footer}>
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.subscribeTouchable}>
        <LinearGradient
          colors={['#3D1C8E', '#210F47']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.subscribeButton}
        >
          <Text style={styles.subscribeButtonText}>SUBSCRIBE</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

import { useSubscriptionPlans } from '../hooks/useSubscriptionPlans';

/**
 * Main Premium Features Screen Component
 */
export default function ModalScreen({ onBack, isOverlay, onNavigate }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetailPlan, setSelectedDetailPlan] = useState(null);
  const navigation = useNavigation();
  const { data: backendData, isLoading, error } = useSubscriptionPlans();

  // Resilient unpacking: handle both [] and { plans: [] }
  const backendPlans = Array.isArray(backendData) ? backendData : (backendData?.plans || []);

  const ALL_PLANS = [
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

  // Set default selected plan once data is loaded
  useEffect(() => {
    if (ALL_PLANS.length > 0 && !selectedPlanId) {
      setSelectedPlanId(ALL_PLANS[0].id);
    }
  }, [backendPlans]);

  // Derive unique categories dynamically from ALL_PLANS (using validity)
  const validityCategories = Array.from(new Set(ALL_PLANS.map(p => p.plan_validity))).filter(Boolean);

  // Logical sort: All -> Days -> Weeks -> Months -> Years
  const sortValidity = (a, b) => {
    const getUnitPriority = (val) => {
      const lower = val.toLowerCase();
      if (lower.includes('day')) return 1;
      if (lower.includes('week')) return 2;
      if (lower.includes('month')) return 3;
      if (lower.includes('year')) return 4;
      return 5;
    };
    const priA = getUnitPriority(a);
    const priB = getUnitPriority(b);
    if (priA !== priB) return priA - priB;
    // Same unit, sort by number
    const numA = parseInt(a) || 0;
    const numB = parseInt(b) || 0;
    return numA - numB;
  };

  const sortedValidity = validityCategories.sort(sortValidity);
  const categories = ['All', ...sortedValidity];

  // Filter plans based on selected category (validity)
  const filteredPlans = selectedCategory === 'All'
    ? ALL_PLANS
    : ALL_PLANS.filter(plan => plan.plan_validity === selectedCategory);

  const handleSubscribe = () => {
    if (isOverlay && onNavigate) {
      onNavigate('CHECKOUT', { planId: selectedPlanId });
      return;
    }

    // Determine if we are inside the AppStack or RootStack
    const state = navigation.getState();
    const hasCheckout = state?.routeNames?.includes('Checkout');

    if (hasCheckout) {
      navigation.navigate('Checkout', { planId: selectedPlanId });
    } else {
      navigation.navigate('App', {
        screen: 'Checkout',
        params: { planId: selectedPlanId }
      });
    }

    if (onBack) onBack(); // Close overlay if applicable
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, isOverlay && { backgroundColor: 'transparent' }]}>
        <View style={[styles.scrollContent, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
          <Text style={styles.headingLine1}>Loading plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, isOverlay && { backgroundColor: 'transparent' }]} edges={isOverlay ? ['bottom'] : ['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Header onBack={onBack} />

        {categories.length > 0 && (
          <CategoryMenu
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={(cat) => {
              setSelectedCategory(cat);
              const firstPlan = cat === 'All'
                ? ALL_PLANS[0]
                : ALL_PLANS.find(p => p.plan_validity === cat);
              if (firstPlan) setSelectedPlanId(firstPlan.id);
            }}
          />
        )}

        {error && (
          <View style={{ padding: 10, backgroundColor: '#FFEBE9', borderRadius: 8, marginBottom: 15 }}>
            <Text style={{ color: COLORS.red, textAlign: 'center' }}>{error.message || "Failed to load plans"}</Text>
          </View>
        )}

        <View style={styles.cardsGrid}>
          {filteredPlans.length > 0 ? (
            filteredPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isSelected={selectedPlanId === plan.id}
                onSelect={() => setSelectedPlanId(plan.id)}
                onShowDetails={(p) => {
                  setSelectedDetailPlan(p);
                  setDetailModalVisible(true);
                }}
              />
            ))
          ) : (
            <View style={{ flex: 1, padding: 40, alignItems: 'center' }}>
              <Ionicons name="alert-circle-outline" size={48} color={COLORS.grey} />
              <Text style={[styles.cardDesc, { marginTop: 10, fontSize: 16, textAlign: 'center' }]}>
                No plans available at the moment.
                {"\n"}(Received {backendPlans.length} total raw plans)
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <SubscribeButton onPress={handleSubscribe} />

      <PlanDetailModal
        visible={detailModalVisible}
        plan={selectedDetailPlan}
        onClose={() => setDetailModalVisible(false)}
        onSelect={(planId) => {
          setSelectedPlanId(planId);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },

  // Header Components Styles
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 24,
    marginTop: Platform.OS === 'ios' ? 0 : 10,
  },
  backButton: {
    position: 'absolute',
    left: 0,
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
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'left',
    marginTop: 2,
  },
  curveContainer: {
    height: 12,
    width: '90%',
    marginTop: 4,
    overflow: 'hidden',
    alignItems: 'flex-start',
  },
  headingLineImage: {
    width: '100%',
    height: 12,
  },

  // Category Menu Component Styles
  menuContainerWrapper: {
    marginBottom: 28,
    position: 'relative',
    width: '100%',
    alignItems: 'center',
  },
  menuContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 30,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  menuButtonWrapper: {
    minWidth: 80,
  },
  menuButton: {
    paddingVertical: 10,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    color: COLORS.grey,
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 15,
  },
  menuTextActive: {
    color: '#210f47',
    fontWeight: '600'
  },
  saveBadgeContainer: {
    position: 'absolute',
    top: -18,
    right: 0,
    alignItems: 'center',
  },
  saveBadge: {
    backgroundColor: COLORS.red,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    transform: [{ rotate: '4deg' }],
    zIndex: 2,
  },
  saveBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontFamily: 'Poppins',
    fontWeight: '800',
  },
  curlyArrowImage: {
    width: 20,
    height: 20,
    position: 'absolute',
    top: 20,
    right: 30,
    transform: [{ rotate: '-10deg' }]
  },

  // Plan Table Styles
  tableContainer: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableHeaderText: {
    fontFamily: 'Poppins',
    fontWeight: '700',
    fontSize: 12,
    color: COLORS.grey,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRowSelected: {
    backgroundColor: '#FFF9F2',
    borderColor: COLORS.accent,
    borderWidth: 1.5,
    margin: -1,
    zIndex: 1,
  },
  tablePlanName: {
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 14,
    color: COLORS.primary,
  },
  tablePopularBadge: {
    backgroundColor: COLORS.red,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  tablePopularBadgeText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: '700',
  },
  tableValidity: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: COLORS.textDark,
  },
  tableOldPrice: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: COLORS.grey,
    textDecorationLine: 'line-through',
  },
  tableNewPrice: {
    fontFamily: 'Poppins',
    fontWeight: '800',
    fontSize: 16,
    color: COLORS.primary,
  },

  // Plan Card Component Styles
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardWrapper: {
    height: 150,
    width: '48%',
    marginBottom: 16,
  },
  cardContainer: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    height: '100%',
  },
  cardContainerSelected: {
    borderColor: COLORS.accent,
    borderWidth: 1,
  },
  cardBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: COLORS.red,
    borderTopLeftRadius: 15, // Matches card border radius
    borderBottomRightRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 10,
  },
  cardBadgeText: {
    color: COLORS.white,
    fontFamily: 'Poppins',
    fontWeight: '700',
    fontSize: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    color: COLORS.primary,
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
  },
  validityText: {
    color: COLORS.grey,
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 12,
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  oldPrice: {
    color: COLORS.grey,
    fontSize: 12,
    textDecorationLine: 'line-through',
    fontFamily: 'Poppins',
    fontWeight: '400',
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  newPrice: {
    color: COLORS.textDark,
    fontFamily: 'Poppins',
    fontWeight: '800',
    fontSize: 22,
    marginRight: 6,
    lineHeight: 28,
  },
  detailsIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 16, // Match card radius
  },
  detailsText: {
    color: COLORS.white,
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 12,

  },
  cardDesc: {
    color: COLORS.grey,
    fontFamily: 'Poppins',
    fontWeight: '400',
    fontSize: 11,
    lineHeight: 14,
    paddingRight: 10,
  },

  // Subscribe Button Component Styles
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
  },
  subscribeTouchable: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  subscribeButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeButtonText: {
    color: COLORS.white,
    fontFamily: 'Poppins',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
