import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    ActivityIndicator,
    Alert,
    Animated
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { apiUrl } from "../utils/apiUrl";
import { useKeyboardAvoidingShift } from "../hooks/useKeyboardAvoidingShift";

const GrievanceModal = ({ 
    visible, 
    onClose, 
    userId, 
    contentType, 
    contentId 
}) => {
    const translateY = useKeyboardAvoidingShift()
    const [issueCategory, setIssueCategory] = useState("");
    const [issueDescription, setIssueDescription] = useState("");
    const [issueDropdownOpen, setIssueDropdownOpen] = useState(false);
    const [attachment, setAttachment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (visible) {
            setSuccess(false);
            setIssueCategory("");
            setIssueDescription("");
            setAttachment(null);
        }
    }, [visible]);

    const pickAttachment = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });
        if (!result.canceled) {
            setAttachment(result.assets[0]);
        }
    };

    const submitReportIssue = async () => {
        if (!userId) {
            Alert.alert("Error", "Please login to report content!");
            return;
        }
        if (!issueCategory || !issueDescription) {
            Alert.alert("Error", "Please select category and description");
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("complaint_type", "Issue");
            formData.append("complaint_status", "Opened");
            formData.append("issue_type", issueCategory);
            
            const fullMessage = `${issueDescription} (${contentType} ID: ${contentId || 'N/A'})`;
            formData.append("message_text", fullMessage);
            formData.append("user_id", userId);

            if (attachment) {
                const now = new Date();
                formData.append("attachment", {
                    uri: attachment.uri,
                    name: `report_${contentType.toLowerCase()}_${contentId || 'err'}_${now.getTime()}.jpg`,
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

            setSuccess(true);
        } catch (err) {
            console.log("❌ REPORT ERROR:", err?.response?.data || err.message);
            Alert.alert("Error", "Failed to submit issue: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Animated.View style={[styles.modalOverlay,
                {transform : [{translateY}]}
            ]}>
                <View style={styles.reportCard}>
                    {!success ? (
                        <>
                            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                <Text style={{ fontSize: 22, color: global.colors.textPrimary }}>✕</Text>
                            </TouchableOpacity>

                            <Text style={styles.title}>Report {contentType}</Text>
                            <Text style={styles.subtitle}>
                                Your report helps keep the platform accurate and safe.
                            </Text>

                            <View style={{ position: "relative", zIndex: 10 }}>
                                <Text style={styles.label}>Issue Categories</Text>
                                <TouchableOpacity
                                    style={styles.dropdownBox}
                                    onPress={() => setIssueDropdownOpen(!issueDropdownOpen)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={{ color: issueCategory ? global.colors.secondary : global.colors.textSecondary }}>
                                        {issueCategory || "Select your concern"}
                                    </Text>
                                    <View style={{ transform: [{ rotate: issueDropdownOpen ? '180deg' : '0deg' }] }}>
                                        <Text style={{ fontSize: 16, color: global.colors.textSecondary }}>▾</Text>
                                    </View>
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

                            <Text style={styles.label}>Description</Text>
                            <View style={styles.textAreaBox}>
                                <TextInput
                                    placeholder="Tell us what’s wrong..."
                                    value={issueDescription}
                                    onChangeText={setIssueDescription}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                    style={styles.textArea}
                                    placeholderTextColor={global.colors.textSecondary}
                                />

                                <View style={styles.attachInside}>
                                    <TouchableOpacity
                                        style={{ flexDirection: "row", alignItems: "center" }}
                                        onPress={pickAttachment}
                                    >
                                        <Text style={styles.attachText}>Attach Image</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            {attachment && (
                                <View style={styles.attachRow}>
                                    <Text style={styles.attachLabel}>Add Screenshot</Text>
                                    <TouchableOpacity onPress={() => setAttachment(null)}>
                                        <Text style={styles.attachRemove}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <View style={styles.btnRow}>
                                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.submitButton} 
                                    onPress={submitReportIssue}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color={global.colors.background} />
                                    ) : (
                                        <Text style={styles.submitText}>Submit Report</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <View style={{ alignItems: 'center', marginVertical: 20 }}>
                            <View style={styles.successIconOuter}>
                                <MaterialIcons name="check" size={40} color={global.colors.success} />
                            </View>
                            <Text style={styles.successTitle}>Report Submitted!</Text>
                            <Text style={styles.successSubtitle}>
                                Thank you for letting us know. We will review your report shortly.
                            </Text>
                            <TouchableOpacity
                                style={[styles.submitButton2, { width: '100%', marginLeft: 0 }]}
                                onPress={onClose}
                            >
                                <Text style={styles.submitText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
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
    closeButton: {
        position: "absolute",
        top: 15,
        right: 15,
        zIndex: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: global.colors.secondary,
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 13,
        color: global.colors.textSecondary,
        marginBottom: 20,
    },
    label: {
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
    btnRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 25,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: global.colors.surface,
        marginRight: 10,
        alignItems: "center",
    },
    cancelText: {
        fontSize: 14,
        fontWeight: "600",
        color: global.colors.textSecondary,
    },
    submitButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: global.colors.secondary,
        marginLeft: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    submitButton2: {
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: global.colors.secondary,
        marginLeft: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    submitText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#fff",
    },
    successIconOuter: {
        width: 60, 
        height: 60, 
        borderRadius: 30, 
        backgroundColor: global.colors.surface,
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 15
    },
    successTitle: {
        fontSize: 20, 
        fontWeight: 'bold', 
        color: global.colors.secondary, 
        marginBottom: 10
    },
    successSubtitle: {
        textAlign: 'center', 
        color: global.colors.textSecondary, 
        marginBottom: 20
    }
});

export default GrievanceModal;
