import React from 'react';
import { Modal, Text, View, TouchableOpacity, StyleSheet, Image } from 'react-native';

const Success = ({ successIssueModalOpen, setSuccessIssueModalOpen, response }) => {
    // Default to success if status is missing or true
    const isSuccess = response?.status;
    const icon =
        isSuccess
            ? require("../../../assets/confirmalert.png")
            : require("../../../assets/redalert.png");

    return (
        <Modal
            visible={successIssueModalOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setSuccessIssueModalOpen(false)}
        >
            <View style={styles.successOverlay}>
                <View style={styles.successCard}>
                    {/* <View style={isSuccess ? styles.successIcon : styles.errorIcon}>
                        <Text style={isSuccess ? styles.successTick : styles.errorTick}>{isSuccess ? "✓" : "✕"}</Text>
                    </View> */}
                    <Image source={icon} style={styles.icon} />
                    <Text style={styles.successTitle}>
                        {response?.title || (isSuccess ? "Success" : "Error")}
                    </Text>
                    <Text style={styles.successText}>
                        {response?.message || (isSuccess ? "Action completed successfully." : "Something went wrong.")}
                    </Text>
                    <TouchableOpacity
                        style={[styles.successBtn, !isSuccess && styles.errorBtn]}
                        onPress={() => setSuccessIssueModalOpen(false)}
                    >
                        <Text style={styles.successBtnText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    icon: {
        width: 70,
        height: 70,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    successOverlay: {
        flex: 1,
        backgroundColor: global.colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successCard: {
        width: '80%',
        backgroundColor: global.colors.background,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        elevation: 5,
        shadowColor: global.colors.textSecondary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    successIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: global.colors.success,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    errorIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: global.colors.error,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    errorTick: {
        color: global.colors.error,
        fontSize: 30,
        fontWeight: 'bold',
    },
    successTick: {
        color: global.colors.background,
        fontSize: 30,
        fontWeight: 'bold',
    },
    successTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: global.colors.textPrimary,
        marginBottom: 10,
        textAlign: 'center',
    },
    successText: {
        fontSize: 16,
        color: global.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    successBtn: {
        backgroundColor: global.colors.secondary,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
    },
    errorBtn: {
        backgroundColor: global.colors.error,
    },
    successBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export { Success };