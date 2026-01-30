import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import TextInput from "../components/TextInput";
import axiosInstance from "../api/axios";
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
  const [errors, setErrors] = useState({});

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

  const validate = () => {
    const e = {};

    if (!password)
      e.password = "Password required";
    else if (password.length < 6)
      e.password = "Password must be at least 6 characters";
    else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
      e.password = "Password must contain 1 special character";

    if (!confirmPassword)
      e.confirmPassword = "Confirm password required";
    else if (password !== confirmPassword)
      e.confirmPassword = "Passwords do not match";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const payload = {
        name,
        phone,
        password,
        signupip: ip,
        signupdeviceid: deviceId,
        fcmToken,
      };

      if (email && email.trim()) {
        payload.email = email.trim();
      }

      // const res = await fetch(`${apiUrl}/api/signup`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(payload),
      // });

      // const result = await res.json();
      const res = await fetch(`${apiUrl}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let result;
      try {
        result = await res.json();
      } catch (e) {
        throw new Error("Server returned invalid JSON");
      }

      setLoading(false);

      if (result?.status) {
        const { userid, name, email, phone, userimage } = result.data;

        await setAuthData({
          userId: String(userid),
          userData: { name, email, phone, userimage },
        });

        // const res = await axiosInstance.get(`/me/permissions`);
        // await setAuthData({ permissions: JSON.stringify(res.data) });

        navigation.navigate("Login", { screen: "LoginScreen" });
      } else {
        setErrors({
          general: result.message || "Signup failed",
        });
      }
    } catch (err) {
      console.log("Signup Error:", err);
      setLoading(false);
      setErrors({
        general: err.message || "Server not reachable",
      });
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

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setErrors({ ...errors, password: "" });
            }}
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
        {!!errors.password && (
          <Text style={styles.errorText}>{errors.password}</Text>
        )}

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm Password"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={(t) => {
              setConfirmPassword(t);
              setErrors({ ...errors, confirmPassword: "" });
            }}
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
        {!!errors.confirmPassword && (
          <Text style={styles.errorText}>
            {errors.confirmPassword}
          </Text>
        )}

        {!!errors.general && (
          <Text style={styles.errorText}>{errors.general}</Text>
        )}

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
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 24 },
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
  passwordInput: { flex: 1, fontSize: 16 },
  eyeBtn: { paddingLeft: 8 },
  errorText: {
    width: "100%",
    color: "red",
    fontSize: 12,
    marginTop: 4,
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
  backText: { fontWeight: "600", color: "#000" },
  nextBtn: {
    backgroundColor: "#210F47",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  nextText: { color: "#fff", fontWeight: "600" },
});
