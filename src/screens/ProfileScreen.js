import React, { useEffect, useState, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Platform,
  Animated,
} from "react-native";
import { useAlert } from "../context/AlertContext";
import TextInput from "../components/TextInput";
import axiosInstance from "../api/axios";
import * as DocumentPicker from "expo-document-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiUrl } from "../utils/apiUrl";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import TopHeader from "../components/TopHeader";
import BottomTabBar from "../components/BottomTabBar";
import DonutChart from "../components/DonutChart";
import KycChart from "../components/KycChart";
import PreferencesSection from "../components/PreferencesSection";
import Profile from "../../assets/Profile.png";
import ProfileImg1 from "../../assets/ProfileImg1.png";
import ProfilePencil from "../../assets/ProfilePencil.png";
import Troffy from "../../assets/troffy.png";
import Rewards from "../../assets/rewards.png";
import Book from "../../assets/book.png";
import BadgeShield from "../../assets/badge_shield.png";
import BadgeStar from "../../assets/badge_star.png";
import BadgeVerified from "../../assets/badge_verified.png";
import BadgeInfluencer from "../../assets/badge_influencer.png";
import Attach from "../../assets/attach.png";
import Calendar from "../../assets/calendar.png";
import KycIcon from "../../assets/kyc.png";
import DeleteIcon from "../../assets/deleteicon.png";
import ProfileRefresh from "../../assets/profilerefresh.png";
import GrowIcon from "../../assets/grow.png";
import Setting from "../../assets/profilesetting.png";
import AboutUs from "../../assets/aboutusicon.png";
import LinkedAccount from "../../assets/linkedaccount.png";
import AccountPrivacy from "../../assets/accountprivacy.png";
import ArrowDown from "../../assets/arrow_down.png";
import ArrowUp from "../../assets/arrow_up.png";
import { Ionicons } from "@expo/vector-icons";
import { useKeyboardAvoidingShift } from "../hooks/useKeyboardAvoidingShift";

