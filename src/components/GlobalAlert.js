import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";

function GlobalAlert({ visible, type, title, message, onClose }) {
  const icon =
    type === "success"
      ? require("../../assets/confirmalert.png")
      : require("../../assets/redalert.png");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Image source={icon} style={styles.icon} />

          <Text style={styles.title}>{title}</Text>

          <Text style={styles.text}>{message}</Text>

          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default GlobalAlert;

/* ✅ STYLES (Mandatory) */
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: global.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "85%",
    backgroundColor: global.colors.background,
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 22,
    alignItems: "center",
  },
  icon: {
    width: 70,
    height: 70,
    // borderRadius: 35,
    // backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: global.colors.secondary,
    marginBottom: 10,
  },
  text: {
    fontSize: 15,
    color: global.colors.textPrimary,
    textAlign: "justify",
    lineHeight: 20,
    marginBottom: 24,
  },
  btn: {
    backgroundColor: global.colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  btnText: {
    color: global.colors.background,
    fontSize: 15,
    fontWeight: "500",
  },
});
