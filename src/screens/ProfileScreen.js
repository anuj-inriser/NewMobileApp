import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Platform } from "react-native";
import axios from "axios";
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

const ProfileScreen = () => {

    const [kycOpen, setKycOpen] = useState(false);
    const [setting, setSetting] = useState(false);
    const [linkedAccount, setLinkedAccount] = useState(false);
    const [accountPrivacy, setAccountPrivacy] = useState(false);
    const navigation = useNavigation();
    const { authToken, clientId, clearAuth } = useAuth();
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
    const [profileImage, setProfileImage] = useState(null);
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

    const pickAttachment = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });

        if (!result.canceled) {
            setAttachment(result.assets[0]);
        }
    };

    const handleMobileChange = (text) => {
        const cleaned = text.replace(/[^0-9]/g, "");
        if (cleaned.length <= 10) {
            setEditMobile(cleaned);
        }
    };
    const handleEmailChange = (text) => {
        setEditEmail(text.trim().toLowerCase());
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
            Alert.alert("Permission required", "Please allow media access");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: false,
            quality: 0.8,
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
    };
    const fetchKycPercent = async () => {
        try {
            const userId = await AsyncStorage.getItem("userId");

            const res = await axios.get(
                `${apiUrl}/api/userkyc/percent/${userId}`
            );
            setKycPercent(res.data.percent);

            if (res.data?.success) {
                setKycPercent(res.data.percent || 0);
            }

        } catch (err) {
            console.log(
                "❌ KYC PERCENT API ERROR =>",
                err?.response?.data || err.message
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
    const handleSaveProfile = async () => {
        try {
            const isValidEmail = (email) => {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            };

            const isValidMobile = (mobile) => {
                return /^[6-9]\d{9}$/.test(mobile);
            };

            if (!isValidEmail(editEmail)) {
                Alert.alert(
                    "Invalid Email",
                    "Please enter a valid email address."
                );
                return;
            }

            if (!isValidMobile(editMobile)) {
                Alert.alert(
                    "Invalid Mobile Number",
                    "Please enter a valid 10-digit mobile number."
                );
                return;
            }

            let imageBase64 = null;

            if (editImage && editImage !== profileImage) {
                imageBase64 = await uriToBase64(editImage);
            }

            const payload = {
                name: editName,
                username: editUsername,
                phone: editMobile,
                email: editEmail,
                image: imageBase64,
            };

            const userId = await AsyncStorage.getItem("userId");
            await axios.put(`${apiUrl}/api/users/users/${userId}`, payload);
            setEditOpen(false);
            getUserById();
        } catch (err) {
            console.log("Save profile error =>", err);
        }
    };

    const formatAmount = (num) => {
        if (!num) return "0";
        return Number(num).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const getUserById = async () => {
        try {
            const userId = await AsyncStorage.getItem("userId");
            const res = await axios.get(`${apiUrl}/api/users/${userId}`);
            const user = res.data.data;
            setName(user.name || "");
            setUsername(user.username || "");
            setMobile(user.phone || "");
            setEmail(user.email || "");
            setCityVal(res.data.city || "");
            setStateVal(res.data.state || "");
            setProfileImage(user.userimage || null);

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

                const processed = json.data.map(item => {

                    const realisedQty = Number(item.realisedquantity) || 0;
                    const ltp = Number(item.ltp) || 0;
                    const avg = Number(item.averageprice) || 0;
                    const invested = avg * realisedQty;
                    const currentValue = ltp * realisedQty;
                    const profit = currentValue - invested;
                    const profitPercent =
                        invested > 0
                            ? ((profit / invested) * 100).toFixed(2)
                            : "0.00";
                    totalCurrentValue += currentValue;
                    totalProfitValue += profit;
                    totalInvestedValue += invested;

                    return {
                        ...item,
                        invested: invested.toFixed(2),
                        currentValue: currentValue.toFixed(2),
                        profit: profit.toFixed(2),
                        profitPercent
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
    const profitColor = Number(totalProfit) >= 0 ? "#1CA95A" : "#D62828";
    const percentColor = Number(profitPercentage) >= 0 ? "#1CA95A" : "#D62828";
    const profitDisplay = `₹${formatAmount(Math.abs(totalProfit))}`;
    const percentDisplay = `${Math.abs(profitPercentage)}%`;
    const pickImage = async () => {
        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            Alert.alert("Permission required");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setEditImage(result.assets[0].uri);
        }
    };

    useEffect(() => {
        fetchPortfolioBalance();
        getUserById();
        loadKycData();
    }, []);

    const handleChangePassword = async () => {
        try {
            if (!newPassword || !confirmPassword) {
                Alert.alert("Error", "Both fields are required");
                return;
            }

            if (newPassword !== confirmPassword) {
                Alert.alert("Error", "Passwords do not match");
                return;
            }

            const userId = await AsyncStorage.getItem("userId");

            await axios.put(
                `${apiUrl}/api/users/change-password/${userId}`,
                {
                    password: newPassword,
                    confirmPassword: confirmPassword,
                }
            );

            Alert.alert("Success", "Password changed successfully");

            setNewPassword("");
            setConfirmPassword("");

        } catch (err) {
            console.log("Change Password Error =>", err);
            Alert.alert("Error", "Failed to change password");
        }
    };
    const handleLogout = async () => {
        try {
            const userIdStored = await AsyncStorage.getItem("userId");
            const authTokenStored = await AsyncStorage.getItem("authToken");
            const clientIdStored = await AsyncStorage.getItem("clientId");

            if (!userIdStored || !authTokenStored || !clientIdStored) {
                await clearAuth();
                navigation.reset({ index: 0, routes: [{ name: "Login" }] });
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
                navigation.reset({
                    index: 0,
                    routes: [{ name: "Login" }],
                });
            }

        } catch (err) {
            console.log("Logout Failed:", err);
        }
    };
    const getSingleBase64 = async (files = []) => {
        if (!files.length) return null;

        const file = files[0];
        if (!file?.uri) return null;

        return await uriToBase64(file.uri);
    };

    const handleKycSubmit = async () => {
        try {
            const isValidPan = (pan) => {
                return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan);
            };

            if (!isValidPan(pan)) {
                Alert.alert(
                    "Invalid PAN Number",
                    "Please enter a valid PAN number (e.g. ANDPS2321P)."
                );
                return;
            }

            const isValidAadhar = (aadhar) => {
                return /^[2-9]\d{11}$/.test(aadhar);
            };

            if (!isValidAadhar(aadhar)) {
                Alert.alert(
                    "Invalid Aadhaar Number",
                    "Please enter a valid 12-digit Aadhaar number."
                );
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
                panFiles.length > 0
                    ? await getSingleBase64(panFiles)
                    : panDocBase64;

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

            await axios.post(`${apiUrl}/api/userkyc/submit`, payload);
            setPanFiles([]);
            setAadharFiles([]);

            await loadKycData();
            fetchKycPercent();
            Alert.alert("Success", "KYC submitted successfully");
            setKycOpen(false);
            getUserById();
        } catch (error) {
            console.log("❌ KYC SUBMIT ERROR =>", error?.response?.data || error.message);
            Alert.alert("Error", "Failed to submit KYC");
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

            const res = await axios.post(
                `${apiUrl}/api/grievance/feedbacksubmit`,
                payload,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
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
                Alert.alert("Error", "Please select category and description");
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


            const res = await axios.post(
                `${apiUrl}/api/grievance/issuesubmit`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setSuccessIssueModalOpen(true);
            setReportModalOpen(false);
            setIssueCategory("");
            setIssueDescription("");
            setAttachment(null);

        } catch (err) {
            console.log("❌ REPORT ERROR:", err?.response?.data || err.message);
            Alert.alert("Error", "Failed to submit issue");
        }
    };


    const loadKycData = async () => {
        try {
            const userId = await AsyncStorage.getItem("userId");
            const res = await axios.get(`${apiUrl}/api/userkyc/getuserkyc/${userId}`);
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
            <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
                <TopHeader />
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    <View style={styles.profileCard}>

                        <View style={styles.topRow}>
                            <Image source={getImageSource(profileImage)} style={styles.profileImage} />

                            <View style={{ marginLeft: 12, }}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.nameText}>{name}</Text>
                                    {kycPercent === 100 && (
                                        <TouchableOpacity style={styles.docIcon}>
                                            <Image source={ProfileImg1} style={{ width: 16, height: 16 }} />
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

                            <TouchableOpacity style={styles.editBtn} onPress={openEditProfile}>
                                <Image source={ProfilePencil} style={{ width: 30, height: 30 }} />
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


                    <View style={styles.portfolioMainCard}>
                        <View>
                            <Text style={styles.cardTitle}>Portfolio Value</Text>

                            <Text style={styles.bigAmount}>
                                ₹ {formatAmount(totalCurrent)}

                                <Text style={{ color: profitColor, fontWeight: "700", fontSize: 10 }}>
                                    {" "}({profitDisplay})
                                </Text>

                                <Text style={{ color: percentColor, fontWeight: "700", fontSize: 10 }}>
                                    {" "}({percentDisplay})
                                </Text>
                            </Text>

                            <View style={{ marginTop: 12 }}>
                                <View style={styles.listRow}>
                                    <View style={[styles.dot, { backgroundColor: "#210F47" }]} />
                                    <Text style={styles.listText}>Equity</Text>
                                    <Text style={styles.listAmount}>₹{formatAmount(totalInvested)}</Text>
                                </View>

                                {/* <View style={styles.listRow}>
                                    <View style={[styles.dot, { backgroundColor: "#22C55E" }]} />
                                    <Text style={styles.listText}>Mutual Funds</Text>
                                    <Text style={styles.listAmount}>₹45,000</Text>
                                </View>

                                <View style={styles.listRow}>
                                    <View style={[styles.dot, { backgroundColor: "#D32F2F" }]} />
                                    <Text style={styles.listText}>Deposits</Text>
                                    <Text style={styles.listAmount}>₹15,000</Text>
                                </View>

                                <View style={styles.listRow}>
                                    <View style={[styles.dot, { backgroundColor: "#FF9F3F" }]} />
                                    <Text style={styles.listText}>ETF</Text>
                                    <Text style={styles.listAmount}>₹10,000</Text>
                                </View> */}
                            </View>
                        </View>

                        <View style={{ alignItems: "center", width: 140 }}>
                            <Text style={styles.cardTitleRight}>Invested Value</Text>
                            <Text style={styles.investedAmount}>₹ {formatAmount(totalInvested)}</Text>
                            {/* <View style={{ alignItems: "center", width: 140 }}>
                                <DonutChart />
                            </View> */}
                        </View>
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

                    <TouchableOpacity style={kycOpen ? styles.kycHeader : styles.kycHeaderclosed} onPress={() => setKycOpen(!kycOpen)}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Image source={KycIcon} style={{ width: 30, height: 30, marginRight: 8, }} />
                            <Text style={styles.kycTitle}>KYC Verification&nbsp;&nbsp;&nbsp;</Text>
                            <KycChart percentage={kycPercent} />
                        </View>

                        <Image source={kycOpen ? ArrowUp : ArrowDown} style={{ width: 15, height: 8 }} />
                    </TouchableOpacity>

                    {kycOpen && (
                        <View style={styles.kycBody}>
                            <Text style={styles.label}>Gender</Text>
                            <View style={styles.genderRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.genderBtn,
                                        gender === "Male" && styles.genderSelected
                                    ]}
                                    onPress={() => setGender("Male")}
                                >
                                    <Text
                                        style={[
                                            styles.genderText,
                                            gender === "Male" && styles.genderTextSelected
                                        ]}
                                    >
                                        Male
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.genderBtn,
                                        gender === "Female" && styles.genderSelected
                                    ]}
                                    onPress={() => setGender("Female")}
                                >
                                    <Text
                                        style={[
                                            styles.genderText,
                                            gender === "Female" && styles.genderTextSelected
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
                                            <Text style={{ marginLeft: 6, fontWeight: "700" }}>×</Text>
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
                                        <Text style={styles.fileTagText}> Aadhaar Document</Text>
                                    </TouchableOpacity>
                                )}


                                {aadharFiles.length > 0 && (
                                    <View style={styles.fileTag}>
                                        <Image source={Attach} style={styles.iconSmall3} />
                                        <Text style={styles.fileTagText}> Aadhaar Document</Text>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setAadharFiles([]);
                                                setAadharDocBase64(null);
                                            }}
                                        >
                                            <Text style={{ marginLeft: 6, fontWeight: "700" }}>×</Text>
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
                                style={[
                                    styles.submitBtn,
                                    isKycCompleted
                                ]}
                                onPress={() => {
                                    if (isKycCompleted) {
                                        Alert.alert(
                                            "Information",
                                            "Your KYC is already completed. If you need any changes, please contact support."
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

                    <TouchableOpacity style={setting ? styles.kycHeader : styles.kycHeaderclosed} onPress={() => setSetting(!setting)}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Image source={Setting} style={{ width: 30, height: 30, marginRight: 8, }} />
                            <Text style={styles.kycTitle}>Settings</Text>
                        </View>
                        <Image source={setting ? ArrowUp : ArrowDown} style={{ width: 15, height: 8 }} />
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

                            <Text style={styles.label}>Change Password</Text>
                            <View style={styles.inputField}>
                                <TextInput
                                    style={styles.inputText}
                                    placeholder="Enter your new password"
                                    secureTextEntry
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                />
                            </View>

                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={styles.inputField}>
                                <TextInput
                                    style={styles.inputText}
                                    placeholder="Re-enter your password"
                                    secureTextEntry
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                            </View>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword}>
                                <Text style={styles.saveBtnText}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity
                        style={aboutUsOpen ? styles.kycHeader : styles.kycHeaderclosed}
                        onPress={() => setAboutUsOpen(!aboutUsOpen)}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Image source={AboutUs} style={{ width: 30, height: 30, marginRight: 8, }} />
                            <Text style={styles.kycTitle}>About Us</Text>
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
                                "Register as Research & Analyst",
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

                    <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleteModalVisible(true)}>
                        <Text style={styles.deleteText}>
                            <Image
                                source={DeleteIcon} style={{ height: 12, width: 11, }}
                            />&nbsp; Delete Account</Text>
                    </TouchableOpacity>
                </ScrollView>
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
                                We really appreciate you taking the time to share your thoughts.
                                Your input helps us create a better experience for all users.
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
                                Thanks for bringing this to our attention. We may contact you in case more information is required.
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
                    <View style={styles.modalOverlay}>
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
                                    <Text style={{ color: issueCategory ? "#210F47" : "#999" }}>
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
                    </View>
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
                            <Text style={styles.modalTitle}>
                                Account Deletion Request
                            </Text>
                            <Text style={styles.modalMessage}>
                                For security reasons, your account cannot be deleted directly from the app.
                                {"\n\n"}
                                Please contact our support team to proceed with account deletion. They will assist you further.
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
                    <View style={styles.modalOverlay}>
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
                            <Text style={styles.feedbackQuestion}>How was your experience?</Text>
                            <View style={styles.starRow}>
                                {['1 Star', '2 Star', '3 Star', '4 Star', '5 Star'].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                        <Text
                                            style={[
                                                styles.star,
                                                { color: star <= rating ? "#F59E0B" : "#C4C4C4" },
                                            ]}
                                        >
                                            ★
                                        </Text>
                                    </TouchableOpacity>
                                ))}
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
                    </View>
                </Modal>
                <Modal
                    visible={termsModalOpen}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setTermsModalOpen(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.termsCard}>
                            <View style={styles.termsHeader}>
                                <Text style={styles.termsTitle}>Terms & Conditions</Text>
                                <TouchableOpacity onPress={() => setTermsModalOpen(false)}>
                                    <Text style={{ fontSize: 20 }}>✕</Text>
                                </TouchableOpacity>
                            </View>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={styles.termsSectionTitle}>Policies & Disclaimers</Text>
                                <Text style={styles.termsItemTitle}>• Privacy Policy</Text>
                                <Text style={styles.termsText}>
                                    We respect your privacy and are committed to protecting your personal
                                    information. User data is used only to improve app functionality and
                                    user experience.
                                </Text>
                                <Text style={styles.termsItemTitle}>• Refund & Subscription Policy</Text>
                                <Text style={styles.termsText}>
                                    All subscription purchases are final. Refunds, if applicable, are
                                    processed according to platform guidelines and applicable laws.
                                </Text>
                                <Text style={styles.termsItemTitle}>• Market Data & Accuracy</Text>
                                <Text style={styles.termsText}>
                                    Market data is provided on a best-effort basis and may be delayed or
                                    inaccurate. We do not guarantee completeness or accuracy.
                                </Text>
                                <Text style={styles.termsItemTitle}>• Market Risk Disclaimer</Text>
                                <Text style={styles.termsText}>
                                    Investments are subject to market risks. Past performance is not
                                    indicative of future results.
                                </Text>
                                <Text style={styles.termsItemTitle}>• No Investment Advice</Text>
                                <Text style={styles.termsText}>
                                    The information provided is for educational purposes only and does not
                                    constitute financial advice.
                                </Text>
                                <Text style={styles.termsItemTitle}>• User Responsibility</Text>
                                <Text style={styles.termsText}>
                                    Users are responsible for their investment decisions and compliance
                                    with applicable laws.
                                </Text>
                                <Text style={styles.termsItemTitle}>• Limitation of Liability</Text>
                                <Text style={styles.termsText}>
                                    We shall not be liable for any losses arising from the use of the
                                    platform.
                                </Text>
                                <Text style={styles.termsItemTitle}>• Policy Updates</Text>
                                <Text style={styles.termsText}>
                                    Policies may be updated periodically. Continued use of the app implies
                                    acceptance of updated terms.
                                </Text>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                <Modal visible={editOpen} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
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
                            <TextInput
                                style={styles.modalInput}
                                value={editUsername}
                                onChangeText={setEditUsername}
                                placeholder="Username"
                            />
                            <TextInput
                                style={styles.modalInput}
                                value={editMobile}
                                onChangeText={handleMobileChange}
                                placeholder="Mobile Number"
                                keyboardType="phone-pad"
                                maxLength={10}
                            />
                            <TextInput
                                style={styles.modalInput}
                                value={editEmail}
                                onChangeText={handleEmailChange}
                                placeholder="Email ID"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <View style={styles.modalBtnRow}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => setEditOpen(false)}
                                >
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.saveBtnModal}
                                    onPress={handleSaveProfile}
                                >
                                    <Text style={styles.saveText}>Save</Text>
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
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },

    modalCard: {
        width: "90%",
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
    },


    modalCardNew: {
        width: "85%",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 22,
        alignItems: "center",
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#210F47",
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
        color: "#210F47",
    },

    modalInput: {
        backgroundColor: "#F3F0FA",
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
        backgroundColor: "#2d1b69",
        paddingVertical: 8,
        paddingHorizontal: 22,
        borderRadius: 20,
        marginTop: 15,
    },

    modalBtnText: {
        color: "#fff",
        fontWeight: "600",
    },
    cancelBtn: {
        width: "48%",
        borderWidth: 1,
        borderColor: "#210F47",
        paddingVertical: 10,
        borderRadius: 14,
        alignItems: "center",
    },

    cancelText: {
        color: "#210F47",
        fontWeight: "600",
    },

    saveBtnModal: {
        width: "48%",
        backgroundColor: "#210F47",
        paddingVertical: 10,
        borderRadius: 14,
        alignItems: "center",
    },

    saveText: {
        color: "#fff",
        fontWeight: "700",
    },

    logoutBtn: {
        width: "90%",
        alignSelf: "center",
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: "#210F47",
        marginTop: 15,
        marginBottom: 10,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
    },

    logoutText: {
        fontSize: 16,
        color: "#210F47",
        fontWeight: "600",
    },

    deleteBtn: {
        alignSelf: "center",
        paddingVertical: 10,
        paddingHorizontal: 24,
        backgroundColor: "#D62828",
        borderRadius: 20,
        marginTop: 10,
        marginBottom: 20,
    },

    deleteText: {
        fontSize: 14,
        color: "#fff",
        fontWeight: "600",
    },

    privacyCard: {
        backgroundColor: "#EFE9F6",
        marginHorizontal: 16,
        padding: 16,
        paddingTop: 10,
        borderRadius: 18,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    },

    dropdownRow: {
        backgroundColor: "#fff",
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
        color: "#210F47",
        fontWeight: "600",
    },

    dropdownSub: {
        fontSize: 12,
        color: "#777",
        marginTop: 2,
    },

    arrowIcon: {
        width: 18,
        height: 10,
        tintColor: "#210F47",
    },

    linkedBox: {
        backgroundColor: "#EFE9F6",
        marginHorizontal: 16,
        padding: 16,
        paddingTop: 10,
        borderRadius: 18,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    },

    row: {
        backgroundColor: "#fff",
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
        color: "#210F47",
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
        backgroundColor: "#210F47",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
    },

    disconnectText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 13,
    },

    unlinkedBtn: {
        backgroundColor: "#210F47",
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 10,
    },

    unlinkedText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 13,
    },

    addDematBtn: {
        backgroundColor: "#210F47",
        paddingVertical: 10,
        borderRadius: 12,
        marginTop: 8,
        alignItems: "center",
    },

    addDematText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
    },

    /* SETTINGS CARD */
    settingsCard: {
        backgroundColor: "#EFE9F6",
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
        color: "#210F47",
    },

    /* DROPDOWN */
    dropdownBox: {
        backgroundColor: "#fff",
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
        color: "#210F47",
        marginBottom: 6,
    },

    inputText: {
        color: "#777",
        fontSize: 14,
    },

    iconSmall2: {
        width: 18,
        height: 18,
        tintColor: "#210F47",
    },

    iconSmall3: {
        width: 18,
        height: 18,
        tintColor: "#210F47",
    },
    /* THEME TOGGLE */
    themeRow: {
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },

    themeText: {
        color: "#210F47",
        fontSize: 14,
        fontWeight: "600",
    },

    toggleOuter: {
        width: 50,
        height: 24,
        backgroundColor: "#ddd",
        borderRadius: 20,
        justifyContent: "center",
    },

    toggleCircle: {
        width: 20,
        height: 20,
        backgroundColor: "#fff",
        borderRadius: 50,
        marginLeft: 3,
    },

    /* DIVIDER */
    divider: {
        height: 1,
        backgroundColor: "#C8C1D6",
        marginBottom: 20,
    },

    /* INPUT FIELDS */
    inputField: {
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingVertical: 2,   // 👈 height control
        paddingHorizontal: 14,
        marginBottom: 12,     // 👈 thoda compact
    },

    /* BUTTON */
    saveBtn: {
        backgroundColor: "#210F47",
        paddingVertical: 10,
        borderRadius: 14,
        alignItems: "center",
        marginTop: 10,
    },

    saveBtnText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },

    container: {
        flex: 1,
        backgroundColor: "#fff",
    },

    /* PROFILE CARD */
    profileCard: {
        marginTop: 15,
        marginHorizontal: 16,
        paddingTop: 10,
        backgroundColor: "#EFE9F6",
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
        color: "#210F47",
    },

    docIcon: {
        padding: 4,
        borderRadius: 6,
        marginLeft: 6,
    },

    username: { fontSize: 14, color: "#777", marginTop: 4 },
    contact: { fontSize: 14, color: "#777", marginTop: 2 },
    location: { fontSize: 14, color: "#777", marginTop: 2 },

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

    planLabel: { fontSize: 10, color: "#777" },
    dateLabel: { fontSize: 10, color: "#777" },

    planStatus: {
        fontSize: 14,
        fontWeight: "700",
        color: "green",
        marginTop: 2,
    },

    planBtn: {
        borderWidth: 1,
        borderColor: "#210F47",
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 20,
    },

    planBtnText: {
        fontSize: 11,
        color: "#210F47",
        fontWeight: "600",
    },


    /* PORTFOLIO CARD */
    portfolioMainCard: {
        marginTop: 15,
        marginHorizontal: 16,
        backgroundColor: "#EFE9F6",
        borderRadius: 18,
        padding: 18,
        elevation: 3,
        flexDirection: "row",
        justifyContent: "space-between",
    },

    cardTitle: {
        fontSize: 13,
        color: "#555",
        fontWeight: "600",
    },

    cardTitleRight: {
        fontSize: 13,
        color: "#555",
        fontWeight: "600",
        textAlign: "center",
    },

    bigAmount: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1CA95A",
        marginTop: 4,
    },

    greenGain: {
        fontSize: 12,
        color: "#1CA95A",
    },

    investedAmount: {
        fontSize: 15,
        fontWeight: "700",
        color: "#210F47",
        marginTop: 6,
    },

    listRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 3,
    },

    dot: {
        width: 12,
        height: 12,
        borderRadius: 3,
        marginRight: 8,
    },

    listText: {
        fontSize: 12,
        color: "#444",
        flex: 1,
    },

    listAmount: {
        fontSize: 12,
        fontWeight: "500",
        color: "#000",
    },


    /* 3 STATS CARDS */
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 15,
        marginHorizontal: 16,
    },

    statsCard: {
        backgroundColor: "#EFE9F6",
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
        color: "#777",
        textAlign: "center",
    },

    statsValue: {
        fontSize: 12,
        fontWeight: "700",
        color: "#210F47",
        marginTop: 2,
    },

    statsCode: {
        fontSize: 10,
        color: "#210F47",
        marginTop: 2,
    },

    badgesSection: {
        marginTop: 20,
        marginHorizontal: 16,
    },

    badgesTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#210F47",
        marginBottom: 10,
    },

    badgeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    badgeCard: {
        backgroundColor: "#210F47",
        padding: 10,
        borderRadius: 30,
        alignItems: "center",
        width: 80,
    },

    badgeIcon: { width: 22, height: 22, },
    badgeInnerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    badgeCount: { color: "#fff", fontSize: 14, fontWeight: "700", },

    badgeLabel: { color: "#210F47", fontSize: 11, marginTop: 5, textAlign: "center" },

    badgeInactive: {
        backgroundColor: "#DAD4E4",
        padding: 10,
        borderRadius: 30,
        alignItems: "center",
        width: 70,
    },

    badgeIconInactive: { width: 22, height: 22, tintColor: "#777" },

    badgeLabelInactive: { color: "#777", fontSize: 11 },


    /* KYC COLLAPSIBLE */
    kycHeader: {
        marginTop: 10,
        backgroundColor: "#EFE9F6",
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
        backgroundColor: "#EFE9F6",
        marginHorizontal: 16,
        padding: 14,
        borderRadius: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    kycTitle: { fontSize: 15, fontWeight: "700", color: "#210F47" },

    kycPercent: { marginLeft: 8, fontWeight: "700", color: "#210F47" },

    kycBody: {
        backgroundColor: "#EFE9F6",
        marginHorizontal: 16,
        padding: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        marginTop: -8,
    },

    label: {
        fontSize: 13,
        fontWeight: "600",
        color: "#210F47",
        marginBottom: 6,
        // marginTop: 8,
    },

    genderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },

    genderBtn: {
        backgroundColor: "#fff",
        borderRadius: 12,
        width: "48%",
        paddingVertical: 12,
        alignItems: "center",
    },

    genderText: { fontSize: 14, color: "#210F47", fontWeight: "600" },

    inputBox: {
        backgroundColor: "#fff",
        borderRadius: 12,
        // paddingVertical: 2,
        paddingHorizontal: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },

    datepickerinputBox: {
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingVertical: 11,
        paddingHorizontal: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    inputText: { color: "#777" },

    iconSmall: { width: 16, height: 18, tintColor: "#210F47" },
    iconSmall2: { width: 22, height: 25, tintColor: "#210F47" },

    fileTagRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 6,
    },

    fileTag: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 2,
        marginRight: 8,
        marginBottom: 6,
    },

    fileTagText: {
        fontSize: 12,
        color: "#210F47",
    },

    submitBtn: {
        backgroundColor: "#210F47",
        paddingVertical: 10,
        borderRadius: 16,
        marginTop: 16,
        alignItems: "center",
    },

    submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    genderSelected: {
        backgroundColor: "#210F47",
    },

    genderTextSelected: {
        color: "#fff",
    },
    previewOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
    },

    previewCard: {
        width: "90%",
        backgroundColor: "#fff",
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
        backgroundColor: "#210F47",
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 14,
    },

    previewCloseText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },

    successIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#22c55e",
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
        backgroundColor: "#EFE9F6",
        marginHorizontal: 16,
        padding: 12,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        marginTop: -8,
    },

    aboutItem: {
        backgroundColor: "#fff",
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
        color: "#210F47",
        fontWeight: "600",
    },

    aboutArrow: {
        fontSize: 20,
        color: "#210F47",
        fontWeight: "600",
    },
    feedbackCard: {
        width: "90%",
        backgroundColor: "#fff",
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
        color: "#210F47",
        marginBottom: 6,
    },

    feedbackSubtitle: {
        fontSize: 14,
        color: "#555",
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
        backgroundColor: "#F5F5F5",
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
        backgroundColor: "#E9E4EF",
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 20,
    },

    feedbackCancelText: {
        fontSize: 14,
        fontWeight: "600",
    },

    feedbackSubmit: {
        backgroundColor: "#210F47",
        paddingVertical: 10,
        paddingHorizontal: 26,
        borderRadius: 20,
    },

    feedbackSubmitText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "700",
    },
    textAreaBox: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 12,
        padding: 12,
        position: "relative",   // 🔥 IMPORTANT
    },

    textArea: {
        height: 110,
        fontSize: 14,
        color: "#210F47",
        textAlignVertical: "top",
        paddingBottom: 28,       // 👈 space for attachment row
    },
    reportCard: {
        width: "90%",
        backgroundColor: "#fff",
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
        color: "#210F47",
        marginBottom: 4,
    },

    reportSubtitle: {
        fontSize: 13,
        color: "#555",
        marginBottom: 14,
        width: 270,
    },

    reportLabel: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 6,
        color: "#210F47",
    },

    dropdownBox: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#DDD",
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
        top: 70,              // dropdownBox ke niche
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ddd",
        zIndex: 9999,         // iOS
        elevation: 10,        // Android
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },


    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#EEE",
    },

    dropdownItemText: {
        fontSize: 14,
        color: "#210F47",
    },

    textAreaBox: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 12,
        padding: 10,
        marginBottom: 16,
    },

    textArea: {
        height: 90,
        fontSize: 14,
        color: "#210F47",
        textAlignVertical: "top",
    },

    reportBtnRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    reportCancel: {
        backgroundColor: "#EAE6F2",
        paddingVertical: 10,
        paddingHorizontal: 22,
        borderRadius: 20,
    },

    reportCancelText: {
        fontSize: 14,
        fontWeight: "600",
    },

    reportSubmit: {
        backgroundColor: "#210F47",
        paddingVertical: 10,
        paddingHorizontal: 26,
        borderRadius: 20,
    },

    reportSubmitText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "700",
    },
    termsCard: {
        width: "90%",
        maxHeight: "85%",
        backgroundColor: "#fff",
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
        color: "#210F47",
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
        color: "#555",
        marginBottom: 6,
        lineHeight: 18,
    },

    checkboxRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
    },

    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        backgroundColor: "#210F47",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
    },

    checkboxText: {
        fontSize: 13,
        color: "#210F47",
    },

    termsBtn: {
        backgroundColor: "#210F47",
        paddingVertical: 12,
        borderRadius: 20,
        alignItems: "center",
        marginTop: 12,
    },

    termsBtnText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
    },
    successOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },

    successCard: {
        width: "85%",
        backgroundColor: "#fff",
        borderRadius: 20,
        paddingVertical: 30,
        paddingHorizontal: 22,
        alignItems: "center",
    },

    successIcon: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#22C55E",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },

    successTick: {
        fontSize: 40,
        color: "#fff",
        fontWeight: "bold",
    },

    successTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1F2937",
        marginBottom: 10,
    },

    successText: {
        fontSize: 15,
        color: "#4B5563",
        textAlign: "left",
        lineHeight: 20,
        marginBottom: 24,
    },

    successBtn: {
        backgroundColor: "#1E0A3C",
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 25,
    },

    successBtnText: {
        color: "#fff",
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

    attachText: {
        fontSize: 12,
        color: "#777",
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
        marginBottom: 20
    },

    attachLabel: {
        fontSize: 12,
        color: "#777",
    },

    attachRemove: {
        marginLeft: 6,
        fontSize: 16,
        fontWeight: "700",
        color: "#777",
    },

});