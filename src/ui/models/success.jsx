import React from 'react';
import { Modal, Text, View, TouchableOpacity, StyleSheet } from 'react-native';

const Success = ({ successIssueModalOpen, setSuccessIssueModalOpen, response }) => {
    // Default to success if status is missing or true
    const isSuccess = response?.status;

    console.log('ise success', isSuccess)

    return (
        <Modal
            visible={successIssueModalOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setSuccessIssueModalOpen(false)}
        >
            <View style={styles.successOverlay}>
                <View style={styles.successCard}>
                    <View style={isSuccess ? styles.successIcon : styles.errorIcon}>
                        <Text style={isSuccess ? styles.successTick : styles.errorTick}>{isSuccess ? "✓" : "✕"}</Text>
                    </View>
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
    successOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successCard: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    successIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    errorIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F44336', // Red color for error
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    errorTick: {
        color: 'white',
        fontSize: 30,
        fontWeight: 'bold',
    },
    successTick: {
        color: 'white',
        fontSize: 30,
        fontWeight: 'bold',
    },
    successTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    successText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    successBtn: {
        backgroundColor: '#210F47',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
    },
    errorBtn: {
        backgroundColor: '#D32F2F', // Darker red for button
    },
    successBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export { Success };
