import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Text, ActivityIndicator, RefreshControl, TouchableOpacity, FlatList } from 'react-native';
// import TopMenuSlider from "../components/TopMenuSlider";
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from "react-native-safe-area-context";
import NewsCardLarge from '../components/News/NewsCardLarge';
import NewsCardSmall from '../components/News/NewsCardSmall';
import { useNews, useNewsCategories } from '../hooks/useCachedQueries';

const NewsScreen = () => {

    const navigation = useNavigation();
    const [selectedCategory, setSelectedCategory] = useState({ id: 0, name: 'All' });

    const categoryId = selectedCategory?.id !== undefined ? selectedCategory.id : selectedCategory?.news_category;

    
    const {
        news,
        loading,
        isFetching,
        refetch
    } = useNews(categoryId? categoryId : null);

    const { data: rawCategories = [], isLoading: categoriesLoading } = useNewsCategories();

    const categories = [
        { id: 0, name: 'All' },
        ...rawCategories.sort((a, b) => a.sort_order - b.sort_order).filter(cat => cat.name && cat.name.trim() !== "" && cat.display === true)
    ];


    useEffect(() => {
        if (categories.length > 0 && !selectedCategory) {
            setSelectedCategory(categories[0]);
        }
    }, [categories, selectedCategory]);

    const renderCategoryItem = ({ item }) => {
        const itemId = item.id !== undefined ? item.id : item.news_category;
        const selectedId = selectedCategory?.id !== undefined ? selectedCategory.id :  selectedCategory?.news_category;
        
        return (
            <TouchableOpacity
                style={[
                    styles.categoryTab,
                    selectedId === itemId && styles.activeCategoryTab
                ]}
                onPress={() => setSelectedCategory(item)}
            >
                <Text style={[
                    styles.categoryTabText,
                    selectedId === itemId && styles.activeCategoryTabText
                ]}>
                    {item.name}
                </Text>
            </TouchableOpacity>
        );
    };

    const filteredNews = news.filter(item => {
        if (categoryId == 0 || categoryId == null) return true;

        // 1. Try matching by ID first (robustly)
        const itemCatId = item.news_category ?? item.category_id ?? item.news_category_id;
        if (itemCatId != null && itemCatId == categoryId) return true;

        // 2. Fallback to matching by Name (matching the log structure seen)
        if (item.news_category_name && selectedCategory.name && 
            item.news_category_name.trim().toLowerCase() === selectedCategory.name.trim().toLowerCase()) {
            return true;
        }

        return false;
    });


    return (
        <>
            <SafeAreaView edges={["bottom"]} style={styles.container}>

                <View style={styles.categoryContainer}>
                    <FlatList
                        data={categories}
                        renderItem={renderCategoryItem}
                        keyExtractor={(item) => (item.id !== undefined ? item.id : item.news_category)?.toString() || 'all'}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoryList}
                    />
                </View>

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
                        {filteredNews.length === 0 ? (
                            <View style={styles.noDataContainer}>
                                <Text style={styles.noData}>No News Available</Text>
                            </View>
                        ) : (
                            filteredNews.map((item, index) => (
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
    categoryContainer: {
        backgroundColor: global.colors.background,
        marginTop: 5,
    },
    categoryList: {
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    categoryTab: {
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 40,
        backgroundColor: global.colors.background,
        marginRight: 8,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: global.colors.secondary + '20',
    },
    activeCategoryTab: {
        backgroundColor: global.colors.secondary,
        borderColor: global.colors.secondary,
    },
    categoryTabText: {
        color: global.colors.secondary,
        fontSize: 12,
        fontWeight: "500",
        fontFamily: "Poppins-Medium",
    },
    activeCategoryTabText: {
        color: global.colors.background,
    },
    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 30,
    },
    scrollContainer: {
        flexGrow:1,
        paddingBottom: 25,
        paddingHorizontal: 12,
        marginTop: 5
    },
    noDataContainer: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 30,
    },
    noData: {
        fontSize: 16,
        color: global.colors.textSecondary,
    }
});
