import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Share } from "react-native";
import { Share2 } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopMenuSlider from "../components/TopMenuSlider";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
// import BottomTabBar from "../components/BottomTabBar";
// import FundamentalTopHeader from "../components/FundamentalTopHeader";
import { apiUrl } from "../utils/apiUrl";
import { formatPublishedDate } from "../utils/dateFormat"
import RenderHTML from "react-native-render-html";
import { useWindowDimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import DefaultNewsImage from "../../assets/Newspaper.jpg";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from "expo-device";
import axiosInstance from "../api/axios";

const NewsReadingScreen = ({ route }) => {
    const { width } = useWindowDimensions();
    const { item, newsList = [], currentIndex = 0 } = route.params;
    const navigate = useNavigation();

    const hasNext = newsList.length > 0 && currentIndex < newsList.length - 1;
    const hasPrev = newsList.length > 0 && currentIndex > 0;

    const handleNextNews = () => {
        if (hasNext) {
            const nextItem = newsList[currentIndex + 1];
            navigate.replace('NewsReadingScreen', {
                item: nextItem,
                newsList,
                currentIndex: currentIndex + 1,
            });
        }
    };

    const handlePrevNews = () => {
        if (hasPrev) {
            const prevItem = newsList[currentIndex - 1];
            navigate.replace('NewsReadingScreen', {
                item: prevItem,
                newsList,
                currentIndex: currentIndex - 1,
            });
        }
    };

    const titleWords = item.title?.trim().split(/\s+/).length || 0;
    const descriptionWords = item.brief_description?.trim().split(/\s+/).length || 0;
    const contentWords = item.news_content?.trim().split(/\s+/).length || 0;

    const normalizeNewsContent = (content = "") => {
        const cleaned = String(content)
            .replace(/&nbsp;/g, " ")
            .replace(/\u00a0/g, " ")
            .trim();

        if (!cleaned) return "";

        const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(cleaned);
        return hasHtmlTags ? cleaned : `<p>${cleaned}</p>`;
    };

    const totalWords = titleWords + descriptionWords + contentWords;

    const readTime = Math.ceil(totalWords / 100);

    useEffect(() => {
        const logNewsCardView = async () => {
            try {
                const userId = await AsyncStorage.getItem("userId");
                const deviceId =
                    Device.osBuildId || Device.modelId || Device.deviceName || "Unknown";

                await axiosInstance.post("/eventlog", {
                    user_id: userId || "",
                    success: true,
                    device_id: deviceId,
                    event_group_id: 4,
                    event_type: "News",
                    content: "Open",
                    content_id: item.news_id,
                    app_version: "1.0.0"
                });
            } catch (err) {
                console.log("Logging failed", err);
            }
        };

        logNewsCardView();
    }, []);

    const logNewsBack = async () => {
        try {
            const userId = await AsyncStorage.getItem("userId");
            const deviceId =
                Device.osBuildId || Device.modelId || Device.deviceName || "Unknown";

            await axiosInstance.post("/eventlog", {
                user_id: userId || "",
                success: true,
                device_id: deviceId,
                event_group_id: 4,
                event_type: "News",
                content: "Back",
                content_id: item.news_id,
                app_version: "1.0.0"
            });
        } catch (err) {
            console.log("Logging failed", err);
        }
    };

    const handleBack = async () => {
        await logNewsBack();
        if (navigate.canGoBack()) {
            navigate.goBack();
        }
    };

    const handleShare = async () => {
        try {

            // Prepare the caption
            const shareMessage = `${item.title}\n\n${item.link}`;

            const result = await Share.share({
                message: shareMessage,
            });

            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    // shared with activity type of result.activityType
                } else {
                    // shared
                }
            } else if (result.action === Share.dismissedAction) {
                // dismissed
            }
        } catch (error) {
            console.error('Share error:', error.message);
            showError(
                "Alert",
                'Unable to share', error.message
            );
        }
    };

    return (
        <>
            <SafeAreaView style={styles.container} edges={["bottom"]}>
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBack}
                    >
                        <Ionicons name="arrow-back" size={22} color={global.colors.secondary} />
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                        <Share2 size={17} color={global.colors.textSecondary} />

                    </TouchableOpacity>
                </View>
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
                            <Image
                                source={
                                    item.image_url
                                        ? { uri: `${apiUrl}/uploads/newsimages/${item.image_url}` }
                                        : DefaultNewsImage
                                }
                                style={styles.image}
                            />
                        </View>

                        {/* Metadata Row */}
                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                {/* <MaterialIcons name="dot-single" size={18} color="#777" /> */}
                                <Text style={{ fontSize: 32, color: global.colors.textSecondary }}>•</Text>
                                <Text style={styles.metaText}>By {item.publisher}</Text>
                            </View>

                            <View style={styles.metaItem}>
                                <Text style={{ fontSize: 32, color: global.colors.textSecondary }}>•</Text>
                                {/* <MaterialIcons name="event" size={18} color="#777" /> */}
                                {/* <Text style={styles.metaText}>{item.date}</Text> */}
                                <Text style={styles.metaText}>{formatPublishedDate(item.published_at)}</Text>
                            </View>

                            <View style={styles.metaItem}>
                                <Text style={{ fontSize: 32, color: global.colors.textSecondary }}>•</Text>
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
                            source={{ html: normalizeNewsContent(item.news_content) }}

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
                                    alignItems:'flex-start'
                                },
                            }}
                        />
                    )}

                    {/* Navigation Buttons */}
                    {(hasPrev || hasNext) && (
                        <View style={styles.navButtonRow}>
                            {hasPrev ? (
                                <TouchableOpacity style={styles.prevButton} onPress={handlePrevNews}>
                                    <Ionicons name="arrow-back" size={16} color={global.colors.secondary} />
                                    <Text style={styles.prevButtonText}>Previous</Text>
                                </TouchableOpacity>
                            ) : <View />}
                            {hasNext ? (
                                <TouchableOpacity style={styles.nextButton} onPress={handleNextNews}>
                                    <Text style={styles.nextButtonText}>Next</Text>
                                    <Ionicons name="arrow-forward" size={16} color={global.colors.secondary} />
                                </TouchableOpacity>
                            ) : <View />}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>

            {/* <BottomTabBar /> */}
        </>
    );
};

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 15,
        paddingVertical: 6,
    },
    container: {
        flex: 1,
        backgroundColor: global.colors.background,
    },
    scrollContent: {
        paddingVertical: 5,
        paddingHorizontal: 18,
        paddingBottom: 40,
    },

    summary: {
        backgroundColor: global.colors.surface,
        borderRadius: 10,
    },

    title: {
        fontSize: 18,
        fontWeight: "700",
        color: global.colors.textPrimary,
        lineHeight: 18,
        marginBottom: 5,
        paddingTop: 5,
        paddingBottom: 5,
    },

    abstract: {
        fontSize: 12,
        color: global.colors.textSecondary,
        marginBottom: 16,
        lineHeight: 18,
        marginTop:5,
        width: "100%",
        margin: 2
    },

    abstractLabel: {
        fontWeight: "700",
        color: global.colors.textSecondary,
    },

    imageCard: {
        borderRadius: 10,
        backgroundColor: global.colors.surface,
        overflow: "hidden",
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
        color: global.colors.textSecondary,
    },

    content: {
        fontSize: 12,
        color: global.colors.textPrimary,
        lineHeight: 18,
        // marginBottom: 40,
        width: 327,
        // height: 774,
        marginTop: 12,
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    backButtonText: {
        marginLeft: 6,
        fontSize: 13,
        color: {},
        fontWeight: "600",
    },
    actionButton: { flexDirection: 'row', justifyContent: "flex-end", alignItems: 'center', gap: 6, marginRight: 15 },
    navButtonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 20,
        marginBottom: 10,
        paddingHorizontal: 4,
    },
    prevButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 18,
        // borderRadius: 25,
        // borderWidth: 1.5,
        // borderColor: global.colors.secondary,
        gap: 6,
    },
    prevButtonText: {
        fontSize: 13,
        fontWeight: "600",
        color: global.colors.secondary,
    },
    nextButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 18,
        // borderRadius: 25,
        // backgroundColor: global.colors.secondary,
        gap: 6,
        elevation: 3,
        shadowColor: global.colors.secondary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    nextButtonText: {
        fontSize: 13,
        fontWeight: "600",
        color: global.colors.secondary,
    },
});


export default NewsReadingScreen;
