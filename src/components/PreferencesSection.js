import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Animated } from 'react-native';
import axios from 'axios';
import * as Device from "expo-device";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from "../api/axios";
import { apiUrl } from '../utils/apiUrl';
import { Success } from '../ui/models/success';

const CustomSwitch = ({ value, onValueChange }) => {
    const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: value ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [value]);

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 22], // adjust based on width - thumb width - padding
    });

    const backgroundColor = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [global.colors.primary, global.colors.secondary],
    });

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onValueChange(!value)}
        >
            <Animated.View style={[styles.switchContainer, { backgroundColor }]}>
                <Animated.View style={[styles.switchThumb, { transform: [{ translateX }] }]} />
            </Animated.View>
        </TouchableOpacity>
    );
};

const PreferencesSection = () => {
    const [preferences, setPreferences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [successIssueModalOpen, setSuccessIssueModalOpen] = useState(false);
    const originalPreferencesRef = useRef([]);
    const [ModalResponse, setModalResponse] = useState({
        title: '',
        message: '',
        status: false
    })


    const fetchPreferences = async () => {
        try {
            const userId = await AsyncStorage.getItem("userId");
            if (!userId) {
                setLoading(false);
                return;
            }

            const res = await axios.get(`${apiUrl}/api/preferenceOnApp/user/${userId}`);

            if (res.data && res.data.data) {
                const mappedData = res.data.data.map(item => ({
                    id: item.preferenceid,
                    title: item.preferencename,
                    subtitle: item.preferencedescription || 'Stay updated with your preferences.',
                    isEnabled: item.status,
                }));
                if (mappedData.length > 0) {
                    setPreferences(mappedData);
                    originalPreferencesRef.current = mappedData;
                }
            }
        } catch (error) {
            console.log("Error fetching preferences:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPreferences();
    }, []);

    const toggleSwitch = (id) => {
        setPreferences(previousState =>
            previousState.map(pref =>
                pref.id === id ? { ...pref, isEnabled: !pref.isEnabled } : pref
            )
        );
    };

    const handleSave = async () => {
        let prefMeta = {
            success: false,
            message: "",
            userid: ""
        };

        try {
            const userId = await AsyncStorage.getItem("userId");
            if (!userId) return;
            prefMeta.userid = userId;

            const originalById = new Map(
                (originalPreferencesRef.current || []).map(p => [p.id, p])
            );
            const changedItems = preferences
                .filter(p => {
                    const original = originalById.get(p.id);
                    return !original || original.isEnabled !== p.isEnabled;
                })
                .map(p => `${p.title} ${p.isEnabled ? "enabled" : "disabled"}`);
            const changeMessage =
                changedItems.length > 0
                    ? `${changedItems.join(", ")}`
                    : "No changes";

            const payload = {
                userId: userId,
                preferences: preferences.map(p => ({
                    preferenceId: p.id,
                    status: p.isEnabled ? true : false
                }))
            };

            const res = await axios.post(`${apiUrl}/api/preferenceOnApp/save`, payload);
            if (res.data.success) {
                setModalResponse({
                    status: true,
                    title: 'Preference Saved',
                    message: 'Your preferences have been saved successfully.'
                })
                setSuccessIssueModalOpen(true);
                prefMeta.success = true;
                prefMeta.message = changeMessage;
                originalPreferencesRef.current = preferences;
            } else {
                setModalResponse({
                    status: false,
                    title: 'Preference Save Failed',
                    message: 'Failed to save preferences'
                })
                setSuccessIssueModalOpen(true);
                prefMeta.message = res?.data?.message || "Failed to save preferences";
            }
        } catch (error) {
            console.log("Error saving preferences:", error);
            setModalResponse({
                status: false,
                title: "Error",
                message: "Something went wrong"
            })
            setSuccessIssueModalOpen(true);
            prefMeta.message =
                error?.response?.data?.message || "Failed to save preferences";
        } finally {
            try {
                const deviceId =
                    Device.osBuildId || Device.modelId || Device.deviceName || "Unknown";

                await axiosInstance.post("/eventlog", {
                    user_id: prefMeta.userid,
                    success: prefMeta.success,
                    device_id: deviceId,
                    event_group_id: 1,
                    event_type: "Preferences Save",
                    content: prefMeta.message,
                    app_version: "1.0.0"
                });
            } catch (err) {
                console.log("Logging failed", err);
            }
        }
    };

    if (loading) {
        return <ActivityIndicator size="small" color={global.colors.secondary} style={{ marginTop: 20 }} />;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>Preferences</Text>
            <Text style={styles.headerSubtitle}>
                Choose what you’re most interested in. We’ll personalize your stock insights & recommendations accordingly.
            </Text>


            {preferences.length === 0 && (
                <Text style={{ textAlign: 'center', marginVertical: 20, color: 'red' }}>
                    No preferences found. Check logs.
                </Text>
            )}

            {preferences.map((pref) => (
                <View key={pref.id} style={styles.row}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.iconText}>{pref.title.charAt(0)}</Text>
                    </View>
                    <View style={styles.textContainer}>
                        <View style={styles.titleRow}>
                            <Text style={styles.title}>{pref.title}</Text>
                            <CustomSwitch
                                value={pref.isEnabled}
                                onValueChange={() => toggleSwitch(pref.id)}
                            />
                        </View>
                        <Text style={styles.subtitle}>{pref.subtitle}</Text>
                        <View style={styles.divider} />
                    </View>
                </View>
            ))}

            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>Save Preferences</Text>
                </TouchableOpacity>
            </View>

            <Success
                response={ModalResponse}
                successIssueModalOpen={successIssueModalOpen}
                setSuccessIssueModalOpen={setSuccessIssueModalOpen}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 10,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: global.colors.textPrimary,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 14,
        color: global.colors.textSecondary,
        lineHeight: 20,
        marginBottom: 24,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: global.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 4,
    },
    iconText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: global.colors.textPrimary,
    },
    textContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: global.colors.textPrimary,
    },
    subtitle: {
        fontSize: 12,
        color: global.colors.textSecondary,
        lineHeight: 16,
        paddingRight: 10,
    },
    divider: {
        height: 1.2,
        backgroundColor: global.colors.border,
        marginTop: 12,
        width: '100%',
    },
    buttonRow: {
        marginTop: 10,
        alignItems: 'center',
    },
    saveBtn: {
        backgroundColor: global.colors.secondary,
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 20,
    },
    saveBtnText: {
        color: global.colors.background,
        fontWeight: "700",
        fontSize: 14,
    },
    switchContainer: {
        width: 45,
        height: 22,
        borderRadius: 15,
        justifyContent: 'center',
    },
    switchThumb: {
        width: 20,
        height: 18,
        borderRadius: 13,
        backgroundColor: global.colors.background,
        shadowColor: global.colors.textPrimary,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2.5,
        elevation: 1.5,
    }
});

export default PreferencesSection;
