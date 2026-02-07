import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import TextInput from "../components/TextInput";
import { Ionicons } from "@expo/vector-icons";

// Get screen width to help with responsiveness logic if needed,
// though flexbox is preferred.
const { width } = Dimensions.get("window");

const OrderInputNew = ({
  label = "Price",
  value,
  onChange,
  isValid = true,
  editable = true,
  onWarningPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.borderBox, !isValid && styles.errorBorder]}>
        <TextInput
          style={[styles.input, !editable && styles.disabledText]}
          value={String(value)}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder="0"
          editable={editable}
          placeholderTextColor={global.colors.disabled}
        />
        {/* ---- ICONS ---- */}
        {!isValid && (
          <TouchableOpacity
            onPress={onWarningPress}
            style={styles.iconContainer}
          >
            <Ionicons name="alert-circle" size={20} color={global.colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Floating Label */}
      <View style={styles.labelContainer}>
        <Text style={styles.labelText}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "48%", // 48% allows gap for 2 columns
    position: "relative",
    marginVertical: 10,
  },
  borderBox: {
    borderWidth: 1.5,
    borderColor: global.colors.primary, // Purple-ish border
    borderRadius: 8,
    paddingHorizontal: 12,
    // paddingVertical: 10,
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 52,
  },
  errorBorder: {
    borderColor: global.colors.error,
  },
  input: {
    fontSize: 16,
    fontWeight: "600",
    color: global.colors.textPrimary,
    flex: 1,
    height: "100%",
  },
  disabledText: {
    color: global.colors.disabled,
  },
  labelContainer: {
    position: "absolute",
    top: -10,
    left: 12,
    backgroundColor: global.colors.background,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  labelText: {
    fontSize: 12,
    color: global.colors.secondary,
    fontWeight: "500",
  },
  iconContainer: {
    marginLeft: 5,
  },
});

export default OrderInputNew;