import React from "react";
import { TouchableOpacity, StyleSheet, View, Text, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { apiUrl } from "../../utils/apiUrl";
import { formatPublishedTime } from "../../utils/dateFormat";
import DefaultNewsImage from "../../../assets/Newspaper.jpg";

const NewsCardSmall = ({ item, onPress }) => {
    return (
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
                <MaterialIcons name="more-vert" size={20} color="#777" />
            </View>

        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#E5E7EB",
        borderRadius: 18,
        padding: 10,
        marginBottom: 16,
        elevation: 3,
        height: 100,
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
        color: "#1c1c1c",
        lineHeight: 18
    },
    time: {
        fontSize: 12,
        color: "#8a8a8a",
    }
});

export default NewsCardSmall;
