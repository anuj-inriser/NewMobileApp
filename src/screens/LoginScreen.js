import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import React, { useRef, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Device from "expo-device";
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
import { apiUrl } from "../utils/apiUrl";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axios";
import { getPushToken } from "../../src/utils/pushToken";
import { ChartPrefetchService } from "../services/ChartPrefetchService";

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [screenState, setScreenState] = useState("phone");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTnc, setAcceptedTnc] = useState(false);
  const [tncError, setTncError] = useState("");
  const getIpAddress = async () => {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      return data.ip;
    } catch {
      return null;
    }
  };
  const { setAuthData } = useAuth();

  useEffect(() => {
    (async () => {
      await getPushToken();
    })();
  }, []);

  const validatePhone = () => {
    if (!phone.trim()) return "Phone number required";
    if (!/^\d{10}$/.test(phone)) return "Enter valid 10 digit phone number";
    return "";
  };

  const validatePassword = () => {
    if (!password.trim()) return "Password required";
    return "";
  };

  const handleCheckUser = async () => {
    const phoneError = validatePhone();
    if (phoneError) {
      setErrors({ phone: phoneError });
      return;
    }

    setErrors({});
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
          setScreenState("password");
        } else {
          navigation.navigate("Signup", { phone });
        }
      } else {
        setErrors({ general: result.message || "Something went wrong" });
      }
    } catch (e) {
      setLoading(false);
      setErrors({ general: "Server not reachable" });
    }
  };

  const handleFinalLogin = async () => {
    if (!acceptedTnc) {
      setTncError("Please accept Terms & Conditions");
      return;
    }

    setTncError("");
    const passwordError = validatePassword();
    if (passwordError) {
      setErrors({ password: passwordError });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const fcmToken = await getPushToken();
      const deviceId = Device.osBuildId ||
        Device.modelId ||
        Device.deviceName ||
        "Unknown"
      const ipAddress = await getIpAddress();
      const response = await axiosInstance.post(`/check-user/login`, {
        phone,
        password,
        fcmToken,
        device_id: deviceId,
        ip_address: ipAddress,
      });

      const result = response.data;
      setLoading(false);

      if (result.status && result.data?.userId) {
        ChartPrefetchService.prefetchWatchlist();
        const { userId, name, email, phone, userimage, token } = result.data;

        await setAuthData({
          userId: String(userId),
          userData: { name, email, phone, userimage },
          token,
          fcmToken,
        });

        const res = await axiosInstance.get(`/me/permissions`);
        await setAuthData({ permissions: JSON.stringify(res.data) });

        navigation.navigate("App", { screen: "Equity" });
      } else {
        setErrors({ password: result.message || "Invalid password" });
      }
    } catch (e) {
      setLoading(false);
      setErrors({ password: "Incorrect password" });
    }
  };

  const isInitial = screenState === "phone";
  const handleSubmit = () => {
    isInitial ? handleCheckUser() : handleFinalLogin();
  };

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

          <View style={styles.inputContainer}>
            <Text style={styles.prefix}>+91</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Phone No."
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              editable={screenState !== "password"}
              onChangeText={(t) => {
                setPhone(t);
                setErrors({ ...errors, phone: "" });
              }}
            />
          </View>
          {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

          {screenState === "password" && (
            <>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter Password"
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
            </>
          )}

          {!!errors.general && (
            <Text style={styles.errorText}>{errors.general}</Text>
          )}

          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.nextBtn, loading && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.nextText}>
                {isInitial ? "Next" : "Login"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.signupRow}>
            <Text>No Account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.signUpLink}> Sign up</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            Disclaimer: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </Text>

          <View style={styles.tncRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPressIn={(e) => e.stopPropagation()}
              onPress={() => {
                setAcceptedTnc((prev) => !prev);
                setTncError("");
              }}
              style={[
                styles.checkbox,
                acceptedTnc && styles.checkboxChecked,
                tncError && styles.checkboxError,
              ]}
            >
              {acceptedTnc && (
                <Ionicons name="checkmark" size={14} color="#fff" />
              )}
            </TouchableOpacity>


            <Text style={styles.tncText}>
              I accept the <Text style={styles.tncLink}>T&Cs</Text>
            </Text>
          </View>

          {!!tncError && (
            <Text style={styles.errorText1}>{tncError}</Text>
          )}

        </ScrollView>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

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
  prefix: { fontSize: 16, marginRight: 6, color: "#000" },
  input: { flex: 1, fontSize: 16 },
  passwordContainer: {
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
  passwordInput: { flex: 1, fontSize: 16 },
  eyeBtn: { paddingLeft: 8 },
  errorText: {
    width: "100%",
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
  errorText1: {
    width: "100%",
    color: "red",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },

  backBtn: {
    backgroundColor: "#EAEAEA",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  backText: { fontSize: 16, fontWeight: "600", color: "#210F47" },
  nextBtn: {
    backgroundColor: "#210F47",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  nextText: { color: "#fff", fontWeight: "600" },
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
  topBar: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  tncRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    width: "100%",
  },

  checkbox: {
    width: 17,
    height: 17,
    borderWidth: 1.5,
    borderColor: "#666",
    borderRadius: 4,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  checkboxChecked: {
    backgroundColor: "#210F47",
    borderColor: "#210F47",
  },

  checkboxError: {
    borderColor: "red",
  },

  tncText: {
    fontSize: 13,
    color: "#000",
  },

  tncLink: {
    fontWeight: "700",
    color: "#210F47",
  },

});