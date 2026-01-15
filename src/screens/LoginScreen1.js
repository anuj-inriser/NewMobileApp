import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import React, { useRef, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";
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

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [screenState, setScreenState] = useState("phone");
  const { setAuthData } = useAuth();
  const inputRefs = useRef([]);

  /* 🔥 FCM INIT (NO UI IMPACT) */
  useEffect(() => {
    const initFCM = async () => {
      await messaging().requestPermission();
      const token = await messaging().getToken();
      console.log("🔥 FCM TOKEN:", token);
    };
    initFCM();
  }, []);

  const getFcmToken = async () => {
    try {
      return await messaging().getToken();
    } catch {
      return null;
    }
  };

  const handleOtpChange = (text, index) => {
    if (/^[0-9]?$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      if (text && index < otp.length - 1) {
        inputRefs.current[index + 1].focus();
      }
      if (text === "" && index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  // const handleLogin = async () => {
  //   if (!phone || phone.length < 10) {
  const handleCheckUser = async () => {
    if (!phone || phone.length !== 10 || !/^\d{10}$/.test(phone)) {
      Alert.alert(
        "Invalid Input",
        "Please enter a valid 10-digit phone number"
      );
      return;
    }

    // const enteredOtp = otp.join("");
    // if (enteredOtp.length !== 4) {
    //   Alert.alert("Invalid OTP", "Please enter a 4-digit OTP");
    //   return;
    // }

    // if (enteredOtp !== "1111") {
    //   Alert.alert("Wrong OTP", "Please enter the correct OTP");
    //   return;
    // }

    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/check-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const result = await response.json();
      setLoading(false);

      // if (result.status && result.data.exists) {
      //   // ⭐ STORE USER ID FROM CONTROLLER
      //   await setAuthData({ userId: String(result.data.userId) });

      //   // Alert.alert('Success', 'Login successful.');
      //   navigation.navigate("Demat");
      if (result.status) {
        if (result.data.exists) {
          // Existing user → show password
          setScreenState("password");
        } else {
          // New user → go directly to signup
          navigation.navigate("Signup", { phone: phone });
          return;
        }
      } else {
        Alert.alert("Error", result.message || "Failed to check user");
      }
    } catch (error) {
      setLoading(false);
      // console.error("Login error:", error);
      console.error("Check user error:", error);
      Alert.alert("Error", "Unable to connect to server.");
    }
  };
  const handleFinalLogin = async () => {
    if (screenState === "password") {
      if (!password.trim()) {
        Alert.alert("Missing", "Please enter your password");
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/api/check-user/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, password }),
        });

        const result = await response.json();
        setLoading(false);

        if (result.status && result.data?.userId) {
          await setAuthData({ userId: String(result.data.userId) });
          navigation.navigate("Demat");
        } else {
          Alert.alert("Login Failed", result.message || "Invalid credentials");
        }
      } catch (error) {
        setLoading(false);
        console.error("Login error:", error);
        Alert.alert("Error", "Unable to connect to server.");
      }
    }
  };

  const isInitial = screenState === "phone";
  const isFinalStep = screenState === "password" || screenState === "otp";

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

          {/* Phone Number Input */}
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

          {/* OTP Inputs */}
          {/* <View style={styles.otpContainer}> */}
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
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              style={styles.otpBox}
              value={digit ? "*" : ""}
              // onChangeText={(text) => {
              //   // Real digit store karo, but TextInput me mat dikhao
              //   const newDigit = text.slice(-1);
              //   handleOtpChange(newDigit, index);
              // }}
              onChangeText={(text) => handleOtpChange(text.slice(-1), index)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
            />
          ))}

          {/* Buttons */}
          <TouchableOpacity
            style={[styles.nextBtn, loading && { opacity: 0.5 }]}
            onPress={isInitial ? handleCheckUser : handleFinalLogin}
            disabled={loading}
          >
            <Text style={styles.nextText}>
              {/* {loading ? "Checking..." : "Next"} */}
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
            {/* Disclaimer: Lorem ipsum dolor sit amet, consectetur adipiscing elit,
            sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. */}
            Disclaimer: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </Text>

          <Text style={styles.tnc}>Accept T&Cs</Text>
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
  otpContainer: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "center",
  },
  otpBox: {
    width: 45,
    height: 45,
    borderRadius: 8,
    backgroundColor: "#EAEAEA",
    marginHorizontal: 5,
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  nextBtn: {
    backgroundColor: "#210F47",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 30,
    marginTop: 25,
  },
  nextText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  signUpLink: { color: "#210F47", fontWeight: "700" },
  disclaimer: {
    fontSize: 12,
    color: "#666",
    marginTop: 25,
    textAlign: "center",
  },
  tnc: { fontSize: 13, marginTop: 8, color: "#000", fontWeight: "600" },
});
