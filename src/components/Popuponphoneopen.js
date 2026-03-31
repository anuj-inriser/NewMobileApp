import React from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  primary: '#210F47',
  accent: '#FF9F3F',
  accentLight: '#FFF6EC',
  red: '#E01E2E',
  darkRed: '#990000',
  textDark: '#333333',
  white: '#FFFFFF',
  border: '#FF9F3F',
  grey: '#666666',
  greyLight: '#F7F7F9'
};

export default function Popuponphoneopen({ visible, onClose, onUnlock }) {
  const navigation = useNavigation();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.content} bounces={false}>
            <View style={styles.cardContainer}>
              {/* Main Card */}
              <LinearGradient colors={['#FFFFFF', '#FFF2E0']} style={styles.card}>

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.closeButton}
                  activeOpacity={0.7}
                  onPress={onClose}
                >
                  <Ionicons name="close" size={20} color={COLORS.textDark} />
                </TouchableOpacity>

                {/* Content */}
                <Text style={styles.title}>Unlock Smart Trading</Text>
                <Text style={styles.subtitle}>You're Watching. Others Are Trading.</Text>

                <View style={styles.offerRow}>
                  <Text style={styles.fireEmoji}>🔥</Text>
                  <Text style={styles.offerText}>25% OFF — Limited-Time Offer</Text>
                </View>

                <View style={styles.priceContainer}>
                  <Text style={styles.priceHighlight}>₹199 </Text>
                  <Text style={styles.priceMonth}>/month</Text>
                </View>
                <Text style={styles.cancelText}>Cancel anytime.</Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.unlockBtnWrapper}
                  onPress={onUnlock}
                >
                  <LinearGradient
                    colors={['#3D1C8E', '#210F47']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.unlockBtn}
                  >
                    <Text style={styles.unlockBtnText}>Unlock Now</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>

              {/* Ribbon */}
              <View style={styles.ribbonContainer}>
                <LinearGradient colors={['#FF4B4B', '#D32F2F']} style={styles.ribbon}>
                  <Text style={styles.ribbonText}>S</Text>
                  <Text style={styles.ribbonText}>A</Text>
                  <Text style={styles.ribbonText}>L</Text>
                  <Text style={styles.ribbonText}>E</Text>
                </LinearGradient>
                <View style={styles.ribbonTail} />
              </View>
            </View>
          </ScrollView>

          {/* Bottom Spheres */}
          <View style={styles.spheresContainer} pointerEvents="none">
            <LinearGradient
              colors={['rgba(252, 174, 104, 0.4)', 'rgba(115, 78, 89, 0.4)']}
              style={styles.bottomSphereLeft}
            />
            <LinearGradient
              colors={['rgba(252, 174, 104, 0.4)', 'rgba(115, 78, 89, 0.4)']}
              style={styles.bottomSphereRight}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: SCREEN_WIDTH,
  },
  cardContainer: {
    width: '85%',
    maxWidth: 320,
    position: 'relative',
  },
  card: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 24,
    paddingTop: 80,
    paddingBottom: 20,
    width: '100%',
    shadowColor: COLORS.border,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    zIndex: 12,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 10,
    marginTop: 10,
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    color: COLORS.textDark,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 26,
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  fireEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  offerText: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.textDark,
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  priceHighlight: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.border,
  },
  priceMonth: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  cancelText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: COLORS.textDark,
    marginBottom: 26,
  },
  unlockBtnWrapper: {
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: '#210F47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  unlockBtn: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockBtnText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  ribbonContainer: {
    position: 'absolute',
    top: -16,
    left: 20,
    zIndex: 20,
    width: 28,
  },
  ribbon: {
    paddingTop: 12,
    paddingBottom: 4,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    alignItems: 'center',
    width: 28,
  },
  ribbonTail: {
    width: 0,
    height: 0,
    borderBottomWidth: 10,
    borderBottomColor: 'transparent',
    borderLeftWidth: 14,
    borderLeftColor: '#D32F2F',
    borderRightWidth: 14,
    borderRightColor: '#D32F2F',
  },
  ribbonText: {
    color: COLORS.white,
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  spheresContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    overflow: 'hidden',
    zIndex: 1,
  },
  bottomSphereLeft: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  bottomSphereRight: {
    position: 'absolute',
    bottom: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
});
