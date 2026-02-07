
import { Text, StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// import { useNavigation, useRoute } from "@react-navigation/native";
// import axiosInstance from "../api/axios";

const TradeTopMenuSlider = ({
    currentRoute: propCurrentRoute,
    tradeCategory = [],
    selectedCategory,
    onTabChange,
    isClickable = true
}) => {

    const handleTabPress = (item) => {
        if (!isClickable) return;
        onTabChange(item);
    };


    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                {tradeCategory.map((item) => (
                    <TouchableOpacity
                        key={item.scriptTypeId}
                        style={[
                            styles.tabItem,
                            (selectedCategory?.scriptTypeId === item.scriptTypeId) && styles.activeTab
                        ]}
                        onPress={() => handleTabPress(item)}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                (selectedCategory?.scriptTypeId === item.scriptTypeId) && styles.activeTabText
                            ]}
                        >
                            {item.scriptTypeName}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: global.colors.background,
    },
    scrollContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
    },
    tabItem: {
        backgroundColor: global.colors.background,
        borderRadius: 40,
        paddingVertical: 5,
        paddingHorizontal: 16,
        marginRight: 10,
        shadowColor: global.colors.textPrimary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 1.5,
        elevation: 2,
    },
    tabText: {
        color: global.colors.secondary,
        fontSize: 12,
        fontFamily: "Poppins-Medium",
        fontWeight: "500",
    },
    activeTab: {
        backgroundColor: global.colors.secondary,
        shadowColor: global.colors.secondary,
        shadowOpacity: 0.2,
    },
    activeTabText: {
        color: global.colors.background,
        fontWeight: "600",
    },
});

export default TradeTopMenuSlider;
