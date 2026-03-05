import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
} from "react-native";
import { useDrawer } from "../context/DrawerContext";
import NotificationScreen from "../screens/NotificationScreen";
import { useSafeAreaInsets } from "react-native-safe-area-context";


const { width, height } = Dimensions.get("window");

const NotificationSlider = () => {
    const insets = useSafeAreaInsets();
  const { isNotificationDrawerOpen, closeNotificationDrawer } = useDrawer();

  const slideAnim = useRef(new Animated.Value(width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [isVisible, setIsVisible] = useState(isNotificationDrawerOpen);

  useEffect(() => {
    if (isNotificationDrawerOpen) {
      setIsVisible(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: width,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsVisible(false);
      });
    }
  }, [isNotificationDrawerOpen]);

  if (!isVisible && !isNotificationDrawerOpen) {
    return null;
  }

  return (
    <View
      style={[StyleSheet.absoluteFillObject, { zIndex: 999999 }]}
      pointerEvents={isNotificationDrawerOpen ? "auto" : "none"}
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
        <Pressable style={styles.flex1} onPress={closeNotificationDrawer} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: width,
            bottom: 0,
            paddingTop: insets.top,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <NotificationScreen
          isInsideSlider={true}
          closeSlider={closeNotificationDrawer}
        />
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
    right: 0,
    backgroundColor: global.colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 10,
  },
});

export default NotificationSlider;