const ProfileScreen = ({ isInsideSlider, closeSlider }) => {
  const translateY = useKeyboardAvoidingShift();
  const { showSuccess, showError } = useAlert();
  const [kycOpen, setKycOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [setting, setSetting] = useState(false);
  const [linkedAccount, setLinkedAccount] = useState(false);
  const [accountPrivacy, setAccountPrivacy] = useState(false);
  const navigation = useNavigation();
  const {
    authToken,
    clientId,
    clearAuth,
    userData,
    profileImage,
    refreshUserProfile,
  } = useAuth();
  const [portfolioData, setPortfolioData] = useState([]);
  const [totalCurrent, setTotalCurrent] = useState("0.00");
  const [totalProfit, setTotalProfit] = useState("0.00");
  const [totalInvested, setTotalInvested] = useState("0.00");
  const [profitVal, setProfitVal] = useState("0.00");
  const [profitPercentage, setProfitPercentage] = useState("0.00");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [cityVal, setCityVal] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editImage, setEditImage] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [dob, setDob] = useState(null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [pan, setPan] = useState("");
  const [aadhar, setAadhar] = useState("");
  const [panFiles, setPanFiles] = useState([]);
  const [aadharFiles, setAadharFiles] = useState([]);
  const [panDocBase64, setPanDocBase64] = useState(null);
  const [aadharDocBase64, setAadharDocBase64] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewBase64, setPreviewBase64] = useState(null);
  const [kycPercent, setKycPercent] = useState(0);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [aboutUsOpen, setAboutUsOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [issueDropdownOpen, setIssueDropdownOpen] = useState(false);
  const [issueCategory, setIssueCategory] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successIssueModalOpen, setSuccessIssueModalOpen] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [appInfoModalOpen, setAppInfoModalOpen] = useState(false);
  // EMAIL OTP STATES (PROFILE)
  const [editEmailVerified, setEditEmailVerified] = useState(true); // existing email verified
  const [editEmailOtp, setEditEmailOtp] = useState("");
  const [editEmailOtpError, setEditEmailOtpError] = useState("");
  const [emailOtpModalOpen, setEmailOtpModalOpen] = useState(false);
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  // PHONE OTP STATES
  const [phoneOtpModalOpen, setPhoneOtpModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [phoneOtp, setPhoneOtp] = useState(["", "", "", ""]);
  const [phoneOtpVerified, setPhoneOtpVerified] = useState(false);
  const otpInputRefs = useRef([]);
  const [showPhoneOtpModal, setShowPhoneOtpModal] = useState(false);
  const [phoneOtpError, setPhoneOtpError] = useState("");
  const [phoneOtpTimer, setPhoneOtpTimer] = useState(30);
  const [canResendPhoneOtp, setCanResendPhoneOtp] = useState(false);

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
  const sendProfilePhoneOtp = async () => {
    if (!editMobile || !/^\d{10}$/.test(editMobile)) {
      setEditErrors({ mobile: "Enter valid mobile number" });
      return;
    }

    try {
      await fetch(`${apiUrl}/api/signup/send-phone-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: editMobile }),
      });

      // reset
      setPhoneOtp(["", "", "", ""]);
      setPhoneOtpError("");
      setPhoneOtpTimer(30);
      setCanResendPhoneOtp(false);

      setPhoneOtpModalOpen(true);
    } catch {
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
          phone: editMobile,
          otp: enteredOtp,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setPhoneOtpError("Invalid OTP");
        return;
      }

      // ✅ FIX HERE
      setPhoneOtpVerified(true);

      setPhoneOtpModalOpen(false);
      setEditErrors((p) => ({ ...p, mobile: "" }));
    } catch {
      setPhoneOtpError("Verification failed");
    }
  };

  const resendProfilePhoneOtp = async () => {
    await sendProfilePhoneOtp();
  };

  const pickAttachment = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      setAttachment(result.assets[0]);
    }
  };

  const handleMobileChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length <= 10) {
      setEditMobile(cleaned);

      // 🔥 IMPORTANT
      setPhoneOtpVerified(false);
      setPhoneOtp(["", "", "", ""]);
    }
  };

  const handleEmailChange = (text) => {
    setEditEmail(text.trim().toLowerCase());
    setEditEmailVerified(false); // ❗ re-verify required
    setEditErrors((prev) => ({ ...prev, email: "" }));
  };
  const sendProfileEmailOtp = async () => {
    if (!editEmail || !/^\S+@\S+\.\S+$/.test(editEmail)) {
      setEditErrors({ email: "Enter valid email" });
      return;
    }

    try {
      setEmailOtpLoading(true);

      const res = await fetch(`${apiUrl}/api/signup/send-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: editEmail }),
      });

      const data = await res.json();

      if (!data.success) {
        setEditErrors({ email: data.message || "Failed to send OTP" });
        return;
      }

      setEditEmailOtp("");
      setEditEmailOtpError("");
      setEmailOtpModalOpen(true);
    } catch {
      setEditErrors({ email: "Network error" });
    } finally {
      setEmailOtpLoading(false);
    }
  };
  const verifyProfileEmailOtp = async () => {
    if (!editEmailOtp.trim()) {
      setEditEmailOtpError("Enter OTP");
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/signup/verify-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: editEmail,
          otp: editEmailOtp,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setEditEmailOtpError("OTP not matched");
        return;
      }

      // ✅ SUCCESS
      setEditEmailVerified(true);
      setEditErrors((prev) => ({ ...prev, email: "" })); // 🔥 ERROR CLEAR
      setEmailOtpModalOpen(false);
    } catch {
      setEditEmailOtpError("Verification failed");
    }
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

  const handlePanChange = (text) => {
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (cleaned.length <= 10) {
      setPan(cleaned);
    }
  };

  const handleAadharChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length <= 12) {
      setAadhar(cleaned);
    }
  };

  const openEditProfile = () => {
    setEditName(name);
    setEditUsername(username);
    setEditMobile(mobile);
    setEditEmail(email);
    setEditImage(profileImage);
    setEditOpen(true);
  };
  const pickDocument = async (type) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showError("Permission required", "Please allow media access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      const file = result.assets[0];

      if (type === "PAN") {
        setPanFiles([file]);
        setPanDocBase64(null);
      }

      if (type === "AADHAR") {
        setAadharFiles([file]);
        setAadharDocBase64(null);
      }
    }
  };

  const uriToBase64 = async (uri) => {
    if (!uri) return null;

    // If it's already a base64 data string, just return the data part
    if (uri.startsWith("data:")) {
      return uri.split(",")[1];
    }

    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result.split(",")[1];
          resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("uriToBase64 error:", error);
      return null;
    }
  };
  const fetchKycPercent = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");

      const res = await axiosInstance.get(
        `${apiUrl}/api/userkyc/percent/${userId}`,
      );
      setKycPercent(res.data.percent);

      if (res.data?.success) {
        setKycPercent(res.data.percent || 0);
      }
    } catch (err) {
      console.log(
        "❌ KYC PERCENT API ERROR =>",
        err?.response?.data || err.message,
      );
    }
  };

  const getImageSource = (img) => {
    if (!img) return Profile;

    if (img.startsWith("file://") || img.startsWith("content://")) {
      return { uri: img };
    }

    return { uri: `data:image/jpeg;base64,${img}` };
  };
  const sendPhoneOtp = async () => {
    if (!/^\d{10}$/.test(editMobile)) {
      setEditErrors({ mobile: "Enter valid 10 digit number" });
      return;
    }

    await fetch(`${apiUrl}/api/signup/send-phone-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: editMobile }),
    });

    setShowPhoneOtpModal(true);
  };
  const verifyPhoneOtp = async () => {
    const enteredOtp = phoneOtp.join("");

    if (enteredOtp.length !== 4) {
      setPhoneOtpError("Enter OTP");
      return;
    }

    const res = await fetch(`${apiUrl}/api/signup/verify-phone-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: editMobile,
        otp: enteredOtp,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      setPhoneOtpError("Invalid OTP");
      return;
    }

    // ✅ VERIFIED SUCCESS
    setPhoneOtpVerified(true);
    setShowPhoneOtpModal(false);
    setPhoneOtpError("");
  };
  const validateUsername = async (username) => {
    const userId = await AsyncStorage.getItem("userId");
    try {
      const res = await axiosInstance.get(`/users/validate-username`, {
        params: { username, userId },
      });
      return !res.data.exists;
    } catch (error) {
      console.error("Username validation error:", error);
      return false;
    }
  };
  const handleSaveProfile = async () => {
    const e = {};

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const isValidMobile = (mobile) => /^\d{10}$/.test(mobile);

    if (!editName.trim()) e.name = "Name required";

    if (!isValidMobile(editMobile?.trim()))
      e.mobile = "Enter valid 10 digit mobile number";

    if (editEmail && !isValidEmail(editEmail))
      e.email = "Invalid email address";

    if (editEmail && !editEmailVerified) {
      e.email = "Please verify your email";
    }
    if (editMobile !== mobile && !phoneOtpVerified) {
      setEditErrors({ mobile: "Please verify phone number" });
      return;
    }
    if (editUsername) {
      const isAvailable = await validateUsername(editUsername);

      if (!isAvailable) {
        e.username = "Username already taken";
      }
    }
    if (Object.keys(e).length > 0) {
      setEditErrors(e);
      return;
    }

    setEditErrors({});

    try {
      let imageBase64 = null;

      if (editImage && editImage !== profileImage) {
        imageBase64 = await uriToBase64(editImage);
      }

      const payload = {
        name: editName,
        username: editUsername,
        phone: editMobile?.trim(),
        email: editEmail || null,
        image: imageBase64,
      };

      const userId = await AsyncStorage.getItem("userId");
      await axiosInstance.put(`${apiUrl}/api/users/users/${userId}`, payload);

      setEditOpen(false);
      getUserById();
    } catch (err) {
      if (err?.response?.status === 409 && err?.response?.data?.message) {
        const msg = err.response.data.message.toLowerCase();

        const errors = {};

        if (msg.includes("mobile")) {
          errors.mobile = "Mobile number already exists";
        }

        if (msg.includes("email")) {
          errors.email = "Email already exists";
        }

        if (Object.keys(errors).length > 0) {
          setEditErrors(errors);
          return;
        }
      }

      setEditErrors({
        general: "Failed to update profile",
      });
    }
  };

  // const handleSaveProfile = async () => {
  //   const e = {};

  //   const isValidEmail = (email) =>
  //     /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  //   const isValidMobile = (mobile) =>
  //     /^[6-9]\d{9}$/.test(mobile);

  //   if (!editName.trim()) e.name = "Name required";

  //   if (!isValidMobile(editMobile))
  //     e.mobile = "Enter valid 10 digit mobile number";

  //   if (editEmail && !isValidEmail(editEmail))
  //     e.email = "Invalid email address";

  //   if (Object.keys(e).length > 0) {
  //     setEditErrors(e);
  //     return;
  //   }

  //   setEditErrors({});

  //   try {
  //     let imageBase64 = null;

  //     if (editImage && editImage !== profileImage) {
  //       imageBase64 = await uriToBase64(editImage);
  //     }

  //     const payload = {
  //       name: editName,
  //       username: editUsername,
  //       phone: editMobile,
  //       email: editEmail || null,
  //       image: imageBase64,
  //     };

  //     const userId = await AsyncStorage.getItem("userId");
  //     await axiosInstance.put(
  //       `${apiUrl}/api/users/users/${userId}`,
  //       payload
  //     );

  //     setEditOpen(false);
  //     getUserById();
  //   } catch (err) {
  //     setEditErrors({
  //       general: "Failed to update profile",
  //     });
  //   }
  // };

  const formatAmount = (num) => {
    if (!num) return "0";
    return Number(num).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getUserById = async () => {
    try {
      // Use cached data for instant display
      if (userData) {
        setName(userData.name || "");
        setMobile(userData.phone || "");
        setEmail(userData.email || "");
        await refreshUserProfile();
      }

      // Still fetch full profile for other fields (username, city, state, image, etc.)
      const userId = await AsyncStorage.getItem("userId");
      const res = await axiosInstance.get(`${apiUrl}/api/users/${userId}`);
      const user = res.data.data;
      setName(user.name || "");
      setUsername(user.username || "");
      setMobile(user.phone || "");
      setEmail(user.email || "");
      setCityVal(res.data.city || "");
      setStateVal(res.data.state || "");
    } catch (err) {
      console.log("API Error =>", err);
    }
  };

  const fetchPortfolioBalance = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/portfolio/getPortfolioBalance`);
      const json = await res.json();

      if (json.success) {
        let totalCurrentValue = 0;
        let totalProfitValue = 0;
        let totalInvestedValue = 0;

        const processed = json.data.map((item) => {
          const realisedQty = Number(item.realisedquantity) || 0;
          const ltp = Number(item.ltp) || 0;
          const avg = Number(item.averageprice) || 0;
          const invested = avg * realisedQty;
          const currentValue = ltp * realisedQty;
          const profit = currentValue - invested;
          const profitPercent =
            invested > 0 ? ((profit / invested) * 100).toFixed(2) : "0.00";
          totalCurrentValue += currentValue;
          totalProfitValue += profit;
          totalInvestedValue += invested;

          return {
            ...item,
            invested: invested.toFixed(2),
            currentValue: currentValue.toFixed(2),
            profit: profit.toFixed(2),
            profitPercent,
          };
        });

        setPortfolioData(processed);
        setTotalProfit(totalProfitValue.toFixed(2));
        setTotalCurrent(totalCurrentValue.toFixed(2));
        setTotalInvested(totalInvestedValue.toFixed(2));

        const overallPercent =
          totalInvestedValue > 0
            ? ((totalProfitValue / totalInvestedValue) * 100).toFixed(2)
            : "0.00";

        setProfitPercentage(overallPercent);
      }
    } catch (err) {
      console.log("API Error:", err);
    }
  };
  const profitColor =
    Number(totalProfit) >= 0 ? global.colors.success : global.colors.error;
  const percentColor =
    Number(profitPercentage) >= 0 ? global.colors.success : global.colors.error;
  const profitDisplay = `₹${formatAmount(Math.abs(totalProfit))}`;
  const percentDisplay = `${Math.abs(profitPercentage)}%`;
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showError("Alert", "Permission required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      setEditImage(result.assets[0].uri);
      // Store base64 if needed immediately or rely on uriToBase64 later
      // But we added base64: true so we can use it.
      if (result.assets[0].base64) {
        setEditImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
      } else {
        setEditImage(result.assets[0].uri);
      }
    }
  };

  useEffect(() => {
    fetchPortfolioBalance();
    getUserById();
    loadKycData();
  }, []);

  const handleChangePassword = async () => {
    const e = {};

    if (!currentPassword) {
      e.currentPassword = "Enter current password first"
    }

    if (!newPassword) {
      e.newPassword = "New password required";
    } else {
      if (newPassword.length < 6) {
        e.newPassword = "Password must be at least 6 characters";
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
        e.newPassword = "Password must contain 1 special character";
      }
    }
    if (!confirmPassword) {
      e.confirmPassword = "Confirm password required";
    } else if (newPassword !== confirmPassword) {
      e.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(e).length > 0) {
      setPasswordErrors(e);
      return;
    }

    setPasswordErrors({});

    try {
      const userId = await AsyncStorage.getItem("userId");

      const res = await axiosInstance.put(`${apiUrl}/api/users/change-password/${userId}`, {
        currentPassword: currentPassword,
        password: newPassword,
        confirmPassword,
      });

      if (!res.data?.status && !res.data?.success) {
        setPasswordErrors({
          general: res.data?.message || "Failed to change password",
        });
        return;
      }

      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
      setPasswordErrors({
        success: "Password changed successfully",
      });
    } catch (err) {
      setPasswordErrors((prev) => ({
        ...prev,
        general: err?.response?.data?.message || "Failed to change password",
      }));
    }
  };

  const handleLogout = async () => {
    try {
      const userIdStored = await AsyncStorage.getItem("userId");
      const authTokenStored = await AsyncStorage.getItem("authToken");
      const clientIdStored = await AsyncStorage.getItem("clientId");

      if (!userIdStored || !authTokenStored || !clientIdStored) {
        if (userIdStored) {
          await fetch(`${apiUrl}/api/check-user/update-fcm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userIdStored, fcmToken: "" }),
          });
        }
        await clearAuth();
        // Reset to Auth stack
        // navigation.reset({
        //   index: 0,
        //   routes: [{ name: "Auth", state: { routes: [{ name: "Login" }] } }],
        // });
        return;
      }

      const res = await fetch(`${apiUrl}/api/check-user/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userIdStored,
          authToken: authTokenStored,
          clientcode: clientIdStored,
        }),
      });

      const data = await res.json();

      if (data.status) {
        await clearAuth();
        // Reset to Auth stack
        // navigation.reset({
        //   index: 0,
        //   routes: [
        //     {
        //       name: "Auth",
        //       state: {
        //         routes: [{ name: "Login" }],
        //       },
        //     },
        //   ],
        // });
      }
    } catch (err) {
      console.log("Logout Failed:", err);
    }
  };
  const getSingleBase64 = async (files = []) => {
    if (!files.length) return null;

    const file = files[0];
    if (file?.base64) return file.base64; // Use pre-fetched base64
    if (!file?.uri) return null;

    return await uriToBase64(file.uri);
  };

  const handleKycSubmit = async () => {
    try {
      const isValidPan = (pan) => {
        return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan);
      };

      if (!isValidPan(pan)) {
        showError(
          "Invalid PAN Number",
          "Please enter a valid PAN number (e.g. ANDPS2321P).",
        );
        return;
      }
      if (panFiles.length === 0 && !panDocBase64) {
        showError("PAN File Missing", "Please upload a PAN document.");
        return;
      }
      const isValidAadhar = (aadhar) => {
        return /^[2-9]\d{11}$/.test(aadhar);
      };

      if (!isValidAadhar(aadhar)) {
        showError(
          "Invalid Aadhaar Number",
          "Please enter a valid 12-digit Aadhaar number.",
        );
        return;
      }
      if (aadharFiles.length === 0 && !aadharDocBase64) {
        showError("Aadhaar File Missing", "Please upload an Aadhaar document.");
        return;
      }
      const userId = await AsyncStorage.getItem("userId");

      const formatDateOnly = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      };

      const panBase64 =
        panFiles.length > 0 ? await getSingleBase64(panFiles) : panDocBase64;

      const aadharBase64 =
        aadharFiles.length > 0
          ? await getSingleBase64(aadharFiles)
          : aadharDocBase64;

      const payload = {
        userId,
        gender,
        fatherName,
        dob: dob ? formatDateOnly(dob) : null,
        pan,
        aadhar,
        address,
        city,
        state: stateName,
        pincode,
        pan_doc: panBase64 || null,
        aadhar_doc: aadharBase64 || null,
      };

      await axiosInstance.post(`/userkyc/submit`, payload);
      setPanFiles([]);
      setAadharFiles([]);

      await loadKycData();
      fetchKycPercent();
      showSuccess("Success", "KYC submitted successfully.");
      setKycOpen(false);
      getUserById();
    } catch (error) {
      showError("Error", "Failed to submit KYC.");
    }
  };

  const submitFeedback = async () => {
    try {
      if (!rating) {
        console.log("❌ Rating required");
        return;
      }

      const userId = await AsyncStorage.getItem("userId");

      const payload = {
        issue_type: `${rating}`,
        message_text: feedbackText,
        complaint_status: "Opened",
        complaint_type: "Feedback",
        user_id: userId,
      };

      const res = await axiosInstance.post(
        `${apiUrl}/api/grievance/feedbacksubmit`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      setSuccessModalOpen(true);
      setFeedbackModalOpen(false);
      setRating(0);
      setFeedbackText("");
    } catch (error) {
      console.error("❌ FEEDBACK SUBMIT ERROR =>", error?.response || error);
    }
  };

  const submitReportIssue = async () => {
    try {
      if (!issueCategory || !issueDescription) {
        showError("Error", "Please select category and description");
        return;
      }

      const userId = await AsyncStorage.getItem("userId");
      const formData = new FormData();
      formData.append("complaint_type", "Issue");
      formData.append("complaint_status", "Opened");
      formData.append("issue_type", issueCategory);
      formData.append("message_text", issueDescription);
      formData.append("user_id", userId);
      const getAttachmentFileName = () => {
        const now = new Date();
        return `attachment${now.getTime()}.jpg`;
      };

      if (attachment) {
        formData.append("attachment", {
          uri: attachment.uri,
          name: getAttachmentFileName(),
          type: "image/jpeg",
        });
      }

      const res = await axiosInstance.post(
        `${apiUrl}/api/grievance/issuesubmit`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setSuccessIssueModalOpen(true);
      setReportModalOpen(false);
      setIssueCategory("");
      setIssueDescription("");
      setAttachment(null);
    } catch (err) {
      showError("Error", "Failed to submit issue");
    }
  };

  const loadKycData = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const res = await axiosInstance.get(
        `${apiUrl}/api/userkyc/getuserkyc/${userId}`,
      );
      if (res.data.data) {
        const kyc = res.data.data;
        setGender(kyc.gender || "");
        setFatherName(kyc.father_name || "");
        setDob(kyc.date_of_birth ? new Date(kyc.date_of_birth) : null);
        setPan(kyc.pan_no || "");
        setAadhar(kyc.adhaar_no || "");
        setAddress(kyc.address || "");
        setCity(kyc.city || "");
        setStateName(kyc.state || "");
        setPincode(kyc.pin_code || "");
        setPanDocBase64(kyc.pan_doc || null);
        setAadharDocBase64(kyc.aadhar_doc || null);
      }
    } catch (err) {
      console.log("❌ LOAD KYC ERROR =>", err.message);
    }
  };

  useEffect(() => {
    fetchKycPercent();
    loadKycData();
  }, []);
  const isKycCompleted = kycPercent === 100;
  return (
    <>
      <SafeAreaView edges={["bottom"]} style={styles.container}>
        <Animated.View
          style={{
            flex: 1,
            transform: [{ translateY }],
          }}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text
                style={{
                  position: "absolute",
                  left: 8,
                  top: 5,
                  zIndex: 999,
                  padding: 8,
                  fontSize: 18,
                  fontWeight: "500",

                  marginBottom: 10,
                  paddingHorizontal: 16,
                  color: global.colors.textPrimary,
                  textAlign: "left",
                }}
              >
                Profile
              </Text>
              {isInsideSlider && (
                <TouchableOpacity
                  style={styles.closeSliderBtnRight}
                  onPress={closeSlider}
                >
                  <Ionicons
                    name="close"
                    size={28}
                    color={global.colors.textPrimary}
                  />
                </TouchableOpacity>
              )}
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: 100,
                ...(isInsideSlider && { paddingTop: 40 }),
              }}
            >
              <View style={styles.profileCard}>
                <View style={styles.topRow}>
                  <Image
                    source={getImageSource(profileImage)}
                    style={styles.profileImage}
                  />

                  <View style={{ marginLeft: 12 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.nameText}>{name}</Text>
                      {kycPercent === 100 && (
                        <TouchableOpacity style={styles.docIcon}>
                          <Image
                            source={ProfileImg1}
                            style={{ width: 16, height: 16 }}
                          />
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text style={styles.username}>@{username}</Text>
                    <Text style={styles.contact}>{mobile}</Text>
                    <Text style={styles.contact}>{email}</Text>
                    <Text style={styles.location}>
                      {[cityVal, stateVal].filter(Boolean).join(", ")}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={openEditProfile}
                  >
                    <Image
                      source={ProfilePencil}
                      style={{ width: 30, height: 30 }}
                    />
                  </TouchableOpacity>
                </View>

                {/* <View style={styles.planRow}>
                            <View>
                                <Text style={styles.planLabel}>Premium Plan</Text>
                                <Text style={styles.planStatus}>Active</Text>
                            </View>

                            <View>
                                <Text style={styles.dateLabel}>End Date- 10 Nov 26</Text>
                            </View>

                            <TouchableOpacity style={styles.planBtn}>
                                <Text style={styles.planBtnText}>Manage Plan</Text>
                            </TouchableOpacity>
                        </View> */}
              </View>

              {/* <View style={styles.statsRow}>
                        <View style={styles.statsCard}>
                            <Image source={Troffy} style={styles.statsIcon} />
                            <Text style={styles.statsTitle}>
                                Active Affiliate <Text style={styles.statsValue}>7</Text>
                            </Text>
                            <Text style={styles.statsCode}>Code VIP2045</Text>
                        </View>
                        <View style={styles.statsCard}>
                            <Image source={Rewards} style={styles.statsIcon} />
                            <Text style={styles.statsTitle}>Total Rewards</Text>
                            <Text style={styles.statsValue}>2,450</Text>
                        </View>
                        <View style={styles.statsCard}>
                            <Image source={Book} style={styles.statsIcon} />
                            <Text style={styles.statsTitle}>Money Balance</Text>
                            <Text style={styles.statsValue}>₹12,450</Text>
                        </View>
                    </View> */}

              {/* <View style={styles.badgesSection}>
                        <Text style={styles.badgesTitle}>Badges</Text>
                        <View style={styles.badgeRow}>
                            <View style={{ alignItems: "center" }}>
                                <View style={styles.badgeCard}>
                                    <View style={styles.badgeInnerRow}>
                                        <Text style={styles.badgeCount}>23</Text>
                                        <Image source={BadgeShield} style={styles.badgeIcon} />
                                    </View>
                                </View>
                                <Text style={styles.badgeLabel}>Pro Trader</Text>
                            </View>
                            <View style={{ alignItems: "center" }}>
                                <View style={styles.badgeCard}>
                                    <View style={styles.badgeInnerRow}>
                                        <Text style={styles.badgeCount}>35</Text>
                                        <Image source={BadgeStar} style={styles.badgeIcon} />
                                    </View>
                                </View>
                                <Text style={styles.badgeLabel}>Social Star</Text>
                            </View>
                            <View>
                                <View style={styles.badgeInactive}>
                                    <Image source={BadgeVerified} style={styles.badgeIconInactive} />
                                </View>
                                <Text style={styles.badgeLabel}>Verified</Text>
                            </View>
                            <View>
                                <View style={styles.badgeInactive}>
                                    <Image source={BadgeInfluencer} style={styles.badgeIconInactive} />
                                </View>
                                <Text style={styles.badgeLabel}>Influencer</Text>
                            </View>
                        </View>
                    </View> */}

              <TouchableOpacity
                style={kycOpen ? styles.kycHeader : styles.kycHeaderclosed}
                onPress={() => setKycOpen(!kycOpen)}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Image
                    source={KycIcon}
                    style={{ width: 30, height: 30, marginRight: 8 }}
                  />
                  <Text style={styles.kycTitle}>
                    KYC Verification&nbsp;&nbsp;&nbsp;
                  </Text>
                  <KycChart percentage={kycPercent} />
                </View>

                <Image
                  source={kycOpen ? ArrowUp : ArrowDown}
                  style={{ width: 15, height: 8 }}
                />
              </TouchableOpacity>

              {kycOpen && (
                <View style={styles.kycBody}>
                  <Text style={styles.label}>Gender</Text>
                  <View style={styles.genderRow}>
                    <TouchableOpacity
                      style={[
                        styles.genderBtn,
                        gender === "Male" && styles.genderSelected,
                      ]}
                      onPress={() => setGender("Male")}
                    >
                      <Text
                        style={[
                          styles.genderText,
                          gender === "Male" && styles.genderTextSelected,
                        ]}
                      >
                        Male
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.genderBtn,
                        gender === "Female" && styles.genderSelected,
                      ]}
                      onPress={() => setGender("Female")}
                    >
                      <Text
                        style={[
                          styles.genderText,
                          gender === "Female" && styles.genderTextSelected,
                        ]}
                      >
                        Female
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.label}>DOB</Text>
                  <TouchableOpacity
                    style={styles.datepickerinputBox}
                    onPress={() => setShowDobPicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.inputText}>
                      {dob
                        ? dob.toLocaleDateString("en-IN")
                        : "Select Date of Birth"}
                    </Text>
                    <Image source={Calendar} style={styles.iconSmall} />
                  </TouchableOpacity>

                  <Text style={styles.label}>Father's Name</Text>
                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.inputText}
                      placeholder="Enter your father's name"
                      value={fatherName}
                      onChangeText={setFatherName}
                      multiline
                    />
                  </View>
                  {showDobPicker && (
                    <DateTimePicker
                      value={dob || new Date()}
                      mode="date"
                      display="calendar"
                      maximumDate={new Date()}
                      onChange={(event, selectedDate) => {
                        setShowDobPicker(false);
                        if (selectedDate) {
                          setDob(selectedDate);
                        }
                      }}
                    />
                  )}

                  <Text style={styles.label}>PAN Number</Text>
                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.inputText}
                      placeholder="Enter PAN Number"
                      autoCapitalize="characters"
                      maxLength={10}
                      value={pan}
                      onChangeText={handlePanChange}
                    />
                    <TouchableOpacity onPress={() => pickDocument("PAN")}>
                      <Image source={Attach} style={styles.iconSmall2} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.fileTagRow}>
                    {panDocBase64 && panFiles.length === 0 && (
                      <TouchableOpacity
                        style={styles.fileTag}
                        onPress={() => {
                          setPreviewBase64(panDocBase64);
                          setPreviewVisible(true);
                        }}
                      >
                        <Image source={Attach} style={styles.iconSmall3} />
                        <Text style={styles.fileTagText}> PAN Document</Text>
                      </TouchableOpacity>
                    )}

                    {panFiles.length > 0 && (
                      <View style={styles.fileTag}>
                        <Image source={Attach} style={styles.iconSmall3} />
                        <Text style={styles.fileTagText}> PAN Document</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setPanFiles([]);
                            setPanDocBase64(null);
                          }}
                        >
                          <Text style={{ marginLeft: 6, fontWeight: "700" }}>
                            ×
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  <Text style={styles.label}>Aadhar Number</Text>
                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.inputText}
                      placeholder="Enter Aadhar Number"
                      keyboardType="number-pad"
                      maxLength={12}
                      value={aadhar}
                      onChangeText={handleAadharChange}
                    />
                    <TouchableOpacity onPress={() => pickDocument("AADHAR")}>
                      <Image source={Attach} style={styles.iconSmall2} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.fileTagRow}>
                    {aadharDocBase64 && aadharFiles.length === 0 && (
                      <TouchableOpacity
                        style={styles.fileTag}
                        onPress={() => {
                          setPreviewBase64(aadharDocBase64);
                          setPreviewVisible(true);
                        }}
                      >
                        <Image source={Attach} style={styles.iconSmall3} />
                        <Text style={styles.fileTagText}>
                          {" "}
                          Aadhaar Document
                        </Text>
                      </TouchableOpacity>
                    )}

                    {aadharFiles.length > 0 && (
                      <View style={styles.fileTag}>
                        <Image source={Attach} style={styles.iconSmall3} />
                        <Text style={styles.fileTagText}>
                          {" "}
                          Aadhaar Document
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            setAadharFiles([]);
                            setAadharDocBase64(null);
                          }}
                        >
                          <Text style={{ marginLeft: 6, fontWeight: "700" }}>
                            ×
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  <Text style={styles.label}>Address</Text>
                  <View style={styles.textAreaBox}>
                    <TextInput
                      style={styles.textArea}
                      placeholder="Enter your address"
                      value={address}
                      onChangeText={setAddress}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  <Text style={styles.label}>City</Text>
                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.inputText}
                      placeholder="Enter city"
                      value={city}
                      onChangeText={setCity}
                    />
                  </View>

                  <Text style={styles.label}>State</Text>
                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.inputText}
                      placeholder="Enter state"
                      value={stateName}
                      onChangeText={setStateName}
                    />
                  </View>

                  <Text style={styles.label}>Pincode</Text>
                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.inputText}
                      placeholder="Enter pincode"
                      value={pincode}
                      onChangeText={setPincode}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, isKycCompleted]}
                    onPress={() => {
                      if (isKycCompleted) {
                        showError(
                          "Information",
                          "Your KYC is already completed. If you need any changes, please contact support.",
                        );
                        return;
                      }
                      handleKycSubmit();
                    }}
                  >
                    <Text style={styles.submitText}>
                      {isKycCompleted ? "KYC Completed" : "Submit"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={
                  preferencesOpen ? styles.kycHeader : styles.kycHeaderclosed
                }
                onPress={() => setPreferencesOpen(!preferencesOpen)}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Image
                    source={AccountPrivacy}
                    style={{ width: 30, height: 30, marginRight: 8 }}
                  />
                  <Text style={styles.kycTitle}>Preferences</Text>
                </View>
                <Image
                  source={preferencesOpen ? ArrowUp : ArrowDown}
                  style={{ width: 15, height: 8 }}
                />
              </TouchableOpacity>

              {preferencesOpen && (
                <View style={styles.settingsCard}>
                  <PreferencesSection />
                </View>
              )}

              <TouchableOpacity
                style={setting ? styles.kycHeader : styles.kycHeaderclosed}
                onPress={() => setSetting(!setting)}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Image
                    source={Setting}
                    style={{ width: 30, height: 30, marginRight: 8 }}
                  />
                  <Text style={styles.kycTitle}>Settings</Text>
                </View>
                <Image
                  source={setting ? ArrowUp : ArrowDown}
                  style={{ width: 15, height: 8 }}
                />
              </TouchableOpacity>

              {setting && (
                <View style={styles.settingsCard}>
                  {/* <Text style={styles.label}>Language</Text>
                            <View style={styles.dropdownBox}>
                                <Text style={styles.inputText}>Select your language</Text>
                                <Image source={ArrowDown} style={{ width: 15, height: 8 }} />
                            </View>

                            <Text style={styles.label}>Theme</Text>
                            <View style={styles.themeRow}>
                                <Text style={styles.themeText}>Dark Mode</Text>

                                <View style={styles.toggleOuter}>
                                    <View style={styles.toggleCircle} />
                                </View>

                                <Text style={styles.themeText}>Light Mode</Text>
                            </View>

                            <View style={styles.divider} /> */}

                  <View style={styles.divider} />

                  <Text style={styles.label}>Current Password</Text>
                  <View
                    style={[
                      styles.inputField,
                      { flexDirection: "row", alignItems: "center" },
                    ]}
                  >
                    <TextInput
                      style={[styles.inputText, { flex: 1 }]}
                      placeholder="Enter current password"
                      secureTextEntry={!showCurrentPassword}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      <Ionicons
                        name={
                          showCurrentPassword ? "eye-off-outline" : "eye-outline"
                        }
                        size={20}
                        color={global.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                  {!!passwordErrors.currentPassword && (
                    <Text
                      style={{ color: "red", fontSize: 12, marginBottom: 6 }}
                    >
                      {passwordErrors.currentPassword}
                    </Text>
                  )}



                  <Text style={styles.label}>Change Password</Text>
                  <View
                    style={[
                      styles.inputField,
                      { flexDirection: "row", alignItems: "center" },
                    ]}
                  >
                    <TextInput
                      style={[styles.inputText, { flex: 1 }]}
                      placeholder="Enter your new password"
                      secureTextEntry={!showNewPassword}
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPassword(!showNewPassword)}
                    >
                      <Ionicons
                        name={
                          showNewPassword ? "eye-off-outline" : "eye-outline"
                        }
                        size={20}
                        color={global.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                  {!!passwordErrors.newPassword && (
                    <Text
                      style={{ color: "red", fontSize: 12, marginBottom: 6 }}
                    >
                      {passwordErrors.newPassword}
                    </Text>
                  )}

                  <Text style={styles.label}>Confirm Password</Text>
                  <View
                    style={[
                      styles.inputField,
                      { flexDirection: "row", alignItems: "center" },
                    ]}
                  >
                    <TextInput
                      style={[styles.inputText, { flex: 1 }]}
                      placeholder="Re-enter your password"
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
                        color={global.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                  {!!passwordErrors.confirmPassword && (
                    <Text
                      style={{ color: "red", fontSize: 12, marginBottom: 6 }}
                    >
                      {passwordErrors.confirmPassword}
                    </Text>
                  )}

                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleChangePassword}
                  >
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </TouchableOpacity>
                  {!!passwordErrors.general && (
                    <Text
                      style={{ color: "red", fontSize: 12, marginBottom: 6 }}
                    >
                      {passwordErrors.general}
                    </Text>
                  )}

                  {!!passwordErrors.success && (
                    <Text
                      style={{ color: "green", fontSize: 12, marginBottom: 6 }}
                    >
                      {passwordErrors.success}
                    </Text>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={aboutUsOpen ? styles.kycHeader : styles.kycHeaderclosed}
                onPress={() => setAboutUsOpen(!aboutUsOpen)}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Image
                    source={AboutUs}
                    style={{ width: 30, height: 30, marginRight: 8 }}
                  />
                  <Text style={styles.kycTitle}>More</Text>
                </View>
                <Image
                  source={aboutUsOpen ? ArrowUp : ArrowDown}
                  style={{ width: 15, height: 8 }}
                />
              </TouchableOpacity>

              {aboutUsOpen && (
                <View style={styles.aboutUsBody}>
                  {[
                    "Send Feedback",
                    "Report an Issue",
                    // "Register as Research & Analyst",
                    "Terms & Conditions",
                    "App Information",
                  ].map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.aboutItem}
                      onPress={() => {
                        if (item === "Send Feedback") {
                          setFeedbackModalOpen(true);
                        }
                        if (item === "Report an Issue") {
                          setReportModalOpen(true);
                        }
                        if (item === "Terms & Conditions") {
                          setTermsModalOpen(true);
                        }
                        if (item === "App Information") {
                          setAppInfoModalOpen(true);
                        }
                      }}
                    >
                      <Text style={styles.aboutText}>{item}</Text>
                      <Text style={styles.aboutArrow}>›</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* <TouchableOpacity style={linkedAccount ? styles.kycHeader : styles.kycHeaderclosed} onPress={() => setLinkedAccount(!linkedAccount)}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Image source={LinkedAccount} style={{ width: 30, height: 30, marginRight: 8, }} />
                            <Text style={styles.kycTitle}>Linked Accounts</Text>
                        </View>
                        <Image source={linkedAccount ? ArrowUp : ArrowDown} style={{ width: 15, height: 8 }} />
                    </TouchableOpacity>

                    {linkedAccount && (
                        <View style={styles.linkedBox}>
                            <View style={styles.row}>
                                <View style={styles.rowLeft}>
                                    <Image source={GrowIcon} style={styles.icon} />
                                    <Text style={styles.exchangeName}>Groww</Text>
                                </View>
                                <TouchableOpacity style={styles.refreshBtn}>
                                    <Image source={ProfileRefresh} style={styles.refreshIcon} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.disconnectBtn}>
                                    <Text style={styles.disconnectText}>Disconnect</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.row}>
                                <View style={styles.rowLeft}>
                                    <Image source={GrowIcon} style={styles.icon} />
                                    <Text style={styles.exchangeName}>Groww</Text>
                                </View>
                                <TouchableOpacity style={styles.refreshBtn}>
                                    <Image source={ProfileRefresh} style={styles.refreshIcon} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.unlinkedBtn}>
                                    <Text style={styles.unlinkedText}>Unlinked</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.row}>
                                <View style={styles.rowLeft}>
                                    <Image source={GrowIcon} style={styles.icon} />
                                    <Text style={styles.exchangeName}>Groww</Text>
                                </View>
                                <TouchableOpacity style={styles.refreshBtn}>
                                    <Image source={ProfileRefresh} style={styles.refreshIcon} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.unlinkedBtn}>
                                    <Text style={styles.unlinkedText}>Unlinked</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.row}>
                                <View style={styles.rowLeft}>
                                    <Image source={GrowIcon} style={styles.icon} />
                                    <Text style={styles.exchangeName}>Groww</Text>
                                </View>
                                <TouchableOpacity style={styles.refreshBtn}>
                                    <Image source={ProfileRefresh} style={styles.refreshIcon} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.unlinkedBtn}>
                                    <Text style={styles.unlinkedText}>Unlinked</Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity style={styles.addDematBtn}>
                                <Text style={styles.addDematText}>Add Demat</Text>
                            </TouchableOpacity>
                        </View>
                    )} */}

              {/* <TouchableOpacity style={accountPrivacy ? styles.kycHeader : styles.kycHeaderclosed} onPress={() => setAccountPrivacy(!accountPrivacy)}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Image source={LinkedAccount} style={{ width: 30, height: 30, marginRight: 8, }} />
                            <Text style={styles.kycTitle}>Account Privacy</Text>
                        </View>
                        <Image source={accountPrivacy ? ArrowUp : ArrowDown} style={{ width: 15, height: 8 }} />
                    </TouchableOpacity>
                    {accountPrivacy && (
                        <View style={styles.privacyCard}>

                            {[
                                "Profile Picture",
                                "Who Can Message You",
                                "Who Can Comment on Your Posts",
                                "Who Can Invite You to Groups",
                                "Allow Mentions in Posts",
                                "Website",
                                "Badges & Achievements",
                                "Contact Number Visibility",
                                "Email Visibility",
                            ].map((item, index) => (
                                <View key={index} style={styles.dropdownRow}>
                                    <View>
                                        <Text style={styles.dropdownTitle}>{item}</Text>
                                        <Text style={styles.dropdownSub}>Everyone</Text>
                                    </View>

                                    <Image
                                        source={ArrowDown}
                                        style={styles.arrowIcon}
                                    />
                                </View>
                            ))}
                        </View>
                    )} */}
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          <Modal visible={phoneOtpModalOpen} transparent animationType="fade">
            <View style={popupStyles.overlay}>
              <View style={popupStyles.box}>
                <Text style={popupStyles.title}>Verify Mobile</Text>
                <Text style={popupStyles.sub}>
                  OTP sent to +91 {editMobile}
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
          <Modal visible={showPhoneOtpModal} transparent animationType="fade">
            <View style={popupStyles.overlay}>
              <View style={popupStyles.box}>
                <Text style={popupStyles.title}>Verify Phone</Text>
                <Text style={popupStyles.sub}>
                  OTP sent to +91 {editMobile}
                </Text>

                {/* OTP BOXES */}
                <View
                  style={{ flexDirection: "row", justifyContent: "center" }}
                >
                  {phoneOtp.map((d, i) => (
                    <TextInput
                      key={i}
                      style={styles.otpBox}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={d}
                      onChangeText={(t) => handlePhoneOtpChange(t, i)}
                      textAlign="center"
                    />
                  ))}
                </View>

                {!!phoneOtpError && (
                  <Text style={{ color: "red", fontSize: 12 }}>
                    {phoneOtpError}
                  </Text>
                )}

                <TouchableOpacity onPress={sendPhoneOtp}>
                  <Text
                    style={{ color: global.colors.secondary, marginTop: 10 }}
                  >
                    Resend OTP
                  </Text>
                </TouchableOpacity>

                <View style={popupStyles.btnRow}>
                  <TouchableOpacity onPress={() => setShowPhoneOtpModal(false)}>
                    <Text style={popupStyles.cancel}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={verifyPhoneOtp}>
                    <Text style={popupStyles.verify}>Verify</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal
            visible={successModalOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setSuccessModalOpen(false)}
          >
            <View style={styles.successOverlay}>
              <View style={styles.successCard}>
                <View style={styles.successIcon}>
                  <Image
                    source={require("../../assets/confirmalert.png")}
                    style={styles.alertIconImg}
                  />
                </View>
                <Text style={styles.successTitle}>Feedback Submitted</Text>
                <Text style={styles.successText}>
                  We really appreciate you taking the time to share your
                  thoughts. Your input helps us create a better experience for
                  all users.
                </Text>
                <TouchableOpacity
                  style={styles.successBtn}
                  onPress={() => setSuccessModalOpen(false)}
                >
                  <Text style={styles.successBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <Modal
            visible={successIssueModalOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setSuccessIssueModalOpen(false)}
          >
            <View style={styles.successOverlay}>
              <View style={styles.successCard}>
                <View style={styles.successIcon}>
                  <Image
                    source={require("../../assets/confirmalert.png")}
                    style={styles.alertIconImg}
                  />
                </View>
                <Text style={styles.successTitle}>Report Submitted</Text>
                <Text style={styles.successText}>
                  Thanks for bringing this to our attention. We may contact you
                  in case more information is required.
                </Text>
                <TouchableOpacity
                  style={styles.successBtn}
                  onPress={() => setSuccessIssueModalOpen(false)}
                >
                  <Text style={styles.successBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <Modal
            visible={reportModalOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setReportModalOpen(false)}
          >
            <Animated.View
              style={[styles.modalOverlay, { transform: [{ translateY }] }]}
            >
              <View style={styles.reportCard}>
                <TouchableOpacity
                  style={styles.reportClose}
                  onPress={() => setReportModalOpen(false)}
                >
                  <Text style={{ fontSize: 22 }}>✕</Text>
                </TouchableOpacity>

                <Text style={styles.reportTitle}>Report an Issue</Text>
                <Text style={styles.reportSubtitle}>
                  Your report helps keep the platform accurate and safe.
                </Text>

                <View style={{ position: "relative", zIndex: 10 }}>
                  <Text style={styles.reportLabel}>Issue Categories</Text>
                  <TouchableOpacity
                    style={styles.dropdownBox}
                    onPress={() => setIssueDropdownOpen(!issueDropdownOpen)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        color: issueCategory
                          ? global.colors.secondary
                          : global.colors.disabled,
                      }}
                    >
                      {issueCategory || "Select your concern"}
                    </Text>
                    <Text style={{ fontSize: 16 }}>▾</Text>
                  </TouchableOpacity>

                  {issueDropdownOpen && (
                    <View style={styles.dropdownList}>
                      {[
                        "Suspected Activity",
                        "Incorrect Data",
                        "Privacy Concern",
                        "Misleading Information",
                        "Other Issues",
                      ].map((item, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setIssueCategory(item);
                            setIssueDropdownOpen(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <Text style={styles.reportLabel}>Description</Text>
                <View style={styles.textAreaBox}>
                  <TextInput
                    placeholder="Tell us what’s on your mind..."
                    value={issueDescription}
                    onChangeText={setIssueDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    style={styles.textArea}
                  />

                  <View style={styles.attachInside}>
                    <TouchableOpacity
                      style={{ flexDirection: "row", alignItems: "center" }}
                      onPress={pickAttachment}
                    >
                      <Image source={Attach} style={styles.iconSmall2} />
                    </TouchableOpacity>
                  </View>
                </View>
                {attachment && (
                  <View style={styles.attachRow}>
                    <Text style={styles.attachLabel}>Add Screenshot</Text>
                    <TouchableOpacity
                      onPress={() => setAttachment(null)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={styles.attachRemove}>×</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.reportBtnRow}>
                  <TouchableOpacity
                    style={styles.reportCancel}
                    onPress={() => setReportModalOpen(false)}
                  >
                    <Text style={styles.reportCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.reportSubmit}
                    onPress={submitReportIssue}
                  >
                    <Text style={styles.reportSubmitText}>Submit Report</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </Modal>
          <Modal
            visible={deleteModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setDeleteModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCardNew}>
                <View style={styles.alertIcon}>
                  <Image
                    source={require("../../assets/redalert.png")}
                    style={styles.alertIconImg}
                  />
                </View>
                <Text style={styles.modalTitle}>Account Deletion Request</Text>
                <Text style={styles.modalMessage}>
                  For security reasons, your account cannot be deleted directly
                  from the app.
                  {"\n\n"}
                  Please contact our support team to proceed with account
                  deletion. They will assist you further.
                  {"\n\n"}
                  Please email to support@inriser.com
                </Text>
                <TouchableOpacity
                  style={styles.modalBtn}
                  onPress={() => setDeleteModalVisible(false)}
                >
                  <Text style={styles.modalBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            visible={feedbackModalOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setFeedbackModalOpen(false)}
          >
            <Animated.View
              style={[styles.modalOverlay, { transform: [{ translateY }] }]}
            >
              <View style={styles.feedbackCard}>
                <TouchableOpacity
                  style={styles.feedbackClose}
                  onPress={() => setFeedbackModalOpen(false)}
                >
                  <Text style={{ fontSize: 22 }}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.feedbackTitle}>Share Your Feedback</Text>
                <Text style={styles.feedbackSubtitle}>
                  Help us improve your experience by telling us what you think.
                </Text>
                <Text style={styles.feedbackQuestion}>
                  How was your experience?
                </Text>
                <View style={styles.starRow}>
                  {["1 Star", "2 Star", "3 Star", "4 Star", "5 Star"].map(
                    (star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setRating(star)}
                      >
                        <Text
                          style={[
                            styles.star,
                            {
                              color:
                                star <= rating
                                  ? global.colors.warning
                                  : global.colors.disabled,
                            },
                          ]}
                        >
                          ★
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </View>
                <Text style={styles.feedbackLabel}>Description</Text>
                <View style={styles.feedbackInputBox}>
                  <TextInput
                    placeholder="Tell us what’s on your mind..."
                    value={feedbackText}
                    onChangeText={setFeedbackText}
                    multiline
                    style={styles.feedbackInput}
                  />
                </View>
                <View style={styles.feedbackBtnRow}>
                  <TouchableOpacity
                    style={styles.feedbackCancel}
                    onPress={() => setFeedbackModalOpen(false)}
                  >
                    <Text style={styles.feedbackCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.feedbackSubmit}
                    onPress={submitFeedback}
                  >
                    <Text style={styles.feedbackSubmitText}>
                      Submit Feedback
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </Modal>
          <Modal
            visible={termsModalOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setTermsModalOpen(false)}
          >
            <Animated.View style={styles.modalOverlay}>
              <View style={styles.termsCard}>
                <View style={styles.termsHeader}>
                  <Text style={styles.termsTitle}>Terms & Conditions</Text>
                  <TouchableOpacity onPress={() => setTermsModalOpen(false)}>
                    <Text style={{ fontSize: 20 }}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.termsSectionTitle}>
                    Policies & Disclaimers
                  </Text>
                  <Text style={styles.termsItemTitle}>• Privacy Policy</Text>
                  <Text style={styles.termsText}>
                    We respect your privacy and are committed to protecting your
                    personal information. User data is used only to improve app
                    functionality and user experience.
                  </Text>
                  <Text style={styles.termsItemTitle}>
                    • Refund & Subscription Policy
                  </Text>
                  <Text style={styles.termsText}>
                    All subscription purchases are final. Refunds, if
                    applicable, are processed according to platform guidelines
                    and applicable laws.
                  </Text>
                  <Text style={styles.termsItemTitle}>
                    • Market Data & Accuracy
                  </Text>
                  <Text style={styles.termsText}>
                    Market data is provided on a best-effort basis and may be
                    delayed or inaccurate. We do not guarantee completeness or
                    accuracy.
                  </Text>
                  <Text style={styles.termsItemTitle}>
                    • Market Risk Disclaimer
                  </Text>
                  <Text style={styles.termsText}>
                    Investments are subject to market risks. Past performance is
                    not indicative of future results.
                  </Text>
                  <Text style={styles.termsItemTitle}>
                    • No Investment Advice
                  </Text>
                  <Text style={styles.termsText}>
                    The information provided is for educational purposes only
                    and does not constitute financial advice.
                  </Text>
                  <Text style={styles.termsItemTitle}>
                    • User Responsibility
                  </Text>
                  <Text style={styles.termsText}>
                    Users are responsible for their investment decisions and
                    compliance with applicable laws.
                  </Text>
                  <Text style={styles.termsItemTitle}>
                    • Limitation of Liability
                  </Text>
                  <Text style={styles.termsText}>
                    We shall not be liable for any losses arising from the use
                    of the platform.
                  </Text>
                  <Text style={styles.termsItemTitle}>• Policy Updates</Text>
                  <Text style={styles.termsText}>
                    Policies may be updated periodically. Continued use of the
                    app implies acceptance of updated terms.
                  </Text>
                  <TouchableOpacity onPress={() => setDeleteModalVisible(true)}>
                    <Text style={styles.deleteAccountText}>Delete Account</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </Animated.View>
          </Modal>
          <Modal
            visible={appInfoModalOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setAppInfoModalOpen(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.termsCard}>
                {/* Header */}
                <View style={styles.termsHeader}>
                  <Text style={styles.termsTitle}>App Information</Text>
                  <TouchableOpacity onPress={() => setAppInfoModalOpen(false)}>
                    <Text style={{ fontSize: 20 }}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Content */}
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.appInfoLabel}>Version</Text>
                  <Text style={styles.appInfoValue}>1.0.0</Text>

                  <Text style={styles.appInfoLabel}>Developed By</Text>
                  <Text style={styles.appInfoValue}>
                    Inriser Consulting Private Limited
                  </Text>

                  <Text style={styles.appInfoLabel}>CIN</Text>
                  <Text style={styles.appInfoValue}>U74999UP2021PTC154107</Text>
                </ScrollView>
              </View>
            </View>
          </Modal>

          <Modal visible={editOpen} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <Animated.View
                style={[styles.modalCard, { transform: [{ translateY }] }]}
              >
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity
                  style={styles.imagePicker}
                  onPress={pickImage}
                >
                  <Image
                    source={getImageSource(editImage)}
                    style={styles.modalImage}
                  />
                  <Text style={styles.uploadText}>Change Photo</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.modalInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Name"
                />
                {!!editErrors.name && (
                  <Text style={{ color: "red", fontSize: 12, marginBottom: 6 }}>
                    {editErrors.name}
                  </Text>
                )}
                <TextInput
                  style={styles.modalInput}
                  value={editUsername}
                  onChangeText={setEditUsername}
                  placeholder="Username"
                />
                {!!editErrors.username && (
                  <Text style={{ color: "red", fontSize: 12, marginBottom: 6 }}>
                    {editErrors.username}
                  </Text>
                )}
                <TextInput
                  style={styles.modalInput}
                  value={editMobile}
                  onChangeText={handleMobileChange}
                  placeholder="Mobile Number"
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {editMobile !== mobile && !phoneOtpVerified && (
                  <TouchableOpacity
                    style={popupStyles.verifyphoneBtn}
                    onPress={sendProfilePhoneOtp}
                  >
                    <Text style={popupStyles.verifyphoneText}>
                      Verify Mobile
                    </Text>
                  </TouchableOpacity>
                )}

                {editMobile !== mobile && phoneOtpVerified && (
                  <Text
                    style={{
                      color: "green",
                      fontSize: 10,
                      alignSelf: "flex-end",
                      marginTop: -4,
                      marginBottom: 8,
                    }}
                  >
                    ✓ Phone verified
                  </Text>
                )}

                {!!editErrors.mobile && (
                  <Text style={{ color: "red", fontSize: 12, marginBottom: 6 }}>
                    {editErrors.mobile}
                  </Text>
                )}

                <TextInput
                  style={styles.modalInput}
                  value={editEmail}
                  onChangeText={handleEmailChange}
                  placeholder="Email Id (Optional)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {!!editErrors.email && (
                  <Text style={{ color: "red", fontSize: 12, marginBottom: 6 }}>
                    {editErrors.email}
                  </Text>
                )}
                {editEmail && !editEmailVerified && (
                  <TouchableOpacity
                    style={popupStyles.verifyBtn}
                    onPress={sendProfileEmailOtp}
                    disabled={emailOtpLoading}
                  >
                    <Text style={popupStyles.verifyText}>
                      {emailOtpLoading ? "Sending OTP..." : "Verify Email"}
                    </Text>
                  </TouchableOpacity>
                )}

                {editEmailVerified && editEmail !== email && (
                  <Text
                    style={{
                      color: "green",
                      fontSize: 10,
                      marginBottom: 6,
                      alignSelf: "flex-end",
                    }}
                  >
                    ✓ Email verified
                  </Text>
                )}

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setEditOpen(false)}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  {!!editErrors.general && (
                    <Text
                      style={{ color: "red", fontSize: 12, marginBottom: 8 }}
                    >
                      {editErrors.general}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.saveBtnModal}
                    onPress={handleSaveProfile}
                  >
                    <Text style={styles.saveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </Modal>
          <Modal visible={emailOtpModalOpen} transparent animationType="fade">
            <View style={popupStyles.overlay}>
              <View style={popupStyles.box}>
                <Text style={popupStyles.title}>Verify Email</Text>
                <Text style={popupStyles.sub}>OTP sent to {editEmail}</Text>

                <TextInput
                  style={popupStyles.input}
                  keyboardType="number-pad"
                  maxLength={4}
                  placeholder="Enter OTP"
                  value={editEmailOtp}
                  onChangeText={(t) => {
                    setEditEmailOtp(t);
                    setEditEmailOtpError("");
                  }}
                />

                {!!editEmailOtpError && (
                  <Text style={{ color: "red", fontSize: 12 }}>
                    {editEmailOtpError}
                  </Text>
                )}

                <View style={popupStyles.btnRow}>
                  <TouchableOpacity onPress={() => setEmailOtpModalOpen(false)}>
                    <Text style={popupStyles.cancel}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={verifyProfileEmailOtp}>
                    <Text style={popupStyles.verify}>Verify</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal
            visible={previewVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setPreviewVisible(false)}
          >
            <View style={styles.previewOverlay}>
              <View style={styles.previewCard}>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${previewBase64}` }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
                <TouchableOpacity
                  style={styles.previewCloseBtn}
                  onPress={() => setPreviewVisible(false)}
                >
                  <Text style={styles.previewCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </Animated.View>
      </SafeAreaView>
      <BottomTabBar />
    </>
  );
};
export default ProfileScreen;

