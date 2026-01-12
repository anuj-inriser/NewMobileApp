import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
// import FundamentalTopHeader from '../components/FundamentalTopHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
// import BottomTabBar from '../components/BottomTabBar';
import axiosInstance from '../api/axios';

export default function ChapterDetails({ route }) {
    // Always expect `chapter` as a param
    const { chapter } = route.params || {};

    const [chapters, setChapters] = useState([]);
    const [chapterContent, setChapterContent] = useState([]);

    if (!chapter) {
        return (
            <View style={styles.container}>
                <Text>No chapter data provided.</Text>
            </View>
        );
    }

    useEffect(() => {
        axiosInstance.get(`/chaptermaster/${chapter}`)
            .then((response) => {
                const data = response.data.data ?? [];
                setChapters(data);
                // if (data.length > 0) {
                //     setSelectedCategory(data[0]);
                // }
            })
            .catch((err) => {
                console.log('Error fetching Chapters', err);
            });
    }, []);

    useEffect(() => {
        axiosInstance.get(`/learningmodule/chapter/${chapter}`)
            .then((response) => {
                const data = response.data.data ?? [];
                setChapterContent(data);
                // if (data.length > 0) {
                //     setSelectedCategory(data[0]);
                // }
            })
            .catch((err) => {
                console.log('Error fetching Chapter content', err);
            });
    }, []);

    return (
        <>
            <SafeAreaView edges={["bottom"]} style={styles.container}>
                {/* <FundamentalTopHeader /> */}
                <ScrollView style={styles.content}>
                    <View style={styles.box}>
                        <Text style={styles.chapterNumber}>{chapters.chapter_name}</Text>
                        <Text style={styles.chapterHeaderDesc}>{chapters.chapter_brief}</Text>
                    </View>
                    {chapterContent.map((item, index) => (
                        <View
                            key={index}>
                            <View style={styles.chapterCard}>
                                <View style={styles.numCircle}>
                                    <Text style={styles.numText}>{index + 1}</Text>
                                </View>
                                <Text style={styles.cardTitle}>{item.topicheading || 'N/A'}</Text>

                            </View>
                            <View style={styles.box}>
                                <Text style={styles.boxHeading}>Definition:</Text>
                                <Text style={styles.boxText}>{item.content || 'N/A'}</Text>
                            </View>
                        </View>
                    ))
                    }
                </ScrollView>
            </SafeAreaView>
            {/* <BottomTabBar /> */}
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff', flex: 1,
    },
    content: {
        padding: 12,
    },
    chapterNumber: {
        fontWeight: '700', color: '#28235B', fontSize: 16,
        marginBottom: 2,
    },
    chapterHeaderDesc: {
        color: '#666',
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 10,
        marginTop: 2,
        lineHeight: 19
    },
    chapterCard: {
        borderRadius: 12,
        backgroundColor: '#E6E0E9',
        // marginLeft: 12,
        // marginHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        width: '100%',
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 1,
        elevation: 1,

    },
    numCircle: {
        width: 33, height: 33,
        borderRadius: 17,
        backgroundColor: '#210F47',
        alignItems: 'center', justifyContent: 'center',
        marginRight: 11,
    },
    numText: {
        color: '#fff', fontWeight: '700', fontSize: 18,
    },
    cardTitle: {
        fontWeight: '700',
        fontSize: 14,
        color: '#28235B'
    },
    box: {
        backgroundColor: '#fff',
        padding: 7,
        // marginBottom: 14,
        // marginTop: 8,
        marginHorizontal: 8,
    },
    boxHeading: {
        color: '#111439', fontWeight: '700', fontSize: 16, marginBottom: 2
    },
    boxText: {
        fontSize: 12, color: '#666', lineHeight: 19, fontWeight: '500',
    },
    sectionHeading: {
        color: '#28235B',
        fontWeight: '700',
        marginTop: 10,
        marginBottom: 5,
        fontSize: 16,
    },
    bullet: {
        color: '#666', fontWeight: '500', fontSize: 12, marginBottom: 2, marginLeft: 5, lineHeight: 19
    },
});