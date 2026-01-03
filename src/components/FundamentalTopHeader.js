import React, { useState } from "react";
import {
    View,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Modal,
    Text,
    Animated,
    Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const FundamentalTopHeader = () => {
    const [menuVisible, setMenuVisible] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));
    const navigation = useNavigation();

    const showMenu = () => {
        setMenuVisible(true);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const hideMenu = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150, // Shorter duration for closing
            useNativeDriver: true,
        }).start(() => {
            setMenuVisible(false);
        });
    };

    const handleLogout = () => {
        hideMenu();
        navigation.navigate('Login');
    };

    const menuOptions = [
        { label: 'Logout', action: handleLogout },
    ];
    return (
        <View style={styles.container}>
            {/* 📱 Status Bar color fix */}
            <StatusBar backgroundColor="#f2edf9" barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>


                {/* 🔍 Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={16} color="#888" style={styles.searchIcon} />
                    <TextInput
                        placeholder="Search"
                        placeholderTextColor="#888"
                        style={styles.searchInput}
                    />
                </View>

                {/* 🔔 Notification Button */}
                <TouchableOpacity style={styles.circleButton}>
                    <Ionicons name="notifications-outline" size={20} color="#fff" />
                    <View style={styles.badge} />
                </TouchableOpacity>

                {/* ☰ Menu Button */}
                {/* <TouchableOpacity style={styles.circleButton} onPress={showMenu}>
                    <Ionicons name="menu" size={20} color="#fff" />
                </TouchableOpacity> */}
            </View>
            {/* Dropdown Menu Modal */}
            <Modal
                visible={menuVisible}
                transparent={true}
                animationType="none"
                onRequestClose={hideMenu}
            >
                <View style={styles.modalOverlay}>
                    {/* Press outside to close */}
                    {/* <TouchableOpacity style={StyleSheet.absoluteFill} onPress={hideMenu} /> */}
                    <Pressable style={StyleSheet.absoluteFill} onPress={hideMenu} />

                    {/* <View style={StyleSheet.absoluteFill} onTouchStart={hideMenu} /> */}


                    {/* Dropdown Menu */}
                    <Animated.View style={[styles.menuContainer, { opacity: fadeAnim }]}>
                        {menuOptions.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.menuItem,
                                    index === menuOptions.length - 1 && styles.lastMenuItem
                                ]}
                                onPress={option.action}
                            >
                                <Text style={styles.menuItemText}>{option.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#f2edf9", // ✅ for both header and status bar background
    },
    header: {
        backgroundColor: "#f2edf9",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 10,
    },
    backButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#210F47",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 1,
        elevation: 1,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    searchContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 30,
        marginHorizontal: 10,
        paddingHorizontal: 10,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 1,
        elevation: 1,
        height: 35,
    },
    searchIcon: {
        marginRight: 6,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: "#333",
        paddingVertical: 0, // ✅ ensures vertical centering of placeholder text
    },
    circleButton: {
        backgroundColor: "#210F47", // ✅ deep purple
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 6,
        position: "relative",
    },
    badge: {
        position: "absolute",
        top: 6,
        right: 8,
        width: 8,
        height: 8,
        backgroundColor: "#D32F2F", // ✅ red notification dot
        borderRadius: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-start",
        alignItems: "flex-end",
        marginTop: 50, // Position below the header
    },
    menuContainer: {
        backgroundColor: "#fff",
        borderRadius: 8,
        minWidth: 150,
        marginTop: 10,
        marginRight: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    menuItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    lastMenuItem: {
        borderBottomWidth: 0, // Remove border from last item
    },
    menuItemText: {
        fontSize: 16,
        color: "#333",
        fontFamily: "Poppins-Medium",
    },
});

export default FundamentalTopHeader;