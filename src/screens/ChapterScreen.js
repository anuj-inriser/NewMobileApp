import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ImageBackground,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import FundamentalTopHeader from '../components/FundamentalTopHeader';
import { SafeAreaView } from "react-native-safe-area-context";
// import TopMenuSlider from '../components/TopMenuSlider';
// import TopFundamentalSlider from '../components/TopFundamentalSlider';
// import BottomTabBar from '../components/BottomTabBar';
import { LinearGradient } from 'expo-linear-gradient';
import axiosInstance from '../api/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function ChapterScreen({ route, navigation }) {

    const { moduleId, categoryId } = route.params;
    const [progress, setProgress] = useState(0);

    const [moduleData, setModuleData] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);


    useEffect(() => {
        if (!moduleId) return;

        const load = async () => {
            try {
                const res = await axiosInstance.get(`/learningmodules/${moduleId}`);
                setModuleData(res.data.data);

                // fetch progress
                const userId = await AsyncStorage.getItem("userId");
                if (userId) {
                    const p = await axiosInstance.get(`/learningprogress/module/${userId}/${moduleId}`);
                    const percentage = p.data.data?.progress ?? 0;
                    setProgress(percentage / 100);
                }
            } catch (err) {
                console.log("Error fetching module or progress:", err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [moduleId]);


    // fetch chapters when moduleId changes
    useEffect(() => {
        if (!moduleId) return;

        axiosInstance.get(`/chaptermaster/module/${moduleId}`)
            .then((response) => {
                const data = response.data.data ?? [];
                setChapters(data);
            })
            .catch((err) => {
                console.log('Error fetching chapters:', err);
            });
    }, [moduleId]);

    const getChunk = () => {
        const n = chapters.length || 0;
        const chunk = 100 / (n + 1);
        return Number(chunk.toFixed(2));
    };

    useEffect(() => {
        axiosInstance.get('/learningcategory')
            .then((response) => {
                const data = response.data.data ?? [];
                setCategories(data);

                if (data.length > 0) {
                    const found = data.find(cat => cat.id == categoryId);
                    setSelectedCategory(found || data[0]);
                }
            })
            .catch((err) => {
                console.log('Error fetching categories:', err);
            });
    }, []);

    // called when user taps a chapter tile
    const handleChapterPress = async (chapter) => {
        try {
            const userId = await AsyncStorage.getItem("userId");
            if (!userId) {
                // redirect to login or show message
                navigation.navigate("Login");
                return;
            }

            const chunk = getChunk();

            // Update DB for this chapter (idempotent)
            await axiosInstance.post("/learningprogress/update", {
                userid: Number(userId),
                moduleid: moduleId,
                chapterid: chapter.chapterid,
                progress: chunk
            });

            // refresh total progress
            const p = await axiosInstance.get(`/learningprogress/module/${userId}/${moduleId}`);
            const percentage = p.data.data?.progress ?? 0;
            setProgress(percentage / 100);

            // Now you can navigate to chapter details or open content
            navigation.navigate('ChapterDetails', { chapter: chapter.chapterid });

        } catch (err) {
            console.log("Error updating chapter progress:", err);
        }
    };


    return (
        <>
            <SafeAreaView edges={["bottom"]} style={styles.container}>
                {/* <FundamentalTopHeader /> */}
                <View>

                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <MaterialIcons name="arrow-back" size={24} color={global.colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{moduleData?.module_name || "Course Details"}</Text>
                    </View>
                </View>
                <ScrollView
                    // contentContainerStyle={{ paddingBottom: 10 }}
                    showsVerticalScrollIndicator={false}
                >

                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>{moduleData?.module_name}</Text>
                        <View style={styles.topCardWrapper}>
                            <ImageBackground
                                // source={bgImage}
                                source={require('../../assets/learning_image.jpg')}
                                style={styles.mainCard}
                                imageStyle={{ borderRadius: 15 }}
                            >
                                <View style={styles.progressBarBackground}>
                                    <View style={[
                                        styles.progressBarFill,
                                        { width: `${Math.round(progress * 100)}%` }
                                    ]} />
                                    <Text style={styles.progressText}>{`${Math.round(progress * 100)}%`}</Text>
                                </View>
                                <View style={styles.overlay}>
                                    <Text style={styles.headline}>{moduleData?.module_brief}</Text>
                                </View>
                            </ImageBackground>
                        </View>

                        <View style={styles.chapterList}>
                            {chapters.map((chapter, idx) => (
                                <TouchableOpacity
                                    style={styles.chapterCard}
                                    key={idx}
                                    activeOpacity={0.85}
                                    onPress={() => handleChapterPress(chapter)}
                                >
                                    <View style={styles.chapterNumberCircle}>
                                        <Text style={styles.chapterNumberText}>{idx + 1}</Text>
                                    </View>
                                    <Text style={styles.chapterTitle} numberOfLines={2}
                                        ellipsizeMode="tail">{chapter.chapter_name}</Text>
                                </TouchableOpacity>

                            ))}
                        </View>

                    </View>
                </ScrollView>
            </SafeAreaView>
            {/* <BottomTabBar /> */}
        </>
    );
}

const { width } = Dimensions.get('window');
const cardWidth = width * 0.42;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: global.colors.background,
    },
    // topSliders: {
    //     backgroundColor: global.colors.background,
    //     // elevation: 10,
    //     // shadowColor: "#000",
    //     // shadowOffset: { width: 0, height: 2 },
    //     // shadowOpacity: 0.2,
    //     // shadowRadius: 3,
    //     // marginTop: -3,
    //     // paddingTop: 3
    // },
    sectionContainer: {
        // paddingTop: 10,
        paddingHorizontal: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: global.colors.textPrimary,
        marginTop: 15,
        marginBottom: 12,
        marginLeft: 4,
    },
    topCardWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
        marginHorizontal: 6,
    },
    topCard: {
        width: '100%',
        minHeight: 110,
        borderRadius: 14,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    mainCard: {
        height: 120,
        borderRadius: 15,
        overflow: 'hidden',
        marginBottom: 12,
        marginHorizontal: 'auto',
        justifyContent: 'flex-end',
        width: '100%'

    },
    progressRow: {
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 2,
    },
    progressBarBackground: {
        position: 'absolute',
        top: 12,
        left: 10,
        right: 10,
        height: 7,
        borderRadius: 5,
        backgroundColor: global.colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headline: {
        color: global.colors.background,
        fontSize: 16,
        fontWeight: '500',
    },
    progressBarFill: {
        backgroundColor: global.colors.success,
        height: 7,
        borderRadius: 5,
    },
    progressText: {
        position: 'absolute',
        right: 0.00001,
        backgroundColor: global.colors.success,
        width: 23,
        height: 23,
        borderRadius: 14,
        color: global.colors.background,
        fontWeight: '500',
        fontSize: 10,
        textAlign: 'center',
        lineHeight: 22,
        overflow: 'hidden'
    },
    overlay: {
        // backgroundColor: global.colors.overlay,
        padding: 13,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
    },
    topCardText: {
        color: global.colors.background,
        fontSize: 15,
        fontWeight: '500',
    },
    chapterList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        width: '100%',
    },
    chapterCard: {
        backgroundColor: global.colors.surface,
        borderRadius: 13,
        width: cardWidth,
        minHeight: 80,
        marginBottom: 10,
        marginLeft: 10,
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 15,
        shadowColor: global.colors.textPrimary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3,
    },
    chapterNumberCircle: {
        width: 24,
        height: 24,
        borderRadius: 19,
        backgroundColor: global.colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 13,
        marginBottom: 7,
    },
    chapterNumberText: {
        color: global.colors.background,
        fontSize: 12,
        fontWeight: '800',
        textAlign: 'center',
    },
    chapterTitle: {
        color: global.colors.textPrimary,
        fontWeight: '500',
        fontSize: 13,
        letterSpacing: 0.7,
        flexShrink: 1,
        width: 110,
        height: 36,
    },
    certificateCard: {
        backgroundColor: global.colors.surface,
        borderRadius: 13,
        width: '100%',
        minHeight: 80,
        marginBottom: 15,
        marginRight: 13,
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 15,
        shadowColor: global.colors.textPrimary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3,
    },
    certificateNumberCircle: {
        width: 40,
        height: 40,
        borderRadius: 19,
        backgroundColor: global.colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 13,
    },
    certificateTitle: {
        color: global.colors.textPrimary,
        fontWeight: '700',
        fontSize: 15,
        letterSpacing: 0.7,
        flexShrink: 1,
        width: 130,
        height: 36,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 5,
        backgroundColor: global.colors.background,
    },
    backButton: {
        marginRight: 15,
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: global.colors.textPrimary,
    },
});