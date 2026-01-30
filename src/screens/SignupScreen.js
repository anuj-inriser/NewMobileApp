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
} from "react-native";
import TextInput from "../components/TextInput";
import { getPushToken } from "../utils/pushToken";
import { Ionicons } from "@expo/vector-icons";
export default function SignupScreen({ navigation, route }) {
  const initialPhone = route?.params?.phone || "";
  const [acceptedTnc, setAcceptedTnc] = useState(false);
  const [tncError, setTncError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [errors, setErrors] = useState({});

  const inputRefs = useRef([]);

  const handleOtpChange = (text, index) => {
    if (!/^[0-9]?$/.test(text)) return;

    const updated = [...otp];
    updated[index] = text;
    setOtp(updated);

    if (text && index < 3) inputRefs.current[index + 1]?.focus();
    if (!text && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Name required";

    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email))
      e.email = "Invalid email address";

    if (!phone.trim()) e.phone = "Phone number required";
    else if (!/^\d{10}$/.test(phone))
      e.phone = "Enter valid 10 digit number";



    if (otp.join("") !== "1111") e.otp = "Invalid OTP";
    if (otp.join("") === "") e.otp = "Please Enter OTP";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {

    if (!validate()) return;
    if (!acceptedTnc) {
      setTncError("Please accept Terms & Conditions");
      return;
    }

    setTncError("");
    const fcmToken = await getPushToken();

    navigation.navigate("Password", {
      name,
      email: email.trim() || null,
      phone,
      fcmToken,
    });
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
            source={require("../../assets/signup.png")}
            style={styles.image}
            resizeMode="contain"
          />

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
              setErrors({ ...errors, email: "" });
            }}
          />
          {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <View style={styles.phoneRow}>
            <Text style={styles.prefix}>+91</Text>
            <TextInput
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
          {!!errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}

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
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 12, alignItems: "center" },
  image: { width: "100%", height: 220, marginTop: 90 },
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
  tnc: { fontSize: 13, marginTop: 8, color: "#000", fontWeight: "600" },
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
  errorText1: {
    width: "100%",
    color: "red",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
});
