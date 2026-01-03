import React, { useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Pressable,
    Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { apiUrl } from "../../utils/apiUrl";
import { formatPublishedTime } from "../../utils/dateFormat"



const NewsCardLarge = ({ item, onPress }) => {

    console.log('item', item.news_content)
    const [menuVisible, setMenuVisible] = useState(false);
    const [cardLayout, setCardLayout] = useState({ x: 0, y: 0 });
    const [iconLayout, setIconLayout] = useState({ x: 0, y: 0, w: 0, h: 0 });

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
                            // onPress={handleMenuPress}
                            style={styles.moreButton}
                            onLayout={e => {
                                const { x, y, width, height } = e.nativeEvent.layout;
                                setIconLayout({ x, y, w: width, h: height });
                            }}
                        >
                            <MaterialIcons name="more-vert" size={20} color="#777" />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
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
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                setMenuVisible(false);
                            }}
                        >
                            <Text style={styles.menuText}>Pin</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                setMenuVisible(false);
                            }}
                        >
                            <Text style={styles.menuText}>Report</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
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
    moreButton: {},
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
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    menuText: {
        fontSize: 14,
        fontWeight: "500",
    },
});

export default NewsCardLarge;
