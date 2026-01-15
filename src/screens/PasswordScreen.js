import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import * as Device from "expo-device";
import { apiUrl } from "../utils/apiUrl";

export default function PasswordScreen({ navigation, route }) {
  const { name, email, phone, fcmToken } = route.params;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ip, setIp] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        setDeviceId(
          Device.osBuildId ||
            Device.modelId ||
            Device.deviceName ||
            "Unknown"
        );

        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        setIp(data.ip || "Unknown");
      } catch {
        setDeviceId("Unknown");
        setIp("Unknown");
      }
    }
    init();
  }, []);

  const handleSubmit = async () => {
    if (!password || !confirmPassword) {
      Alert.alert("Missing", "Enter password");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          signupip: ip,
          signupdeviceid: deviceId,
          fcmToken,
        }),
      });

      const result = await res.json();
      setLoading(false);

      if (result?.status) {
        Alert.alert("Success", "Signup completed");
        navigation.replace("Demat");
      } else {
        Alert.alert("Error", result.message || "Signup failed");
      }
    } catch (err) {
      setLoading(false);
      Alert.alert("Error", "Server not reachable");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Image
          source={require("../../assets/password.png")}
          style={styles.image}
          resizeMode="contain"
        />

        <Text style={styles.title}>Set Password</Text>

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextBtn}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={{ color: "#fff" }}>
              {loading ? "Submitting..." : "Finish"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 24 },
  image: { width: "100%", height: 220 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#210F47",
    marginVertical: 10,
  },
  input: {
    width: "100%",
    height: 45,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },
  backBtn: {
    backgroundColor: "#EAEAEA",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  nextBtn: {
    backgroundColor: "#210F47",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
});
