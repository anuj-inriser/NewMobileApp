import React, { useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Pressable,
    Modal,
    Alert, // Added import
} from "react-native";
import { useAlert } from "../../context/AlertContext";
import TextInput from "../../components/TextInput";
import {
    AlertCircle
} from 'lucide-react-native';
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker'; // Added import
import axios from 'axios'; // Added import
import { apiUrl } from "../../utils/apiUrl";
import { formatPublishedTime } from "../../utils/dateFormat"
import { useAuth } from "../../context/AuthContext"; // Added import

const NewsCardLarge = ({ item, onPress }) => {
    const { showSuccess, showError } = useAlert();
    const { userId } = useAuth(); // Get userId

    // console.log('item', item.news_content)
    const [menuVisible, setMenuVisible] = useState(false);
    const [cardLayout, setCardLayout] = useState({ x: 0, y: 0 });
    const [iconLayout, setIconLayout] = useState({ x: 0, y: 0, w: 0, h: 0 });

    // --- REPORTING LOGIC START ---
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [successIssueModalOpen, setSuccessIssueModalOpen] = useState(false);
    const [issueCategory, setIssueCategory] = useState("");
    const [issueDescription, setIssueDescription] = useState("");
    const [issueDropdownOpen, setIssueDropdownOpen] = useState(false);
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

    const handleReport = () => {
        if (!userId) {
            showError(
                "Alert",
                "Please login to report content."
            );
            return;
        }

        setMenuVisible(false);
        setReportModalOpen(true);
    };

    const submitReportIssue = async () => {
        try {
            if (!issueCategory || !issueDescription) {
                showError(
                    "Alert",
                    "Please select category and description."
                );
                return;
            }

            const formData = new FormData();
            formData.append("complaint_type", "Issue");
            formData.append("complaint_status", "Opened");
            formData.append("issue_type", issueCategory);
            // Combine user description with system context
            const fullMessage = `${issueDescription} (News ID: ${item.id || 'N/A'})`;
            formData.append("message_text", fullMessage);
            formData.append("user_id", userId);

            const getAttachmentFileName = () => {
                const now = new Date();
                return `report_news_${item.id || 'err'}_${now.getTime()}.jpg`;
            };

            if (attachment) {
                formData.append("attachment", {
                    uri: attachment.uri,
                    name: getAttachmentFileName(),
                    type: "image/jpeg",
                });
            }

            await axios.post(
                `${apiUrl}/api/grievance/issuesubmit`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setReportModalOpen(false);
            setSuccessIssueModalOpen(true);

            setIssueCategory("");
            setIssueDescription("");
            setAttachment(null);

        } catch (err) {
            console.log("❌ REPORT ERROR:", err?.response?.data || err.message);
            showError(
                "Alert",
                "Failed to submit issue: " + (err.response?.data?.message || err.message)
            );
        }
    };
    // --- REPORTING LOGIC END ---

    const handleMenuPress = () => {
        setMenuVisible(true);
    };
    // Menu position relative to card
    const menuLeft = iconLayout.x + iconLayout.w - 100; // 120 = menu width
    const menuTop = iconLayout.y + iconLayout.h + 300;    // small gap below icon

    return (
        <>

            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.9}
                onPress={onPress}
                onLayout={e => {
                    const { x, y } = e.nativeEvent.layout;
                    setCardLayout({ x, y });
                }}
            >
                <Image
                    source={{ uri: `${apiUrl}/uploads/newsimages/${item.image_url}` }}
                    style={styles.image}
                />

                <View style={styles.content}>
                    <Text style={styles.title} numberOfLines={1}>
                        {item.title}
                    </Text>

                    <Text style={styles.description} numberOfLines={3}>
                        {item.brief_description}
                    </Text>



                    <View style={styles.footer}>
                        <Text style={styles.time}>{formatPublishedTime(item.published_at)}</Text>

                        <TouchableOpacity
                            onPress={handleMenuPress}
                            style={styles.moreButton}
                            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                            onLayout={e => {
                                const { x, y, width, height } = e.nativeEvent.layout;
                                setIconLayout({ x, y, w: width, h: height });
                            }}
                        >
                            <MaterialIcons name="more-vert" size={24} color="#777" />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Context Menu Modal */}
            <Modal
                visible={menuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setMenuVisible(false)}
                >
                    <View
                        style={[
                            styles.menuContainer,
                            {
                                position: "absolute",
                                left: menuLeft,
                                top: menuTop,
                            },
                        ]}
                    >
                        {/* <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                setMenuVisible(false);
                            }}
                        >
                            <Text style={styles.menuText}>Pin</Text>
                        </TouchableOpacity> */}

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={handleReport}
                        >
                            <AlertCircle size={20} color="#333" />
                            <Text style={styles.menuText}>Report</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            {/* Report Modal - Matches StockCard */}
            <Modal
                visible={reportModalOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setReportModalOpen(false)}
            >
                <View style={styles.reportModalOverlay}>
                    <View style={styles.reportCard}>
                        <TouchableOpacity
                            style={styles.reportClose}
                            onPress={() => setReportModalOpen(false)}
                        >
                            <Text style={{ fontSize: 22 }}>✕</Text>
                        </TouchableOpacity>

                        <Text style={styles.reportTitle}>Report News</Text>
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
                                        "Inappropriate Content",
                                        "Other Issues",
                                    ].map((catItem, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setIssueCategory(catItem);
                                                setIssueDropdownOpen(false);
                                            }}
                                        >
                                            <Text style={styles.dropdownItemText}>{catItem}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        <Text style={styles.reportLabel}>Description</Text>
                        <View style={styles.textAreaBox}>
                            <TextInput
                                placeholder="Tell us what’s wrong..."
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
                                    <Text style={styles.attachText}>Attach Image</Text>
                                    {/* <Image source={Attach} style={styles.iconSmall2} /> */}
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
                                    <Text style={styles.attachRemove}>✕</Text>
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

            {/* Success Modal */}
            <Modal
                visible={successIssueModalOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setSuccessIssueModalOpen(false)}
            >
                <View style={styles.reportModalOverlay}>
                    <View style={styles.reportCard}>
                        <View style={{ alignItems: 'center', marginVertical: 20 }}>
                            <View style={{
                                width: 60, height: 60, borderRadius: 30, backgroundColor: '#E8F5E9',
                                justifyContent: 'center', alignItems: 'center', marginBottom: 15
                            }}>
                                <MaterialIcons name="check" size={40} color="#4CAF50" />
                            </View>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#210F47', marginBottom: 10 }}>
                                Report Submitted!
                            </Text>
                            <Text style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>
                                Thank you for letting us know. We will review your report shortly.
                            </Text>
                            <TouchableOpacity
                                style={[styles.reportSubmit, { width: '100%' }]}
                                onPress={() => setSuccessIssueModalOpen(false)}
                            >
                                <Text style={styles.reportSubmitText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#E5E7EB",
        borderRadius: 20,
        marginBottom: 20,
        elevation: 5,
        position: "relative",
        overflow: "visible",
    },
    image: {
        width: "100%",
        height: 180,
        borderRadius: 15,
    },
    content: {
        padding: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        color: "#000",
        marginBottom: 6,
        lineHeight: 18,
        width: 314,
        paddingTop: 5,
    },
    description: {
        fontSize: 12,
        color: "#666666",
        marginBottom: 12,
        lineHeight: 18,
        width: 314,
        marginTop: 12,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    time: {
        fontSize: 12,
        color: "#8a8a8a",
    },
    moreButton: {
        padding: 5,
        zIndex: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.15)",
    },
    menuContainer: {
        backgroundColor: "#fff",
        width: 120,
        borderRadius: 10,
        paddingVertical: 6,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        gap: 12,
    },
    menuText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },

    // --- REPORT MODAL STYLES (Copied from StockCard) ---
    reportModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    reportCard: {
        width: "85%",
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        elevation: 10,
    },
    reportClose: {
        position: "absolute",
        top: 15,
        right: 15,
        zIndex: 10,
    },
    reportTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#210F47",
        marginBottom: 5,
    },
    reportSubtitle: {
        fontSize: 13,
        color: "#666",
        marginBottom: 20,
    },
    reportLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginBottom: 8,
        marginTop: 10,
    },
    dropdownBox: {
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: "#F9F9FB",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    dropdownList: {
        position: "absolute",
        top: 50,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#EEE",
        borderRadius: 12,
        elevation: 5,
        paddingVertical: 5,
        zIndex: 50,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#F5F5F5",
    },
    dropdownItemText: {
        fontSize: 14,
        color: "#333",
    },
    textAreaBox: {
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 12,
        backgroundColor: "#F9F9FB",
        padding: 10,
        height: 120,
        justifyContent: "space-between",
    },
    textArea: {
        fontSize: 14,
        color: "#333",
        height: 80,
    },
    attachInside: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    attachText: {
        fontSize: 12,
        color: "#6C63FF",
        fontWeight: "600",
        marginRight: 5,
    },
    attachRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#F0EFFF",
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
    },
    attachLabel: {
        fontSize: 12,
        color: "#333",
    },
    attachRemove: {
        fontSize: 16,
        color: "#999",
        paddingHorizontal: 5,
    },
    reportBtnRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 25,
    },
    reportCancel: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: "#F5F5F5",
        marginRight: 10,
        alignItems: "center",
    },
    reportCancelText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
    },
    reportSubmit: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: "#210F47",
        marginLeft: 10,
        alignItems: "center",
    },
    reportSubmitText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#fff",
    },
});

export default NewsCardLarge;
