import React, { useRef, useState } from "react";
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

import messaging from "@react-native-firebase/messaging";

export default function SignupScreen({ navigation, route }) {
  const initialPhone = route?.params?.phone || "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef([]);

  const handleOtpChange = (text, index) => {
    if (/^[0-9]?$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);
      if (text && index < otp.length - 1) {
        inputRefs.current[index + 1]?.focus();
      } else if (text === "" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleNext = async () => {
    const enteredOtp = otp.join("");

    if (!name || !email || !phone) {
      Alert.alert("Missing Fields", "Please fill all required fields.");
      return;
    }
    if (phone.length !== 10) {
      Alert.alert("Invalid Phone", "Enter a valid 10-digit number.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert("Invalid Email", "Enter a valid email address.");
      return;
    }
    if (enteredOtp !== "1111") {
      Alert.alert("Invalid OTP", "Please enter correct OTP (1111).");
      return;
    }

    // ✅ Pass collected data to Password screen
    // navigation.navigate("Password", { name, email, phone });
    /* 🔥 GET FCM TOKEN (MOST IMPORTANT PART) */
    let fcmToken = null;
    try {
      await messaging().requestPermission();
      fcmToken = await messaging().getToken();
      console.log("🔥 Signup FCM Token:", fcmToken);
    } catch (err) {
      console.log("❌ FCM Token Error:", err);
    }

    /* 👉 PASS EVERYTHING TO PASSWORD SCREEN */
    navigation.navigate("Password", {
      name,
      email,
      phone,
      fcmToken, // 🔥 THIS WILL POPULATE push_devices
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Image
          source={require("../../assets/signup.png")}
          style={styles.image}
          resizeMode="contain"
        />

        <Text style={styles.title}>Sign up</Text>

        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          keyboardType="email-address"
          onChangeText={setEmail}
        />

        <View style={styles.phoneContainer}>
          <Text style={styles.prefix}>+91</Text>
          <TextInput
            style={styles.phoneInput}
            maxLength={10}
            placeholder="Enter Phone No."
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {/* OTP inputs */}
        <View style={styles.otpContainer}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              style={styles.otpBox}
              value={digit}
              onChangeText={(t) => handleOtpChange(t, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
            />
          ))}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextText}>Next</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.note}>
          Note: Your personal information remains encrypted.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 24, alignItems: "center" },
  image: { width: "100%", height: 250, marginTop: 20 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#210F47",
    marginVertical: 10,
    alignSelf: "flex-start",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    height: 45,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    width: "100%",
    height: 45,
    marginTop: 12,
    paddingHorizontal: 12,
  },
  prefix: { fontSize: 16, marginRight: 6, color: "#000" },
  phoneInput: { flex: 1, fontSize: 16 },
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
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 25,
    justifyContent: "space-between",
    width: "100%",
  },
  backBtn: {
    backgroundColor: "#EAEAEA",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  backText: { color: "#000", fontWeight: "600" },
  nextBtn: {
    backgroundColor: "#210F47",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  nextText: { color: "#fff", fontWeight: "600" },
  note: {
    fontSize: 12,
    color: "#666",
    marginTop: 25,
    textAlign: "center",
  },
});
