import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import NetInfo from "@react-native-community/netinfo";

export default function InternetListener() {

  const [message, setMessage] = useState(null);
  const [bg, setBg] = useState("#ff3b30");

  useEffect(() => {

    let wasOffline = false;

    const unsubscribe = NetInfo.addEventListener(state => {

      const connected = state.isConnected && state.isInternetReachable;


      if (!connected) {

        wasOffline = true;

        setMessage("⚠️ Internet connection lost");
        setBg("#ff3b30");

      } else if (wasOffline) {

        setMessage("Back online");
        setBg("#2ecc71");

        setTimeout(() => {
          setMessage(null);
        }, 2500);

        wasOffline = false;
      }

    });

    return () => unsubscribe();

  }, []);

  if (!message) return null;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    zIndex: 9999,
    elevation: 10
  },

  text: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600"
  }

});