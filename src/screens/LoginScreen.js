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
  Modal,
  Animated,
  Linking
} from "react-native";
import TextInput from "../components/TextInput";
import { apiUrl } from "../utils/apiUrl";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axios";
import { getPushToken } from "../../src/utils/pushToken";
import { ChartPrefetchService } from "../services/ChartPrefetchService";
import { useKeyboardAvoidingShift } from "../hooks/useKeyboardAvoidingShift";
import { setWSUser } from "../ws/marketWs";

export default function LoginScreen({ navigation }) {
  const translateY = useKeyboardAvoidingShift();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [screenState, setScreenState] = useState("phone");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState(["", "", "", ""]);
  const [acceptedTnc, setAcceptedTnc] = useState(false);
  const [phoneOtpModalOpen, setPhoneOtpModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('')
  const [tncError, setTncError] = useState("");
  const openTnC = () => {
    Linking.openURL("https://www.equitty.one/terms");
  };
  const otpInputRefs = useRef([]);
  const [showPhoneOtpModal, setShowPhoneOtpModal] = useState(false);
  const [phoneOtpError, setPhoneOtpError] = useState("");
  const [phoneOtpTimer, setPhoneOtpTimer] = useState(30);
  const [canResendPhoneOtp, setCanResendPhoneOtp] = useState(false);
  const [phoneOtpVerified, setPhoneOtpVerified] = useState(false);


  useEffect(() => {
    let interval;

    if (phoneOtpModalOpen && !canResendPhoneOtp) {
      interval = setInterval(() => {
        setPhoneOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResendPhoneOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [phoneOtpModalOpen, canResendPhoneOtp]);
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

  const handlePhoneOtpChange = (text, index) => {
    if (!/^\d?$/.test(text)) return; // only 1 digit allowed

    const updated = [...phoneOtp];
    updated[index] = text;
    setPhoneOtp(updated);

    // 👉 Move to next box automatically
    if (text && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // 👈 Move to previous box on backspace
    if (!text && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const sendProfilePhoneOtp = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/signup/send-phone-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      console.log("response ", response)

      if (!response.ok) {
        throw new Error("Failed to send OTP");
      }

      const data = await response.json();

      // reset OTP fields
      setPhoneOtp(["", "", "", ""]);
      // setCanResendPhoneOtp(false);

      // open modal
      setPhoneOtpModalOpen(true);

    } catch (err) {
      console.log("OTP Error:", err);
      setEditErrors({ mobile: "Failed to send OTP" });
    }
  };

  const verifyProfilePhoneOtp = async () => {
    const enteredOtp = phoneOtp.join("");

    if (enteredOtp.length !== 4) {
      setPhoneOtpError("Enter OTP");
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/signup/verify-phone-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone,
          otp: enteredOtp,
        }),
      });

      const data = await res.json();
      console.log('data', data)

      if (!data.success) {
        setPhoneOtpError("Invalid OTP");
        return;
      }

      // ✅ FIX HERE
      setPhoneOtpVerified(true);

      setPhoneOtpModalOpen(false);
      setResetPasswordModalOpen(true)
      // setEditErrors((p) => ({ ...p, mobile: "" }));
    } catch {
      setPhoneOtpError("Verification failed");
    }
  };

  const verifyResetPassword = async () => {
    if (resetPassword !== confirmPassword) {
      setPhoneOtpError("Password do not match");
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/signup/update-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone,
          password: resetPassword,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setPhoneOtpError("Invalid OTP");
        return;
      }
      setResetPasswordModalOpen(false)

    } catch (error) {

    }
  }

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

    let loginMeta = {
      success: false,
      message: "",
    };

    try {
      const fcmToken = await getPushToken();
      const deviceId =
        Device.osBuildId || Device.modelId || Device.deviceName || "Unknown";
      const ipAddress = await getIpAddress();
      const response = await axiosInstance.post(`/check-user/login`, {
        phone,
        password,
        fcmToken,
        device_id: deviceId,
        ip_address: ipAddress,
      });

      const result = response.data;
      if (result.status && result.data?.userId) {
        loginMeta.success = true;
        loginMeta.message = result.message || "Login successful";
      }
      setLoading(false);

      if (result.status && result.data?.userId) {
        // console.log("******888")
        ChartPrefetchService.prefetchWatchlist();
        const { userId, name, email, phone, userimage, token, permission } =
        result.data;
        await setAuthData({
          userId: String(userId),
          userData: { name, email, phone, userimage },
          token,
          fcmToken,
          role: permission,
        });
        setWSUser(result.data?.userId);

        const res = await axiosInstance.get(`/me/permissions`);

        if (res?.permissionDenied || !res?.data) {
          await setAuthData({ permissions: [] });
        } else {
          await setAuthData({
            permissions: res?.data?.permissions ?? [],
          });
        }

        navigation.navigate("App", { screen: "Equity" });
      } else {
        setErrors({ password: result.message || "Invalid password" });
      }

      // console.log("control coming here")
    } catch (e) {
      loginMeta.message = e?.response?.data?.message || "Login failure";
      setLoading(false);
      setErrors({ password: e?.response?.data?.message || "Incorrect password" });
    } finally {
      try {
        const deviceId =
          Device.osBuildId || Device.modelId || Device.deviceName || "Unknown";

        await axiosInstance.post("/eventlog", {
          phone,
          success: loginMeta.success,
          device_id: deviceId,
          event_group_id: 1,
          event_type: 'Login',
          content: loginMeta.message,
          app_version: "1.0.0"
        });
      } catch (err) {
        console.log("Logging failed", err);
      }
    }
  };

  const isInitial = screenState === "phone";
  const handleSubmit = () => {
    isInitial ? handleCheckUser() : handleFinalLogin();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Image - yeh keyboard open hone pe bhi fixed rahegi */}
      <View style={styles.imageWrapper}>
        <Image
          source={require("../../assets/login.png")}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      <KeyboardAwareScrollView
        extraHeight={150}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Login</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.prefix}>+91</Text>
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            placeholderTextColor={global.colors.textSecondary}
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
                  color={global.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {!!errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
            <TouchableOpacity
              onPress={sendProfilePhoneOtp}
              style={styles.forgetPassword}
            >
              <Text>Forget Password?</Text>
            </TouchableOpacity>
          </>
        )}

        {!!errors.general && (
          <Text style={styles.errorText}>{errors.general}</Text>
        )}

        <View style={styles.tncRow}>
          <Text style={styles.tncText}>
            I accept the{" "}
            <Text style={styles.tncLink} onPress={openTnC}>
              T&Cs
            </Text>
          </Text>
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
              <Ionicons
                name="checkmark"
                size={14}
                color={global.colors.background}
              />
            )}
          </TouchableOpacity>
        </View>

        {!!tncError && <Text style={styles.errorText1}>{tncError}</Text>}

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
            <Text style={styles.nextText}>{isInitial ? "Next" : "Login"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.signupRow}>
          <Text>No Account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.signUpLink}> Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* <Text style={styles.disclaimer}>
          Disclaimer: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </Text> */}

        <Modal visible={phoneOtpModalOpen} transparent animationType="fade">
          <View style={popupStyles.overlay}>
            <View style={popupStyles.box}>
              <Text style={popupStyles.title}>Verify OTP</Text>
              <Text style={popupStyles.sub}>
                OTP sent to +91 {phone}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  marginTop: 14,
                }}
              >
                {phoneOtp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (otpInputRefs.current[index] = ref)}
                    style={styles.otpBox}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(text) => handlePhoneOtpChange(text, index)}
                    textAlign="center"
                    autoFocus={index === 0} // 🔥 cursor on first box
                  />
                ))}
              </View>

              {!!phoneOtpError && (
                <Text style={{ color: "red", fontSize: 12 }}>
                  {phoneOtpError}
                </Text>
              )}

              {!canResendPhoneOtp ? (
                <Text style={{ fontSize: 12, marginTop: 10 }}>
                  Resend OTP in {phoneOtpTimer}s
                </Text>
              ) : (
                <TouchableOpacity onPress={resendProfilePhoneOtp}>
                  <Text
                    style={{
                      color: global.colors.secondary,
                      fontWeight: "700",
                      marginTop: 10,
                    }}
                  >
                    Resend OTP
                  </Text>
                </TouchableOpacity>
              )}

              <View style={popupStyles.btnRow}>
                <TouchableOpacity onPress={() => setPhoneOtpModalOpen(false)}>
                  <Text style={popupStyles.cancel}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={verifyProfilePhoneOtp}>
                  <Text style={popupStyles.verify}>Verify</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={resetPasswordModalOpen} transparent animationType="fade">
          <Animated.View style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center", transform: [{ translateY }]
          }}>
            <View style={popupStyles.box}>
              <Text style={popupStyles.title}>Change Password</Text>

              {/* New Password */}
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputField}>
                <TextInput
                  style={styles.inputText}
                  placeholder="Enter new password"
                  secureTextEntry={!showNewPassword}
                  value={resetPassword}
                  onChangeText={setResetPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#777"
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputField}>
                <TextInput
                  style={styles.inputText}
                  placeholder="Confirm password"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  <Ionicons
                    name={
                      showConfirmPassword
                        ? "eye-off-outline"
                        : "eye-outline"
                    }
                    size={20}
                    color="#777"
                  />
                </TouchableOpacity>
              </View>

              {!!phoneOtpError && (
                <Text style={styles.error}>{phoneOtpError}</Text>
              )}

              <View style={popupStyles.btnRow}>
                <TouchableOpacity
                  onPress={() => setResetPasswordModalOpen(false)}
                >
                  <Text style={popupStyles.cancel}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={verifyResetPassword}>
                  <Text style={popupStyles.verify}>Reset</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </Modal>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: global.colors.background },
  imageWrapper: {
    width: "100%",
    height: 220,
    marginTop: 120,
    alignItems: "center",
    backgroundColor: "#fff",
    position: "absolute",
  },
  scroll: {
    padding: 12,
    alignItems: "center",
    paddingTop: 350,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  title: {

    fontSize: 20,
    fontWeight: "700",
    color: global.colors.secondary,
    marginVertical: 10,

  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: global.colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    width: "100%",
    height: 45,
    backgroundColor: global.colors.background,
  },
  prefix: { fontSize: 16, marginRight: 6, color: global.colors.textPrimary },
  input: { flex: 1, fontSize: 16, color: global.colors.textPrimary },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: global.colors.surface,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    width: "100%",
    height: 45,
    backgroundColor: global.colors.background,
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
    backgroundColor: global.colors.primary,
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  backText: { fontSize: 16, fontWeight: "600", color: global.colors.secondary },
  nextBtn: {
    backgroundColor: global.colors.secondary,
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  nextText: {
    color: global.colors.background,
    fontWeight: "600",
    fontSize: 16,
  },
  signupRow: {
    flexDirection: "row",
    marginTop: 15,
    alignItems: "center",
  },
  signUpLink: { color: global.colors.secondary, fontWeight: "700" },
  disclaimer: {
    fontSize: 12,
    color: global.colors.textSecondary,
    marginTop: 25,
    textAlign: "center",
  },
  tnc: {
    fontSize: 13,
    marginTop: 8,
    color: global.colors.textPrimary,
    fontWeight: "600",
  },
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
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: global.colors.textSecondary,
    borderRadius: 4,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  checkboxChecked: {
    backgroundColor: global.colors.secondary,
    borderColor: global.colors.secondary,
  },

  checkboxError: {
    borderColor: global.colors.error,
  },

  tncText: {
    color: "#000",
    marginRight: 3,
  },

  tncLink: {
    fontWeight: "700",
    color: global.colors.secondary,
  },

  forgetPassword: {
    textAlign: 'left',
    outlineColor: 'blue'
  },
  otpBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    marginHorizontal: 6,
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },

  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    marginTop: 12,
    color: "#333",
  },

  inputField: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dcdcdc",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 48,
    backgroundColor: "#fff",
  },

  inputText: {
    flex: 1,
    fontSize: 15,
    color: "#000",
  },

  error: {
    color: "red",
    fontSize: 12,
    marginTop: 8,
  },

});

const popupStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: global.colors.secondary,
    marginBottom: 6,
  },
  inputField: {
    backgroundColor: global.colors.background,
    borderRadius: 12,
    paddingVertical: 2, // 👈 height control
    paddingHorizontal: 14,
    marginBottom: 12, // 👈 thoda compact
  },
  inputText: {
    color: global.colors.textSecondary,
    fontSize: 14,
  },
  sub: {
    fontSize: 13,
    color: "#555",
    marginBottom: 14,
  },
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  cancel: {
    marginRight: 20,
    color: "#555",
    fontWeight: "600",
  },
  verify: {
    color: global.colors.secondary,
    fontWeight: "700",
  },
  verifyBtn: {
    marginTop: 8,
    backgroundColor: global.colors.secondary,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: "flex-end",
  },
  verifyText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 10,
  },
  verifyphoneBtn: {
    marginBottom: 8,
    marginTop: -4,
    backgroundColor: global.colors.secondary,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: "flex-end",
  },
  verifyphoneText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 10,
  },
  Slidertitle: {
    position: "absolute",
    left: 16,
    top: 5,
    zIndex: 999,
    padding: 8,
    fontSize: 18,
    fontWeight: "500",

    marginBottom: 10,
    paddingHorizontal: 16,
    color: global.colors.textPrimary,
    textAlign: "left",
  },
});
