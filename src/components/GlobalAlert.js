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
  console.log("type", type);
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "85%",
    backgroundColor: "#fff",
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
    color: "#1F2937",
    marginBottom: 10,
  },
  text: {
    fontSize: 15,
    color: "#4B5563",
    textAlign: "left",
    lineHeight: 20,
    marginBottom: 24,
  },
  btn: {
    backgroundColor: "#1E0A3C",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  btnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
});
