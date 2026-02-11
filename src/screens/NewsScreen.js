import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Text, ActivityIndicator, RefreshControl } from 'react-native';
import TopMenuSlider from "../components/TopMenuSlider";
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from "react-native-safe-area-context";
import NewsCardLarge from '../components/News/NewsCardLarge';
import NewsCardSmall from '../components/News/NewsCardSmall';
import { useNews } from '../hooks/useCachedQueries';

const NewsScreen = () => {

    const navigation = useNavigation();
    const {
        news,
        loading,
        isFetching,
        refetch
    } = useNews();
    return (
        <>
            <SafeAreaView edges={["bottom"]} style={styles.container}>

                {loading ? (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color={global.colors.secondary} />
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.scrollContainer}
                        showsVerticalScrollIndicator={false}
                         refreshControl={
                            <RefreshControl
                                refreshing={isFetching}
                                onRefresh={refetch}
                            />
                        }
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
        backgroundColor: global.colors.background,
        marginBottom: 50
    },
    topSliders: {
        backgroundColor: global.colors.primary,
        elevation: 10,
        shadowColor: global.colors.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
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
        color: global.colors.textSecondary,
    }
});