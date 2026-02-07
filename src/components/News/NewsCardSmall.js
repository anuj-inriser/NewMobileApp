import React, { useState, useRef } from "react";
import {
    TouchableOpacity, StyleSheet, View, Text, Image, Modal,
    Pressable
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { AlertCircle } from 'lucide-react-native';
import { apiUrl } from "../../utils/apiUrl";
import { formatPublishedTime } from "../../utils/dateFormat";
import { useAuth } from "../../context/AuthContext";
import GrievanceModal from "../GrievanceModal";
import DefaultNewsImage from "../../../assets/Newspaper.jpg";

const NewsCardSmall = ({ item, onPress }) => {
    const { userId } = useAuth();
    const [menuVisible, setMenuVisible] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const moreButtonRef = useRef(null);

    const handleMenuPress = () => {
        if (moreButtonRef.current) {
            moreButtonRef.current.measureInWindow((x, y, width, height) => {
                // Position menu slightly to the left (100 is menu width offset) and below the button
                setMenuPosition({ x: x + width - 110, y: y + height });
                setMenuVisible(true);
            });
        }
    };

    const handleReport = () => {
        if (!userId) {
            alert('Please login to report content!');
            return;
        }
        setMenuVisible(false);
        setReportModalOpen(true);
    };
    return (
        <>
            <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>

                <View style={styles.top}>
                    {/* <Image source={{ uri: `${apiUrl}/uploads/newsimages/${item.image_url}` }} style={styles.image} /> */}
                    <Image
                        source={
                            item.image_url
                                ? { uri: `${apiUrl}/uploads/newsimages/${item.image_url}` }
                                : DefaultNewsImage
                        }
                        style={styles.image}
                    />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title} numberOfLines={3}>
                            {item.title}
                        </Text>
                    </View>
                </View>

                <View style={styles.bottom}>
                    {/* <Text style={styles.time}>{item.time}</Text> */}
                    <Text style={styles.time}>{formatPublishedTime(item.published_at)}</Text>
                    <TouchableOpacity
                        ref={moreButtonRef}
                        onPress={handleMenuPress}
                        style={styles.moreButton}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    >
                        <MaterialIcons name="more-vert" size={20} color={global.colors.textSecondary} />
                    </TouchableOpacity>
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

            {/* Report Modal */}
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
        borderRadius: 18,
        padding: 10,
        marginBottom: 16,
        elevation: 3,
        height: 110,
        width: '100%'
    },
    top: {
        flexDirection: "row",
        marginBottom: 3,
    },
    image: {
        width: 90,
        height: 62,
        borderRadius: 12,
        marginRight: 12
    },
    bottom: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        color: global.colors.textPrimary,
        lineHeight: 18
    },
    time: {
        fontSize: 12,
        color: global.colors.textSecondary,
        marginTop:7
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
    }
});

export default NewsCardSmall;
