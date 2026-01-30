import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import TextInput from "../components/TextInput";
import * as Device from "expo-device";
import { Ionicons } from "@expo/vector-icons";
import { apiUrl } from "../utils/apiUrl";
import { useAuth } from "../context/AuthContext";

export default function PasswordScreen({ navigation, route }) {
  const { name, email, phone, fcmToken } = route.params;
  const { setAuthData } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        const { userid, name, email, phone, userimage } = result.data;

        await setAuthData({
          userId: String(userid),
          userData: { name, email, phone, userimage },
        });

        navigation.navigate('App', { screen: 'Equity' })
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

        {/* Password */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeBtn}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm Password"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            onPress={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            style={styles.eyeBtn}
          >
            <Ionicons
              name={
                showConfirmPassword
                  ? "eye-off-outline"
                  : "eye-outline"
              }
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {/* Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextBtn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.nextText}>
              {loading ? "Submitting..." : "Finish"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scroll: {
    padding: 24,
  },
   image: { width: "100%", height: 220, marginTop: 90 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#210F47",
    marginVertical: 10,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 45,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 12,
    backgroundColor: "#fff",
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
  },
  eyeBtn: {
    paddingLeft: 8,
  },

  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },
  backBtn: {
    backgroundColor: "#EAEAEA",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  backText: {
    fontWeight: "600",
    color: "#000",
  },
  nextBtn: {
    backgroundColor: "#210F47",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  nextText: {
    color: "#fff",
    fontWeight: "600",
  },
});
