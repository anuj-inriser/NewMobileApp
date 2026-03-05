import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CommunitySecondMenuSlider = ({ activeFilter, onTabChange }) => {

    const tabs = [
        { id: "Timeline", name: "Timeline" },
        { id: "Sequence", name: "Scanner" },
        // { id: "Learning", name: "Learning" },
        // { id: "Watchlist", name: "Watchlist" },
    ];

    const selected = activeFilter || "Timeline"; // DEFAULT SELECTED

    return (
        <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
            <View style={styles.tabContainer}>
                {tabs.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[
                            styles.tabItem,
                            selected === item.id && styles.activeTab
                        ]}
                        onPress={() => onTabChange(item.id)}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                selected === item.id && styles.activeTabText
                            ]}
                        >
                            {item.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { backgroundColor: global.colors.background },
    tabContainer: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingVertical: 6,
    },

    tabItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: global.colors.background,
        borderRadius: 40,
        paddingVertical: 7,
        paddingHorizontal: 16,
        marginRight: 8,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },

    tabText: {
        color: global.colors.secondary,
        fontSize: 12,
        fontFamily: "Poppins-Medium",
        fontWeight: "500",
    },

    activeTab: {
        backgroundColor: global.colors.secondary,
        elevation: 7,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },

    activeTabText: {
        color: global.colors.background,
        fontWeight: "500",
    },
});

export default CommunitySecondMenuSlider;
