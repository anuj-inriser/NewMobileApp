import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TextInput from "../components/TextInput";
const OrderInputBox = ({
  label = "Price",
  value,
  onChange,
  isValid = true,
  editable = true,
  onWarningPress, // ⭐ Correctly received prop
}) => {
  return (
    <View style={styles.container}>
      {/* Left Label */}
      <View style={styles.labelBox}>
        <Text style={styles.labelText}>{label}</Text>
      </View>

      {/* Right Input + Icon */}
      <View style={[styles.valueBox, !editable && styles.disabledBox]}>
        <TextInput
          style={[styles.input, !editable && styles.disabledText]}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder="0"
          editable={editable}
          placeholderTextColor="#777"
        />

        {/* ---- ICONS ---- */}
        {value !== "" &&
          (isValid ? (
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
          ) : (
            <TouchableOpacity onPress={onWarningPress}>
              <Ionicons name="alert-circle" size={20} color="#ffcc00" />
            </TouchableOpacity>
          ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginVertical: 5,
  },

  labelBox: {
    backgroundColor: "#f2ebf7",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    width: 150,
    marginRight: 10,
  },

  labelText: {
    color: "#210F47",
    fontSize: 14,
    fontWeight: "600",
  },

  valueBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    width: 150,
  },

  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
    padding: 0,
    margin: 0,
  },

  disabledBox: {
    backgroundColor: "#f0f0f0",
    borderColor: "#d0d0d0",
  },

  disabledText: {
    color: "#999",
  },
});

export default OrderInputBox;
