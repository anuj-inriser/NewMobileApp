import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
} from "react-native";
import { useDrawer } from "../context/DrawerContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProfileScreen from "../screens/ProfileScreen";

const { width, height } = Dimensions.get("window");

const ProfileSlider = () => {
  const { isProfileDrawerOpen, closeProfileDrawer } = useDrawer();
  const insets = useSafeAreaInsets(); // ✅ Safe area hook

  const slideAnim = useRef(new Animated.Value(-width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Use a local ref for the visible state to keep animation smooth
  const [isVisible, setIsVisible] = useState(isProfileDrawerOpen);

  useEffect(() => {
    if (isProfileDrawerOpen) {
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
          toValue: -width,
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
  }, [isProfileDrawerOpen]);

  if (!isVisible && !isProfileDrawerOpen) {
    return null;
  }

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 999999 }]}>
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Pressable style={styles.flex1} onPress={closeProfileDrawer} />
      </Animated.View>

      {/* Drawer Content */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: width,
            bottom: 0, // ✅ Absolute bottom ensures full height
            paddingTop: insets.top, // ✅ Proper top padding
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <ProfileScreen
          isInsideSlider={true}
          closeSlider={closeProfileDrawer}
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
    left: 0,
    backgroundColor: global.colors.primary,
  },
});

export default ProfileSlider;
