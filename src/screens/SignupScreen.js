import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  Animated
} from "react-native";
import TextInput from "../components/TextInput";
import { getPushToken } from "../utils/pushToken";
import { Ionicons } from "@expo/vector-icons";
import { apiUrl } from "../utils/apiUrl";
import { useKeyboardAvoidingShift } from "../hooks/useKeyboardAvoidingShift";


export default function SignupScreen({ navigation, route }) {
  const translateY = useKeyboardAvoidingShift();
  const initialPhone = route?.params?.phone || "";
  const [acceptedTnc, setAcceptedTnc] = useState(false);
  const [tncError, setTncError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [errors, setErrors] = useState({});
  const [otpStep, setOtpStep] = useState(false);

  const inputRefs = useRef([]);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // EMAIL OTP STATES
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);

  const handleOtpChange = (text, index) => {
    if (!/^[0-9]?$/.test(text)) return;

    const updated = [...otp];
    updated[index] = text;
    setOtp(updated);

    if (text && index < 3) inputRefs.current[index + 1]?.focus();
    if (!text && index > 0) inputRefs.current[index - 1]?.focus();
  };
  React.useEffect(() => {
    let interval;

    if (otpStep && !canResend) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [otpStep, canResend]);
  const resendOtp = async () => {
    await sendPhoneOtp();

    setOtp(["", "", "", ""]);
    setResendTimer(30);
    setCanResend(false);
  };

  const validate = () => {
    const e = {};

    if (!name.trim()) e.name = "Name required";

    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email))
      e.email = "Invalid email address";

    if (email && !emailVerified)
      e.email = "Please verify your email";

    if (!phone.trim()) e.phone = "Phone number required";
    else if (!/^\d{10}$/.test(phone))
      e.phone = "Enter valid 10 digit number";

    // if (otp.join("") !== "1111")
    //   e.otp = "Invalid OTP";

    // if (otp.join("") === "")
    //   e.otp = "Please Enter OTP";

    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const verifyOtp = async () => {
    const enteredOtp = otp.join("");

    if (enteredOtp.length !== 4) {
      setErrors({ otp: "Please enter OTP" });
      return;
    }

    const res = await fetch(`${apiUrl}/api/signup/verify-phone-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        otp: enteredOtp,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      setErrors({ otp: "Invalid OTP" });
      return;
    }

    // ✅ OTP verified → Next page
    const fcmToken = await getPushToken();

    navigation.navigate("Password", {
      name,
      email: email.trim() || null,
      phone,
      fcmToken,
    });
  };

  const sendPhoneOtp = async () => {
    await fetch(`${apiUrl}/api/signup/send-phone-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
  };

  // const handleNext = async () => {
  //   if (!otpStep) {
  //     if (!validate()) return;

  //     if (!acceptedTnc) {
  //       setTncError("Please accept Terms & Conditions");
  //       return;
  //     }

  //     setTncError("");

  //     const fcmToken = await getPushToken();

  //     navigation.navigate("Password", {
  //       name,
  //       email: email.trim() || null,
  //       phone,
  //       fcmToken,
  //     });
  //     // 🔥 SEND OTP
  //     await sendPhoneOtp();

  //     // Reset OTP
  //     setOtp(["", "", "", ""]);

  //     // Move to OTP step
  //     setOtpStep(true);
  //     return;
  //   }

  //   // STEP 2 → OTP VERIFY
  //   verifyOtp();
  // };

  const handleNext = async () => {
    // STEP 1: FORM SUBMIT → SEND OTP
    if (!otpStep) {
      if (!validate()) return;

      if (!acceptedTnc) {
        setTncError("Please accept Terms & Conditions");
        return;
      }

      setTncError("");

      // 🔥 SEND OTP ONLY
      await sendPhoneOtp();

      // reset otp boxes
      setOtp(["", "", "", ""]);
      // show OTP boxes
      setOtpStep(true);
      setResendTimer(30);
      setCanResend(false);

      return; // ⛔ VERY IMPORTANT
    }

    // STEP 2: OTP VERIFY
    verifyOtp();
  };


  // SEND EMAIL OTP
  const sendEmailOtp = async () => {
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      alert("Please enter a valid email");
      return;
    }

    try {
      setEmailLoading(true);
      const res = await fetch(`${apiUrl}/api/signup/send-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Failed to send OTP");
        return;
      }

      setEmailOtp("");
      setEmailOtpError("");
      setShowEmailOtpModal(true);
    } catch (err) {
      console.log("OTP ERROR:", err);
      alert("Network error");
    } finally {
      setEmailLoading(false);
    }
  };



  // VERIFY EMAIL OTP
  const verifyEmailOtp = async () => {
    if (!emailOtp.trim()) {
      setEmailOtpError("Please enter OTP");
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/signup/verify-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: emailOtp }),
      });

      const data = await res.json();

      if (!data.success) {
        setEmailOtpError("OTP not matched");
        return;
      }

      setEmailVerified(true);
      setErrors((prev) => ({ ...prev, email: "" })); // 🔥 IMPORTANT LINE
      setShowEmailOtpModal(false); // ✅ popup close
    } catch {
      setEmailOtpError("Verification failed");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.fixedImageContainer}>
        <Image
          source={require("../../assets/signup.png")}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      <Animated.View style={[styles.formContent, { transform: [{ translateY }] }]}>

        <Text style={styles.title}>Sign up</Text>

        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={(t) => {
            setName(t);
            setErrors({ ...errors, name: "" });
          }}
        />
        {!!errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Email (optional)"
          keyboardType="email-address"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            setEmailVerified(false);
          }}
        />

        {email && !emailVerified && (
          <TouchableOpacity
            style={styles.verifyBtn}
            onPress={sendEmailOtp}
            disabled={emailLoading}
          >
            <Text style={styles.verifyText}>
              {emailLoading ? "Sending OTP..." : "Verify Email"}
            </Text>
          </TouchableOpacity>
        )}

        {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        {emailVerified && (
          <Text style={{ color: "green", marginTop: 6, alignSelf: "flex-end", fontSize: 10, }}>
            ✓ Email verified
          </Text>
        )}

        <View style={styles.phoneRow}>
          <Text style={styles.prefix}>+91</Text>
          <TextInput
            editable={!otpStep}
            style={styles.phoneInput}
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              setErrors({ ...errors, phone: "" });
            }}
          />
        </View>
        {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        {otpStep && (
          <>
            <View style={styles.otpRow}>
              {otp.map((d, i) => (
                <TextInput
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  style={styles.otpBox}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={d ? "*" : ""}
                  onChangeText={(t) => {
                    handleOtpChange(t.slice(-1), i);
                    setErrors({ ...errors, otp: "" });
                  }}
                  textAlign="center"
                />
              ))}
            </View>
            <View style={{ marginTop: 12, alignItems: "center" }}>
              {!canResend ? (
                <Text style={{ fontSize: 12, color: "#777" }}>
                  Resend OTP in {resendTimer}s
                </Text>
              ) : (
                <TouchableOpacity onPress={resendOtp}>
                  <Text style={{ color: global.colors.secondary, fontWeight: "700" }}>
                    Resend OTP
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {!!errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}
          </>
        )}
        <View style={styles.tncRow}>
          <TouchableOpacity
            onPress={() => {
              setAcceptedTnc((p) => !p);
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

          <Text style={styles.tncText}>
            I accept the <Text style={styles.tncLink}>T&Cs</Text>
          </Text>
        </View>

        {!!tncError && (
          <Text style={styles.errorText1}>{tncError}</Text>
        )}

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextText}>
              {otpStep ? "Verify OTP" : "Next"}
            </Text>

          </TouchableOpacity>
        </View>

        {/* EMAIL OTP POPUP */}
        <Modal visible={showEmailOtpModal} transparent animationType="fade">
          <View style={popupStyles.overlay}>
            <View style={popupStyles.box}>
              <Text style={popupStyles.title}>Verify Email</Text>
              <Text style={popupStyles.sub}>OTP sent to {email}</Text>

              <TextInput
                style={popupStyles.input}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="Enter OTP"
                value={emailOtp}
                onChangeText={(t) => {
                  setEmailOtp(t);        // ✅ ONLY OTP CHANGE
                  setEmailOtpError("");
                }}


              />

              {!!emailOtpError && (
                <Text style={styles.errorText}>{emailOtpError}</Text>
              )}

              <View style={popupStyles.btnRow}>
                <TouchableOpacity onPress={() => setShowEmailOtpModal(false)}>
                  <Text style={popupStyles.cancel}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={verifyEmailOtp}>
                  <Text style={popupStyles.verify}>Verify</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: global.colors.background },
  scroll: { padding: 12, alignItems: "center" },
  image: {
    width: "100%",
    height: 200,
  },
  fixedImageContainer: {
    // This stays fixed at the top
    marginTop: 110,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  formContent: {
    padding: 20,
    alignItems: "center",
    // Note: removed marginTop here — handled via dynamic style
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: global.colors.secondary,
    alignSelf: "flex-start",
    marginVertical: 10,
  },
  input: {
    width: "100%",
    height: 45,
    borderWidth: 1,
    borderColor: global.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 12,
    backgroundColor: global.colors.background,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 45,
    borderWidth: 1,
    borderColor: global.colors.border,
    borderRadius: 10,
    marginTop: 12,
    paddingHorizontal: 12,
    backgroundColor: global.colors.background,
  },
  prefix: { fontSize: 16, marginRight: 6, color: global.colors.textPrimary },
  phoneInput: { flex: 1, fontSize: 16, color: global.colors.textPrimary },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  otpBox: {
    width: 45,
    height: 45,
    borderRadius: 8,
    backgroundColor: global.colors.surface,
    marginHorizontal: 6,
    fontSize: 18,
    fontWeight: "600",
    color: global.colors.textPrimary,
  },
  errorText: {
    width: "100%",
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 25,
  },
  backBtn: {
    backgroundColor: global.colors.surface,
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  backText: { fontWeight: "600", color: global.colors.textPrimary },
  nextBtn: {
    backgroundColor: global.colors.secondary,
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  nextText: { color: global.colors.background, fontWeight: "600" },
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
    fontSize: 13,
    color: global.colors.textPrimary,
  },
  tncLink: {
    fontWeight: "700",
    color: global.colors.secondary,
  },
  errorText1: {
    width: "100%",
    color: global.colors.error,
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
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
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
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
});