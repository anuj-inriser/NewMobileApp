import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TopOrderHeader = ({ title = "TATAMOTORS", onBack, onSettings }) => {
    return (
        <View style={styles.container}>
            {/* 🔙 Back Button */}
            <TouchableOpacity
                style={styles.iconButton}
                activeOpacity={0.7}
                onPress={onBack}
            >
                <Ionicons name="arrow-back" size={20} color={global.colors.background} />
            </TouchableOpacity>

            {/* 🏷️ Title */}
            <Text style={styles.title}>{title}</Text>

            {/* ⚙️ Settings Button */}
            <TouchableOpacity
                style={styles.iconButton}
                activeOpacity={0.7}
                onPress={onSettings}
            >
                <Ionicons name="settings-outline" size={20} color={global.colors.background} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: global.colors.surface, // light lavender background
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: "600",
        color: global.colors.secondary, // dark violet text
        textAlign: "center",
    },
    iconButton: {
        backgroundColor: global.colors.secondary, // dark purple circle
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
});

export default TopOrderHeader;