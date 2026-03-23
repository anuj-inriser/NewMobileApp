import React, { useState, useRef, useEffect } from "react";
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
import GrievanceModal from "../GrievanceModal";
import DefaultNewsImage from "../../../assets/Newspaper.jpg";

const NewsCardLarge = ({ item, onPress }) => {
    const { showSuccess, showError } = useAlert();
    const { userId } = useAuth(); // Get userId

    // console.log('item', item.news_content)
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const moreButtonRef = useRef(null);

    // --- REPORTING LOGIC START ---
    const [reportModalOpen, setReportModalOpen] = useState(false);
    // const [successIssueModalOpen, setSuccessIssueModalOpen] = useState(false);
    // const [issueCategory, setIssueCategory] = useState("");
    // const [issueDescription, setIssueDescription] = useState("");
    // const [issueDropdownOpen, setIssueDropdownOpen] = useState(false);
    // const [attachment, setAttachment] = useState(null);

    // const pickAttachment = async () => {
    //     const result = await ImagePicker.launchImageLibraryAsync({
    //         mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //         quality: 0.8,
    //     });
    //     if (!result.canceled) {
    //         setAttachment(result.assets[0]);
    //     }
    // };


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

    // const submitReportIssue = async () => {
    //     try {
    //         if (!issueCategory || !issueDescription) {
    //             showError(
    //                 "Alert",
    //                 "Please select category and description."
    //             );
    //             return;
    //         }

    //         const formData = new FormData();
    //         formData.append("complaint_type", "Issue");
    //         formData.append("complaint_status", "Opened");
    //         formData.append("issue_type", issueCategory);
    //         // Combine user description with system context
    //         const fullMessage = `${issueDescription} (News ID: ${item.id || 'N/A'})`;
    //         formData.append("message_text", fullMessage);
    //         formData.append("user_id", userId);

    //         const getAttachmentFileName = () => {
    //             const now = new Date();
    //             return `report_news_${item.id || 'err'}_${now.getTime()}.jpg`;
    //         };

    //         if (attachment) {
    //             formData.append("attachment", {
    //                 uri: attachment.uri,
    //                 name: getAttachmentFileName(),
    //                 type: "image/jpeg",
    //             });
    //         }

    //         await axios.post(
    //             `${apiUrl}/api/grievance/issuesubmit`,
    //             formData,
    //             {
    //                 headers: {
    //                     "Content-Type": "multipart/form-data",
    //                 },
    //             }
    //         );

    //         setReportModalOpen(false);
    //         setSuccessIssueModalOpen(true);

    //         setIssueCategory("");
    //         setIssueDescription("");
    //         setAttachment(null);

    //     } catch (err) {
    //         console.log("❌ REPORT ERROR:", err?.response?.data || err.message);
    //         showError(
    //             "Alert",
    //             "Failed to submit issue: " + (err.response?.data?.message || err.message)
    //         );
    //     }
    // };
    // --- REPORTING LOGIC END ---

    const handleMenuPress = () => {
        if (moreButtonRef.current) {
            moreButtonRef.current.measureInWindow((x, y, width, height) => {
                // Position menu slightly to the left (100 is menu width offset) and below the button
                setMenuPosition({ x: x + width - 110, y: y + height });
                setMenuVisible(true);
            });
        }
    };
    // Menu position relative to card
    // const menuLeft = iconLayout.x + iconLayout.w - 100; // 120 = menu width
    // const menuTop = iconLayout.y + iconLayout.h + 300;    // small gap below icon

    return (
        <>

            <TouchableOpacity
                ref={moreButtonRef}
                style={styles.card}
                activeOpacity={0.9}
                onPress={onPress}
            // onLayout={e => {
            //     const { x, y } = e.nativeEvent.layout;
            //     setCardLayout({ x, y });
            // }}
            >
                {/* <Image
                    source={{ uri: `${apiUrl}/uploads/newsimages/${item.image_url}` }}
                    style={styles.image}
                /> */}
                <Image
                    source={
                        item.image_url
                            ? { uri: `${apiUrl}/uploads/newsimages/${item.image_url}` }
                            : DefaultNewsImage
                    }
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
                        // onLayout={e => {
                        //     const { x, y, width, height } = e.nativeEvent.layout;
                        //     setIconLayout({ x, y, w: width, h: height });
                        // }}
                        >
                            <MaterialIcons name="more-vert" size={24} color={global.colors.textSecondary} />
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
                                left: menuPosition.x,
                                top: menuPosition.y,
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
                            <AlertCircle size={20} color={global.colors.textPrimary} />
                            <Text style={styles.menuText}>Report</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            <GrievanceModal
                visible={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                userId={userId}
                contentType="News"
                contentId={item.news_id}
            />

        </>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: global.colors.border,
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
        color: global.colors.textPrimary,
        marginBottom: 6,
        lineHeight: 18,
        width: 314,
        paddingTop: 5,
    },
    description: {
        fontSize: 12,
        color: global.colors.textSecondary,
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
        color: global.colors.textSecondary,
    },
    moreButton: {
        padding: 5,
        zIndex: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: global.colors.overlay,
    },
    menuContainer: {
        backgroundColor: global.colors.background,
        width: 120,
        borderRadius: 10,
        paddingVertical: 6,
        elevation: 10,
        shadowColor: global.colors.textPrimary,
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
        color: global.colors.textPrimary,
        fontWeight: '500',
    },

    // --- REPORT MODAL STYLES (Copied from StockCard) ---
    reportModalOverlay: {
        flex: 1,
        backgroundColor: global.colors.overlay,
        justifyContent: "center",
        alignItems: "center",
    },
    reportCard: {
        width: "85%",
        backgroundColor: global.colors.background,
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
        color: global.colors.secondary,
        marginBottom: 5,
    },
    reportSubtitle: {
        fontSize: 13,
        color: global.colors.textSecondary,
        marginBottom: 20,
    },
    reportLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: global.colors.textPrimary,
        marginBottom: 8,
        marginTop: 10,
    },
    dropdownBox: {
        borderWidth: 1,
        borderColor: global.colors.border,
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: global.colors.surface,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    dropdownList: {
        position: "absolute",
        top: 50,
        left: 0,
        right: 0,
        backgroundColor: global.colors.background,
        borderWidth: 1,
        borderColor: global.colors.border,
        borderRadius: 12,
        elevation: 5,
        paddingVertical: 5,
        zIndex: 50,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: global.colors.border,
    },
    dropdownItemText: {
        fontSize: 14,
        color: global.colors.textPrimary,
    },
    textAreaBox: {
        borderWidth: 1,
        borderColor: global.colors.border,
        borderRadius: 12,
        backgroundColor: global.colors.surface,
        padding: 10,
        height: 120,
        justifyContent: "space-between",
    },
    textArea: {
        fontSize: 14,
        color: global.colors.textPrimary,
        height: 80,
    },
    attachInside: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    attachText: {
        fontSize: 12,
        color: global.colors.secondary,
        fontWeight: "600",
        marginRight: 5,
    },
    attachRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: global.colors.surface,
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
    },
    attachLabel: {
        fontSize: 12,
        color: global.colors.textPrimary,
    },
    attachRemove: {
        fontSize: 16,
        color: global.colors.textSecondary,
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
        backgroundColor: global.colors.surface,
        marginRight: 10,
        alignItems: "center",
    },
    reportCancelText: {
        fontSize: 14,
        fontWeight: "600",
        color: global.colors.textSecondary,
    },
    reportSubmit: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: global.colors.secondary,
        marginLeft: 10,
        alignItems: "center",
    },
    reportSubmitText: {
        fontSize: 14,
        fontWeight: "600",
        color: global.colors.background,
    },
});
export default NewsCardLarge;