import React from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopMenuSlider from "../components/TopMenuSlider";
import { MaterialIcons } from "@expo/vector-icons";
// import BottomTabBar from "../components/BottomTabBar";
// import FundamentalTopHeader from "../components/FundamentalTopHeader";
import { apiUrl } from "../utils/apiUrl";
import { formatPublishedDate } from "../utils/dateFormat"
import RenderHTML from "react-native-render-html";
import { useWindowDimensions } from "react-native";

const NewsReadingScreen = ({ route }) => {
    const { width } = useWindowDimensions();
    const { item } = route.params;

    const titleWords = item.title?.trim().split(/\s+/).length || 0;
    const descriptionWords = item.brief_description?.trim().split(/\s+/).length || 0;
    const contentWords = item.news_content?.trim().split(/\s+/).length || 0;

    const totalWords = titleWords + descriptionWords + contentWords;

    const readTime = Math.ceil(totalWords / 100);

    return (
        <>
            <SafeAreaView style={styles.container} edges={["bottom"]}>
                {/* <FundamentalTopHeader /> */}
                {/* <TopMenuSlider /> */}

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Title */}
                    <Text style={styles.title}>{item.title}</Text>

                    <View style={styles.summary}>
                        {/* Abstract */}
                        <Text style={styles.abstract}>
                            <Text style={styles.abstractLabel}>Abstracts: </Text>
                            {item.brief_description}
                        </Text>



                        {/* Image Container */}
                        <View style={styles.imageCard}>
                            <Image source={{ uri: `${apiUrl}/uploads/newsimages/${item.image_url}` }} style={styles.image} />
                        </View>

                        {/* Metadata Row */}
                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                {/* <MaterialIcons name="dot-single" size={18} color="#777" /> */}
                                <Text style={{ fontSize: 32, color: '#686868ff' }}>•</Text>
                                <Text style={styles.metaText}>By {item.publisher}</Text>
                            </View>

                            <View style={styles.metaItem}>
                                <Text style={{ fontSize: 32, color: '#686868ff' }}>•</Text>
                                {/* <MaterialIcons name="event" size={18} color="#777" /> */}
                                {/* <Text style={styles.metaText}>{item.date}</Text> */}
                                <Text style={styles.metaText}>{formatPublishedDate(item.published_at)}</Text>
                            </View>

                            <View style={styles.metaItem}>
                                <Text style={{ fontSize: 32, color: '#686868ff' }}>•</Text>
                                {/* <MaterialIcons name="schedule" size={18} color="#777" /> */}
                                {/* <Text style={styles.metaText}>{item.readTime}</Text> */}
                                <Text style={styles.metaText}>{readTime}min Read</Text>
                            </View>

                        </View>
                    </View>

                    {/* Actual Content */}
                    {item.news_content && (
                        <RenderHTML
                            contentWidth={width}
                            source={{ html: item.news_content }}

                            baseStyle={{
                                paddingHorizontal: 6
                            }}

                            tagsStyles={{
                                h1: {
                                    fontSize: 15,
                                    fontWeight: "700",
                                    marginBottom: 10,
                                },
                                h2: {
                                    fontSize: 12,
                                    fontWeight: "600",
                                    marginTop: 12,
                                    marginBottom: 8,
                                },
                                p: {
                                    marginBottom: 12,
                                },
                            }}
                        />
                    )}

                    {/* <Text style={styles.content}>{item.news_content}</Text> */}
                </ScrollView>
            </SafeAreaView>

            {/* <BottomTabBar /> */}
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    scrollContent: {
        padding: 18,
        paddingBottom: 40,
    },

    summary: {
        backgroundColor: "#E6E0E9",
        borderRadius: 10,
    },

    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111",
        lineHeight: 18,
        marginBottom: 5,
        paddingTop: 5,
        paddingBottom: 5,
    },

    abstract: {
        fontSize: 12,
        color: "#333333",
        marginBottom: 16,
        lineHeight: 18,
        width: 316,
        margin: 5
    },

    abstractLabel: {
        fontWeight: "700",
        color: "#333333",
    },

    imageCard: {
        borderRadius: 10,
        backgroundColor: "#eee",
        overflow: "hidden",
        // marginBottom: 12,
        elevation: 3,
    },

    image: {
        width: "100%",
        height: 210,
    },

    metaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        // backgroundColor: "#f2f2f2",
        // padding: 12,
        paddingHorizontal: 12,
        borderRadius: 16,
        // marginBottom: 10,
    },

    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },

    metaText: {
        fontSize: 10,
        lineHeight: 14,
        color: "#666666",
    },

    content: {
        fontSize: 12,
        color: "#333333",
        lineHeight: 18,
        // marginBottom: 40,
        width: 327,
        // height: 774,
        marginTop: 12,
    },
});


export default NewsReadingScreen;
