// useKeyboardAvoidingShift.js
import { useEffect, useRef } from "react";
import {
    Keyboard,
    Animated,
    Platform,
    TextInput,
} from "react-native";

export function useKeyboardAvoidingShift(extraOffset = 15, customScroll = 80) {
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const showEvent =
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent =
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const showSub = Keyboard.addListener(showEvent, (e) => {
            const keyboardTop = e.endCoordinates.screenY;

            const focusedInput = TextInput.State.currentlyFocusedInput?.();
            if (!focusedInput) return;

            focusedInput.measureInWindow((x, y, width, height) => {
                const VISIBILITY_BUFFER = customScroll;
                const inputBottom = y + height;
                const overlap = inputBottom + extraOffset + VISIBILITY_BUFFER - keyboardTop;

                if (overlap > 0) {
                    Animated.timing(translateY, {
                        toValue: -overlap,
                        duration: Platform.OS === "ios" ? e.duration : 250,
                        useNativeDriver: true,
                    }).start();
                }
            });
        });

        const hideSub = Keyboard.addListener(hideEvent, (e) => {
            Animated.timing(translateY, {
                toValue: 0,
                duration: Platform.OS === "ios" ? e.duration : 250,
                useNativeDriver: true,
            }).start();
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    return translateY;
}