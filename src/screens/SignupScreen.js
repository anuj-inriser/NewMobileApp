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

import { getPushToken } from "../utils/pushToken";

export default function SignupScreen({ navigation, route }) {
  const initialPhone = route?.params?.phone || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState(["", "", "", ""]);

  const inputRefs = useRef([]);

  /* 🔢 OTP HANDLER */
  const handleOtpChange = (text, index) => {
    if (!/^[0-9]?$/.test(text)) return;

    const updated = [...otp];
    updated[index] = text;
    setOtp(updated);

    if (text && index < 3) inputRefs.current[index + 1]?.focus();
    if (!text && index > 0) inputRefs.current[index - 1]?.focus();
  };

  /* ▶️ NEXT */
  const handleNext = async () => {
    const enteredOtp = otp.join("");

    if (!name || !email || !phone) {
      Alert.alert("Missing Fields", "Please fill all fields");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      Alert.alert("Invalid Phone", "Enter valid 10-digit number");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert("Invalid Email", "Enter valid email");
      return;
    }

    if (enteredOtp !== "1111") {
      Alert.alert("Invalid OTP", "Correct OTP is 1111");
      return;
    }

    /* 🔥 GET PUSH TOKEN */
    const fcmToken = await getPushToken();

    console.log("🔥 Signup Push Token:", fcmToken);

    navigation.navigate("Password", {
      name,
      email,
      phone,
      fcmToken,
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
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.phoneRow}>
          <Text style={styles.prefix}>+91</Text>
          <TextInput
            style={styles.phoneInput}
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {/* 🔢 OTP BOXES */}
        <View style={styles.otpRow}>
          {otp.map((d, i) => (
            <TextInput
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              style={styles.otpBox}
              keyboardType="number-pad"
              maxLength={1}
              value={d ? "*" : ""}
              onChangeText={(t) => handleOtpChange(t.slice(-1), i)}
              textAlign="center"
            />
          ))}
        </View>

        <View style={styles.btnRow}>
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
      </ScrollView>
    </SafeAreaView>
  );
}

/* 🎨 STYLES */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 24, alignItems: "center" },
  image: { width: "100%", height: 240 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#210F47",
    alignSelf: "flex-start",
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
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 45,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginTop: 12,
    paddingHorizontal: 12,
  },
  prefix: { fontSize: 16, marginRight: 6 },
  phoneInput: { flex: 1, fontSize: 16 },

  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  otpBox: {
    width: 45,
    height: 45,
    borderRadius: 8,
    backgroundColor: "#EAEAEA",
    marginHorizontal: 6,
    fontSize: 18,
    fontWeight: "600",
  },

  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 25,
  },
  backBtn: {
    backgroundColor: "#EAEAEA",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  backText: { fontWeight: "600" },
  nextBtn: {
    backgroundColor: "#210F47",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  nextText: { color: "#fff", fontWeight: "600" },
});