/* ------------------ STYLES ------------------ */
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: global.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },

  modalCard: {
    width: "90%",
    backgroundColor: global.colors.background,
    borderRadius: 20,
    padding: 20,
  },

  modalCardNew: {
    width: "85%",
    backgroundColor: global.colors.background,
    borderRadius: 16,
    padding: 22,
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: global.colors.secondary,
    textAlign: "center",
    marginBottom: 12,
  },

  imagePicker: {
    alignItems: "center",
    marginBottom: 14,
  },

  modalImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },

  uploadText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: global.colors.secondary,
  },

  modalInput: {
    backgroundColor: global.colors.surface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    fontSize: 14,
  },

  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  modalBtn: {
    backgroundColor: global.colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderRadius: 20,
    marginTop: 15,
  },

  modalBtnText: {
    color: global.colors.background,
    fontWeight: "600",
  },
  cancelBtn: {
    width: "48%",
    borderWidth: 1,
    borderColor: global.colors.secondary,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
  },

  cancelText: {
    color: global.colors.secondary,
    fontWeight: "600",
  },

  saveBtnModal: {
    width: "48%",
    backgroundColor: global.colors.secondary,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
  },

  saveText: {
    color: global.colors.background,
    fontWeight: "700",
  },

  logoutBtn: {
    width: "90%",
    alignSelf: "center",
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: global.colors.secondary,
    marginTop: 15,
    marginBottom: 10,
    backgroundColor: global.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },

  logoutText: {
    fontSize: 16,
    color: global.colors.secondary,
    fontWeight: "600",
  },

  deleteBtn: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: global.colors.error,
    borderRadius: 20,
    marginTop: 10,
    marginBottom: 20,
  },

  deleteText: {
    fontSize: 14,
    color: global.colors.background,
    fontWeight: "600",
  },

  privacyCard: {
    backgroundColor: global.colors.surface,
    marginHorizontal: 16,
    padding: 16,
    paddingTop: 10,
    borderRadius: 18,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },

  dropdownRow: {
    backgroundColor: global.colors.background,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdownTitle: {
    fontSize: 14,
    color: global.colors.secondary,
    fontWeight: "600",
  },

  dropdownSub: {
    fontSize: 12,
    color: global.colors.textSecondary,
    marginTop: 2,
  },

  arrowIcon: {
    width: 18,
    height: 10,
    tintColor: global.colors.secondary,
  },

  linkedBox: {
    backgroundColor: global.colors.surface,
    marginHorizontal: 16,
    padding: 16,
    paddingTop: 10,
    borderRadius: 18,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },

  row: {
    backgroundColor: global.colors.background,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 12,
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  icon: {
    width: 32,
    height: 32,
    marginRight: 10,
  },

  exchangeName: {
    fontSize: 15,
    color: global.colors.secondary,
    fontWeight: "600",
  },

  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  refreshIcon: {
    width: 30,
    height: 30,
  },

  disconnectBtn: {
    backgroundColor: global.colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },

  disconnectText: {
    color: global.colors.background,
    fontWeight: "600",
    fontSize: 13,
  },

  unlinkedBtn: {
    backgroundColor: global.colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
  },

  unlinkedText: {
    color: global.colors.background,
    fontWeight: "600",
    fontSize: 13,
  },

  addDematBtn: {
    backgroundColor: global.colors.secondary,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
    alignItems: "center",
  },

  addDematText: {
    color: global.colors.background,
    fontSize: 16,
    fontWeight: "700",
  },

  /* SETTINGS CARD */
  settingsCard: {
    backgroundColor: global.colors.surface,
    marginHorizontal: 16,
    padding: 16,
    paddingTop: 10,
    borderRadius: 18,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },

  settingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  settingsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: global.colors.secondary,
  },

  closeSliderBtnRight: {
    position: "absolute",
    right: 10,
    top: 10,
    zIndex: 999,
    padding: 0,
  },

  /* DROPDOWN */
  dropdownBox: {
    backgroundColor: global.colors.background,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: global.colors.secondary,
    marginBottom: 6,
  },

  inputText: {
    color: global.colors.textSecondary,
    fontSize: 14,
  },

  iconSmall2: {
    width: 18,
    height: 18,
    tintColor: global.colors.secondary,
  },

  iconSmall3: {
    width: 18,
    height: 18,
    tintColor: global.colors.secondary,
  },
  /* THEME TOGGLE */
  themeRow: {
    backgroundColor: global.colors.background,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  themeText: {
    color: global.colors.secondary,
    fontSize: 14,
    fontWeight: "600",
  },

  toggleOuter: {
    width: 50,
    height: 24,
    backgroundColor: global.colors.disabled,
    borderRadius: 20,
    justifyContent: "center",
  },

  toggleCircle: {
    width: 20,
    height: 20,
    backgroundColor: global.colors.background,
    borderRadius: 50,
    marginLeft: 3,
  },

  /* DIVIDER */
  divider: {
    height: 1,
    backgroundColor: global.colors.border,
    marginBottom: 20,
  },

  /* INPUT FIELDS */
  inputField: {
    backgroundColor: global.colors.background,
    borderRadius: 12,
    paddingVertical: 2, // 👈 height control
    paddingHorizontal: 14,
    marginBottom: 12, // 👈 thoda compact
  },

  /* BUTTON */
  saveBtn: {
    backgroundColor: global.colors.secondary,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },

  saveBtnText: {
    color: global.colors.background,
    fontSize: 16,
    fontWeight: "700",
  },

  container: {
    flex: 1,
    backgroundColor: global.colors.primary,
  },

  /* PROFILE CARD */
  profileCard: {
    marginTop: 15,
    marginHorizontal: 16,
    paddingTop: 10,
    backgroundColor: global.colors.surface,
    borderRadius: 18,
    padding: 16,
    elevation: 3,
    position: "relative", // 👈 REQUIRED
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  profileImage: {
    width: 90,
    height: 110,
    borderRadius: 12,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  nameText: {
    fontSize: 18,
    fontWeight: "700",
    color: global.colors.secondary,
  },

  docIcon: {
    padding: 4,
    borderRadius: 6,
    marginLeft: 6,
  },

  username: { fontSize: 14, color: global.colors.textSecondary, marginTop: 4 },
  contact: { fontSize: 14, color: global.colors.textSecondary, marginTop: 2 },
  location: { fontSize: 14, color: global.colors.textSecondary, marginTop: 2 },

  editBtn: {
    position: "absolute",
    right: 0,
    top: 0,
    borderRadius: 20,
  },

  planRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  planLabel: { fontSize: 10, color: global.colors.textSecondary },
  dateLabel: { fontSize: 10, color: global.colors.textSecondary },

  planStatus: {
    fontSize: 14,
    fontWeight: "700",
    color: global.colors.success,
    marginTop: 2,
  },

  planBtn: {
    borderWidth: 1,
    borderColor: global.colors.secondary,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },

  planBtnText: {
    fontSize: 11,
    color: global.colors.secondary,
    fontWeight: "600",
  },

  /* 3 STATS CARDS */
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    marginHorizontal: 16,
  },

  statsCard: {
    backgroundColor: global.colors.surface,
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    alignItems: "center",
    elevation: 3,
    paddingBottom: 10,
  },

  statsIcon: { width: 22, height: 22, marginTop: 10, marginBottom: 5 },

  statsTitle: {
    fontSize: 10,
    color: global.colors.textSecondary,
    textAlign: "center",
  },

  statsValue: {
    fontSize: 12,
    fontWeight: "700",
    color: global.colors.secondary,
    marginTop: 2,
  },

  statsCode: {
    fontSize: 10,
    color: global.colors.secondary,
    marginTop: 2,
  },

  badgesSection: {
    marginTop: 20,
    marginHorizontal: 16,
  },

  badgesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: global.colors.secondary,
    marginBottom: 10,
  },

  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  badgeCard: {
    backgroundColor: global.colors.secondary,
    padding: 10,
    borderRadius: 30,
    alignItems: "center",
    width: 80,
  },

  badgeIcon: { width: 22, height: 22 },
  badgeInnerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeCount: {
    color: global.colors.background,
    fontSize: 14,
    fontWeight: "700",
  },
  badgeLabel: {
    color: global.colors.secondary,
    fontSize: 11,
    marginTop: 5,
    textAlign: "center",
  },

  badgeInactive: {
    backgroundColor: global.colors.surface,
    padding: 10,
    borderRadius: 30,
    alignItems: "center",
    width: 70,
  },

  badgeIconInactive: {
    width: 22,
    height: 22,
    tintColor: global.colors.textSecondary,
  },

  badgeLabelInactive: { color: global.colors.textSecondary, fontSize: 11 },

  /* KYC COLLAPSIBLE */
  kycHeader: {
    marginTop: 10,
    backgroundColor: global.colors.surface,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  kycHeaderclosed: {
    marginTop: 10,
    backgroundColor: global.colors.surface,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kycTitle: { fontSize: 15, fontWeight: "700", color: global.colors.secondary },
  kycPercent: {
    marginLeft: 8,
    fontWeight: "700",
    color: global.colors.secondary,
  },

  kycBody: {
    backgroundColor: global.colors.surface,
    marginHorizontal: 16,
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginTop: -8,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: global.colors.secondary,
    marginBottom: 6,
  },

  genderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  genderBtn: {
    backgroundColor: global.colors.background,
    borderRadius: 12,
    width: "48%",
    paddingVertical: 12,
    alignItems: "center",
  },

  genderText: {
    fontSize: 14,
    color: global.colors.secondary,
    fontWeight: "600",
  },
  inputBox: {
    backgroundColor: global.colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  datepickerinputBox: {
    backgroundColor: global.colors.background,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  inputText: { color: global.colors.textSecondary },

  iconSmall: { width: 16, height: 18, tintColor: global.colors.textSecondary },
  iconSmall2: { width: 22, height: 25, tintColor: global.colors.textSecondary },

  fileTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },

  fileTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: global.colors.background,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 2,
    marginRight: 8,
    marginBottom: 6,
  },

  fileTagText: {
    fontSize: 12,
    color: global.colors.secondary,
  },

  submitBtn: {
    backgroundColor: global.colors.secondary,
    paddingVertical: 10,
    borderRadius: 16,
    marginTop: 16,
    alignItems: "center",
  },

  submitText: {
    color: global.colors.background,
    fontSize: 16,
    fontWeight: "700",
  },
  genderSelected: {
    backgroundColor: global.colors.secondary,
  },

  genderTextSelected: {
    color: global.colors.background,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: global.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },

  previewCard: {
    width: "90%",
    backgroundColor: global.colors.background,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
  },

  previewImage: {
    width: "100%",
    height: 400,
    borderRadius: 8,
  },

  previewCloseBtn: {
    marginTop: 12,
    backgroundColor: global.colors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 14,
  },

  previewCloseText: {
    color: global.colors.background,
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: global.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },

  successIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: global.colors.success,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  alertIconImg: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  aboutUsBody: {
    backgroundColor: global.colors.surface,
    marginHorizontal: 16,
    padding: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginTop: -8,
  },

  aboutItem: {
    backgroundColor: global.colors.background,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  aboutText: {
    fontSize: 15,
    color: global.colors.secondary,
    fontWeight: "600",
  },

  aboutArrow: {
    fontSize: 20,
    color: global.colors.secondary,
    fontWeight: "600",
  },
  feedbackCard: {
    width: "90%",
    backgroundColor: global.colors.background,
    borderRadius: 18,
    padding: 20,
  },

  feedbackClose: {
    position: "absolute",
    right: 14,
    top: 14,
  },

  feedbackTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: global.colors.secondary,
    marginBottom: 6,
  },

  feedbackSubtitle: {
    fontSize: 14,
    color: global.colors.textSecondary,
    marginBottom: 14,
    width: 270,
  },

  feedbackQuestion: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },

  starRow: {
    flexDirection: "row",
    marginBottom: 16,
  },

  star: {
    fontSize: 30,
    marginRight: 6,
  },

  feedbackLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },

  feedbackInputBox: {
    backgroundColor: global.colors.surface,
    borderRadius: 12,
    padding: 10,
    marginBottom: 18,
  },

  feedbackInput: {
    height: 80,
    textAlignVertical: "top",
    fontSize: 14,
  },

  feedbackBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  feedbackCancel: {
    backgroundColor: global.colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },

  feedbackCancelText: {
    fontSize: 14,
    fontWeight: "600",
  },

  feedbackSubmit: {
    backgroundColor: global.colors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 26,
    borderRadius: 20,
  },

  feedbackSubmitText: {
    color: global.colors.background,
    fontSize: 14,
    fontWeight: "700",
  },
  textAreaBox: {
    backgroundColor: global.colors.background,
    borderWidth: 1,
    borderColor: global.colors.border,
    borderRadius: 12,
    padding: 12,
    position: "relative", // 🔥 IMPORTANT
  },

  textArea: {
    height: 110,
    fontSize: 14,
    color: global.colors.secondary,
    textAlignVertical: "top",
    paddingBottom: 28, // 👈 space for attachment row
  },
  reportCard: {
    width: "90%",
    backgroundColor: global.colors.background,
    borderRadius: 18,
    padding: 20,
  },

  reportClose: {
    position: "absolute",
    right: 14,
    top: 14,
  },

  reportTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: global.colors.secondary,
    marginBottom: 4,
  },

  reportSubtitle: {
    fontSize: 13,
    color: global.colors.textSecondary,
    marginBottom: 14,
    width: 270,
  },

  reportLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: global.colors.secondary,
  },

  dropdownBox: {
    backgroundColor: global.colors.background,
    borderWidth: 1,
    borderColor: global.colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  dropdownList: {
    position: "absolute",
    top: 70, // dropdownBox ke niche
    left: 0,
    right: 0,
    backgroundColor: global.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: global.colors.border,
    zIndex: 9999, // iOS
    elevation: 10, // Android
    shadowColor: global.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },

  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: global.colors.border,
  },

  dropdownItemText: {
    fontSize: 14,
    color: global.colors.secondary,
  },

  textAreaBox: {
    backgroundColor: global.colors.background,
    borderWidth: 1,
    borderColor: global.colors.border,
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },

  textArea: {
    height: 90,
    fontSize: 14,
    color: global.colors.secondary,
    textAlignVertical: "top",
  },

  reportBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  reportCancel: {
    backgroundColor: global.colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 20,
  },

  reportCancelText: {
    fontSize: 14,
    fontWeight: "600",
  },

  reportSubmit: {
    backgroundColor: global.colors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 26,
    borderRadius: 20,
  },

  reportSubmitText: {
    color: global.colors.background,
    fontSize: 14,
    fontWeight: "700",
  },
  termsCard: {
    width: "90%",
    maxHeight: "85%",
    backgroundColor: global.colors.background,
    borderRadius: 18,
    padding: 16,
  },

  termsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  termsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: global.colors.secondary,
  },

  termsSectionTitle: {
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 10,
  },

  termsItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },

  termsText: {
    fontSize: 13,
    color: global.colors.textSecondary,
    marginBottom: 6,
    lineHeight: 18,
  },

  deleteAccountText: {
    fontSize: 13,
    color: global.colors.textSecondary,
    marginTop: 25,
    marginBottom: 6,
    lineHeight: 18,
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: global.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  checkboxText: {
    fontSize: 13,
    color: global.colors.secondary,
  },

  termsBtn: {
    backgroundColor: global.colors.secondary,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 12,
  },

  termsBtnText: {
    color: global.colors.background,
    fontSize: 15,
    fontWeight: "700",
  },
  successOverlay: {
    flex: 1,
    backgroundColor: global.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },

  successCard: {
    width: "85%",
    backgroundColor: global.colors.background,
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 22,
    alignItems: "center",
  },

  successIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: global.colors.success,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  successTick: {
    fontSize: 40,
    color: global.colors.background,
    fontWeight: "bold",
  },

  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: global.colors.textPrimary,
    marginBottom: 10,
  },

  successText: {
    fontSize: 15,
    color: global.colors.textSecondary,
    textAlign: "left",
    lineHeight: 20,
    marginBottom: 24,
  },

  successBtn: {
    backgroundColor: global.colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },

  successBtnText: {
    color: global.colors.background,
    fontSize: 15,
    fontWeight: "600",
  },
  attachInside: {
    position: "absolute",
    bottom: 8,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  attachIcon: {
    fontSize: 16,
    marginRight: 4,
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

  attachText: {
    fontSize: 12,
    color: global.colors.textSecondary,
  },

  attachRemove: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: "700",
  },
  attachRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -10,
    marginBottom: 20,
  },

  attachLabel: {
    fontSize: 12,
    color: global.colors.textSecondary,
  },

  attachRemove: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: "700",
    color: global.colors.textSecondary,
  },
  appInfoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: global.colors.secondary,
    marginTop: 12,
  },
  appInfoValue: {
    fontSize: 14,
    color: global.colors.textSecondary,
    marginTop: 4,
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
