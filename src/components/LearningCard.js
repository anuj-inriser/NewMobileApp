import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ImageBackground,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image
} from 'react-native';
import RightArrow from "../../assets/RightArrow.jpg"
import { MaterialIcons } from '@expo/vector-icons';
import axiosInstance from '../api/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from "@react-navigation/native";


// Mini card reusable component
const MiniCard = ({ number, title, onPress }) => (
    <View style={styles.miniCard} onPress={onPress}>
        <View style={styles.miniCardCircle}>
            <Text style={styles.miniCardNumber}>{number}</Text>
        </View>
        <Text
            style={styles.miniCardTitle}
            numberOfLines={2}
            ellipsizeMode="tail">{title}</Text>
    </View>
);

const LearningCard = ({
    id,
    title,
    bgImage,
    headline = "Understand how the stock market works, its participants, and why prices move.",
    onMiniCardPress = () => { },
    onArrowPress = () => { },
    initialProgress = 0,
}) => {

    const isFocused = useIsFocused();
    const [chapters, setChapters] = useState([]);
    const [progress, setProgress] = useState(initialProgress);

    useEffect(() => {
        if (isFocused) {
            let mounted = true;
            const load = async () => {
                if (!id) return;
                try {
                    const chRes = await axiosInstance.get(`/chaptermaster/module/${id}`);
                    const chData = chRes.data.data ?? [];
                    if (mounted) setChapters(chData);

                    const userId = await AsyncStorage.getItem("userId");
                    if (!userId) {
                        setProgress(initialProgress);
                        return;
                    }

                    const res = await axiosInstance.get(`/learningprogress/module/${userId}/${id}`);
                    const percentage = res.data.data?.progress ?? 0;
                    if (mounted) setProgress(percentage / 100);
                } catch (err) {
                    console.log("LearningCard load error:", err);
                }
            };
            load();
            return () => { mounted = false };
        }
    }, [id, isFocused]);


    const getChunk = () => {
        const n = chapters.length || 0;
        const chunk = 100 / (n + 1);
        return Number(chunk.toFixed(2));
    };

    // when user clicks arrow: update module-level progress (chapterid = null)
    const handleArrowPress = async () => {
        try {
            const userId = await AsyncStorage.getItem("userId");
            if (!userId) {
                // optionally redirect to login
                onArrowPress();
                return;
            }

            const chunk = getChunk();

            // Call backend to insert progress row (idempotent if already present)
            await axiosInstance.post("/learningprogress/update", {
                userid: Number(userId),
                moduleid: id,
                chapterid: null,
                progress: chunk
            });

            // refresh progress
            const res = await axiosInstance.get(`/learningprogress/module/${userId}/${id}`);
            const percentage = res.data.data?.progress ?? 0;
            setProgress(percentage / 100);
        } catch (err) {
            console.log("Error updating module progress:", err);
        } finally {
            // navigate afterwards (or do inside onArrowPress)
            onArrowPress();
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <TouchableOpacity onPress={handleArrowPress}>
                    <View style={{
                        width: 35,
                        height: 35,
                        borderRadius: 20,
                        backgroundColor: global.colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                        right: 15
                    }}
                    >
                        <MaterialIcons name="arrow-forward" size={20} color={global.colors.textPrimary} />
                    </View>
                </TouchableOpacity>
            </View>

            <ImageBackground
                source={bgImage}
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
                    <Text style={styles.headline}>{headline}</Text>
                </View>
            </ImageBackground>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.miniScroll}>
                {chapters.map((card, index) => (
                    <MiniCard
                        key={index}
                        number={index + 1}
                        title={card.chapter_name}
                        onPress={() => onMiniCardPress(card)}
                    />
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: global.colors.textPrimary,
    },
    arrow: {
        fontSize: 24,
        color: global.colors.textSecondary,
    },
    mainCard: {
        height: 120,
        borderRadius: 15,
        overflow: 'hidden',
        marginBottom: 12,
        justifyContent: 'flex-end',
    },
    progressBarBackground: {
        position: 'absolute',
        top: 12,
        left: 10,
        right: 10,
        height: 7,
        borderRadius: 5,
        backgroundColor: global.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressBarFill: {
        backgroundColor: global.colors.success,
        height: 7,
        borderRadius: 5,
    },
    progressText: {
        position: 'absolute',
        right: 0.00001,
        // top: -14,
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
        padding: 13,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
    },
    headline: {
        color: global.colors.background,
        fontSize: 16,
        fontWeight: '500',
    },
    miniScroll: {
        // overflow: 'visible'
    },
    miniCard: {
        backgroundColor: global.colors.surface,
        borderRadius: 13,
        padding: 15,
        marginRight: 12,
        width: 140,
    },

    miniCardCircle: {
        width: 24,
        height: 24,
        borderRadius: 16.5,
        backgroundColor: global.colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 13,
        marginBottom: 7,
    },
    miniCardNumber: {
        color: global.colors.background,
        fontWeight: '600',
        fontSize: 12,
    },
    miniCardTitle: {
        color: global.colors.textPrimary,
        fontWeight: '500',
        fontSize: 13,
        letterSpacing: 0.7,
        flexShrink: 1,
        width: 110,
        height: 36,
    },
});

export default LearningCard;