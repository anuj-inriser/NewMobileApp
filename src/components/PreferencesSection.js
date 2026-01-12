import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Animated } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
        outputRange: ['#E6E0E9', '#210F47'],
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
    const [ModalResponse, setModalResponse] = useState({
        title: '',
        message: '',
        status: false
    })

    console.log("preferences", preferences);


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
        try {
            const userId = await AsyncStorage.getItem("userId");
            if (!userId) return;

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
            } else {
                setModalResponse({
                    status: false,
                    title: 'Preference Save Failed',
                    message: 'Failed to save preferences'
                })
                setSuccessIssueModalOpen(true);
            }
        } catch (error) {
            console.log("Error saving preferences:", error);
            setModalResponse({
                status: false,
                title: "Error",
                message: "Something went wrong"
            })
            setSuccessIssueModalOpen(true);
        }
    };

    if (loading) {
        return <ActivityIndicator size="small" color="#210F47" style={{ marginTop: 20 }} />;
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
        color: '#1a1a1a',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
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
        backgroundColor: '#E6E0E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 4,
    },
    iconText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
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
        color: '#1a1a1a',
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
        lineHeight: 16,
        paddingRight: 10,
    },
    divider: {
        height: 1.2,
        backgroundColor: '#F0DADADA',
        marginTop: 12,
        width: '100%',
    },
    buttonRow: {
        marginTop: 10,
        alignItems: 'center',
    },
    saveBtn: {
        backgroundColor: "#210F47",
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 20,
    },
    saveBtnText: {
        color: "#fff",
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
        backgroundColor: '#fff',
        shadowColor: "#000",
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