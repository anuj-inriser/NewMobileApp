import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ModalScreen from "../screens/modal";
import CheckoutScreen from "../screens/checkout";
import OffersScreen from "../screens/offers";
import InvoiceScreen from "../screens/InvoiceScreen";
 import { useQueryClient } from '@tanstack/react-query';

const { width } = Dimensions.get("window");

const PremiumOverlay = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const queryClient = useQueryClient();

  // Navigation stack state: e.g., ['PLANS'] or ['PLANS', 'CHECKOUT']
  const [stack, setStack] = useState(['PLANS']);
  const [params, setParams] = useState({});
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: width,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsVisible(false);
        setStack(['PLANS']); // Reset on close
      });
    }
  }, [visible]);

  const handleNavigate = (screen, newParams = {}, replace = false) => {
    setParams(prev => ({ ...prev, ...newParams }));
    if (replace) {
      setStack(prev => [...prev.slice(0, -1), screen]);
    } else {
      setStack(prev => [...prev, screen]);
    }
  };

  const handleBack = () => {
    if (stack.length > 1) {
      setStack(prev => prev.slice(0, -1));
    } else {
      onClose();
    }
  };

     const handleClose = () => {
     queryClient.invalidateQueries(['activePlans']); // refresh plan data
      onClose();
    };

  if (!isVisible && !visible) return null;

  const currentScreen = stack[stack.length - 1];

  const renderContent = () => {
    switch (currentScreen) {
      case 'PLANS':
        return (
          <ModalScreen
            onBack={handleBack}
            isOverlay={true}
            onNavigate={handleNavigate}
          />
        );
      case 'CHECKOUT':
        return (
          <CheckoutScreen
            onBack={handleBack}
            isOverlay={true}
            onNavigate={handleNavigate}
            params={params}
          />
        );
      case 'OFFERS':
        return (
          <OffersScreen
            onBack={handleBack}
            isOverlay={true}
            onNavigate={handleNavigate}
            params={params}
          />
        );
      case 'INVOICE':
        return (
          <InvoiceScreen
            onClose={handleClose}
            params={params}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View
      style={[StyleSheet.absoluteFillObject, { zIndex: 999999 }]}
      pointerEvents={visible ? "auto" : "none"}
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Pressable style={styles.flex1} onPress={handleClose} />
      </Animated.View>

      {/* Slide Container */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: width,
            paddingTop: insets.top,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {renderContent()}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 10,
  },
});

export default PremiumOverlay;
