import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import LearningCard from '../components/LearningCard'; // relative import
import learning_image from "../../assets/learning_image.jpg"
// import TopHeader from "../components/TopHeader";
import TopMenuSlider from "../components/TopMenuSlider";
import { SafeAreaView } from "react-native-safe-area-context";
// import BottomTabBar from '../components/BottomTabBar';
import TopFundamentalSlider from '../components/TopFundamentalSlider';
import axiosInstance from "../api/axios";
import { apiUrl } from '../utils/apiUrl';

const Learning = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        axiosInstance.get('/learningcategory')
            .then((response) => {
                const data = response.data.data ?? [];
                setCategories(data);

            })
            .catch((err) => {
                console.log('Error fetching categories:', err);
            });
    }, []);


    useEffect(() => {
        if (!categories.length) return;

        if (route.params?.selectedCategoryId) {
            const found = categories.find(c => c.id === route.params.selectedCategoryId);
            if (found) {
                setSelectedCategory(found);
                return;
            }
        }

        // if (!selectedCategory) {
        //     setSelectedCategory(categories[0]);
        // }

    }, [route.params?.selectedCategoryId, categories]);

    useFocusEffect(
        React.useCallback(() => {
            if (selectedCategory?.id) {
                setLoading(true);
                fetchModules(selectedCategory.id);
            }
        }, [selectedCategory])
    );


    const fetchModules = async (categoryId) => {
        try {
            const res = await axiosInstance.get(`/learningmodules/category/${categoryId}`);
            setModules(res.data.data ?? []);
        } catch (err) {
            console.log("Error fetching modules:", err);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (categories.length > 0 && !selectedCategory) {
            setSelectedCategory(categories[0]); // auto select 1st tab
        }
    }, [categories]);

    return (
        <>
            <SafeAreaView edges={["bottom"]} style={styles.container}>
                {/* <TopHeader /> */}
                <View >
                    <TopMenuSlider />
                    <TopFundamentalSlider
                        learningCategory={categories}
                        selectedCategory={selectedCategory}
                        onTabChange={(item) => setSelectedCategory(item)}
                    />
                </View>
                <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                    {loading ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color="#210F47" />
                        </View>
                    ) : modules.length === 0 ? (
                        <View style={styles.noDataContainer}>
                            <Text style={styles.noDataText}>No modules found in this category</Text>
                        </View>
                    ) : (
                        modules.map((item) => {
                            return (
                                <LearningCard
                                    key={item.moduleid}
                                    id={item.moduleid}
                                    title={item.module_name}
                                    bgImage={learning_image}
                                    // bgImage={{ uri: `${apiUrl}/uploads/moduleimages/${item.module_image}` }}
                                    initialProgress={0}
                                    headline={item.module_brief}
                                    onArrowPress={() =>
                                        navigation.navigate('ChapterScreen', { moduleId: item.moduleid, categoryId: selectedCategory.id })
                                    }
                                />
                            )
                        })
                    )}
                </ScrollView>
            </SafeAreaView>
            {/* <BottomTabBar /> */}
        </>
    );
};

const styles = StyleSheet.create({
    container: { backgroundColor: '#F5F5F7', flex: 1 },
    topSliders: {
        backgroundColor: "#fff",
        elevation: 10, // Android shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 }, // bottom direction
        shadowOpacity: 0.2,
        shadowRadius: 3,

        // Trick to hide top shadow impact
        marginTop: -3,
        paddingTop: 3
    },
    noDataContainer: {
        padding: 20,
        marginTop: 20,
        alignItems: 'center',
    },
    noDataText: {
        fontSize: 16,
        color: '#777',
        fontWeight: '500',
    },
    loaderContainer: {
        marginTop: 30,
        alignItems: 'center',
    },

});

export default Learning;
