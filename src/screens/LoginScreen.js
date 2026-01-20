import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import React, { useRef, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

import { apiUrl } from "../utils/apiUrl";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axios";
import { getPushToken } from "../../src/utils/pushToken"; // ✅ EXPO PUSH
import { ChartPrefetchService } from "../services/ChartPrefetchService";

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [screenState, setScreenState] = useState("phone");

  const { setAuthData } = useAuth();
  const inputRefs = useRef([]);

  /* 🔥 INIT PUSH TOKEN (NO UI IMPACT) */
  useEffect(() => {
    (async () => {
      const token = await getPushToken();
      console.log("🔥 Login Push Token:", token);
      // 👉 Agar chaaho to yahin AsyncStorage me bhi save kar sakte ho
    })();
  }, []);

  const handleOtpChange = (text, index) => {
    if (/^[0-9]?$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      if (text && index < otp.length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
      if (text === "" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  /* 🔍 CHECK USER */
  const handleCheckUser = async () => {
    if (!/^\d{10}$/.test(phone)) {
      Alert.alert("Invalid Input", "Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/check-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const result = await response.json();
      setLoading(false);

      if (result.status) {
        if (result.data?.exists) {
          // Existing user → ask password
          setScreenState("password");
        } else {
          // New user → signup
          navigation.navigate("Signup", { phone });
        }
      } else {
        Alert.alert("Error", result.message || "Failed to check user");
      }
    } catch (err) {
      setLoading(false);
      console.error("Check user error:", err);
      Alert.alert("Error", "Unable to connect to server.");
    }
  };

  /* 🔐 FINAL LOGIN */
  const handleFinalLogin = async () => {
    // console.log("trying to login")
    if (!password.trim()) {
      Alert.alert("Missing", "Please enter your password");
      return;
    }

    setLoading(true);
    try {
      // const response = await fetch(`${apiUrl}/api/check-user/login`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ phone, password }),
      // });
      const fcmToken = await getPushToken();
      const response = await axiosInstance.post(`/check-user/login`, { phone, password, fcmToken })

      const result = response.data;
      setLoading(false);

      if (result.status && result.data?.userId) {
                ChartPrefetchService.prefetchWatchlist();
        const { userId, name, email, phone, userimage } = result.data;

        console.log("logged in success", result.data);
        await setAuthData({ userId: String(result.data.userId), userData: { name, email, phone, userimage }, fcmToken });
        await setAuthData({ token: result.data.token });
        // await setAuthData({ permissions: result.data.permissions });
        await fetchAndStorePermissions();
        navigation.navigate("Demat");
      } else {
        Alert.alert("Login Failed", result.message || "Invalid credentials");
      }
    } catch (err) {
      setLoading(false);
      console.error("Login error:", err);
      Alert.alert("Error", "Unable to connect to server.");
    }
  };

  const fetchAndStorePermissions = async () => {
    console.log("inside fetch")
    try {
      const res = await axiosInstance.get(`/me/permissions`);

      console.log("res ", res.data)
      // Save permissions in AuthContext
      await setAuthData({
        permissions: JSON.stringify(res.data),
      });
    } catch (err) {
      console.error("Permission fetch failed", err);
    }
  };

  const isInitial = screenState === "phone";

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView
        extraHeight={300}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Image
            source={require("../../assets/login.png")}
            style={styles.image}
            resizeMode="contain"
          />

          <Text style={styles.title}>Login</Text>

          {/* 📱 Phone */}
          <View style={styles.inputContainer}>
            <Text style={styles.prefix}>+91</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Phone No."
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          {/* 🔐 Password */}
          {screenState === "password" && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          )}

          {/* 🔢 OTP UI (future use) */}
          {/*<View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                style={styles.otpBox}
                value={digit ? "*" : ""}
                onChangeText={(text) =>
                  handleOtpChange(text.slice(-1), index)
                }
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
              />
            ))}
          </View>*/}


          {/* ▶️ BUTTON */}
          <TouchableOpacity
            style={[styles.nextBtn, loading && { opacity: 0.5 }]}
            onPress={isInitial ? handleCheckUser : handleFinalLogin}
            disabled={loading}
          >
            <Text style={styles.nextText}>
              {loading ? "Processing..." : isInitial ? "Next" : "Login"}
            </Text>
          </TouchableOpacity>

          <View style={styles.signupRow}>
            <Text>No Account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.signUpLink}> Sign up</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            Disclaimer: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </Text>

          <Text style={styles.tnc}>Accept T&Cs</Text>
        </ScrollView>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

/* 🎨 STYLES */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 12, alignItems: "center" },
  image: { width: "100%", height: 220, marginTop: 90 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#210F47",
    marginVertical: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    width: "100%",
    height: 45,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  prefix: { fontSize: 16, marginRight: 6, color: "#000" },
  input: { flex: 1, fontSize: 16 },
  otpBox: {
    width: 45,
    height: 45,
    borderRadius: 8,
    backgroundColor: "#EAEAEA",
    marginHorizontal: 5,
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginTop: 10,
  },
  nextBtn: {
    backgroundColor: "#210F47",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 30,
    marginTop: 25,
  },
  nextText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  signupRow: {
    flexDirection: "row",
    marginTop: 15,
    alignItems: "center",
  },
  signUpLink: { color: "#210F47", fontWeight: "700" },
  disclaimer: {
    fontSize: 12,
    color: "#666",
    marginTop: 25,
    textAlign: "center",
  },
  tnc: { fontSize: 13, marginTop: 8, color: "#000", fontWeight: "600" },
});
