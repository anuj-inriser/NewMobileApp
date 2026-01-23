import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
// import TopHeader from "../components/TopHeader";
import TopMenuSlider from "../components/TopMenuSlider";
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from "react-native-safe-area-context";
// import BottomTabBar from '../components/BottomTabBar';
import NewsCardLarge from '../components/News/NewsCardLarge';
import NewsCardSmall from '../components/News/NewsCardSmall';
import axiosInstance from "../api/axios";

const NewsScreen = () => {

    const navigation = useNavigation();
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        const fetchNews = async () => {
            try {
                setLoading(true);
                const res = await axiosInstance.get('/newsfeed/published');
                setNews(res.data?.data || []);
            } catch (error) {
                console.log("error fetching news", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);


    return (
        <>
            <SafeAreaView edges={["bottom"]} style={styles.container}>
                {/* <TopHeader /> */}
                {/* <View>
                    <TopMenuSlider />
                </View> */}

                {loading ? (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color="#210F47" />
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.scrollContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        {news.length === 0 ? (
                            <Text style={styles.noData}>No News Available</Text>
                        ) : (
                            news.map((item, index) => (
                                index === 0 ? (
                                    <NewsCardLarge
                                        key={item.news_id}
                                        item={item}
                                        onPress={() => navigation.navigate('NewsReadingScreen', { item })}
                                    />
                                ) : (
                                    <NewsCardSmall
                                        key={item.news_id}
                                        item={item}
                                        onPress={() => navigation.navigate('NewsReadingScreen', { item })}
                                    />
                                )
                            ))
                        )}
                    </ScrollView>
                )}

            </SafeAreaView>

            {/* <BottomTabBar /> */}
        </>
    );
};

export default NewsScreen;

// STYLES
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
        marginBottom: 50
    },
    topSliders: {
        backgroundColor: "#fff",
        elevation: 10, // Android shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 }, // bottom direction
        shadowOpacity: 0.2,
        shadowRadius: 3,

        // Trick to hide top shadow impact
        marginTop: -3,
        paddingTop: 3,
        marginBottom: 10
    },
    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 30,
    },
    scrollContainer: {
        paddingBottom: 25,
        paddingHorizontal: 12,
        marginTop: 15
    },
    noData: {
        textAlign: "center",
        marginTop: 40,
        fontSize: 16,
        color: "#666",
    }
});
