import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CommunitySecondMenuSlider = ({ activeFilter, onTabChange }) => {

    const tabs = [
        { id: "Timeline", name: "Timeline" },
        { id: "Sequence", name: "Scanner" },
        { id: "Learning", name: "Learning" },
        { id: "Watchlist", name: "Watchlist" },
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
    safeArea: { backgroundColor: "#fff" },

    tabContainer: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingVertical: 6,
    },

    tabItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 40,
        paddingVertical: 4,
        paddingHorizontal: 16,
        marginRight: 8,
        elevation: 2,
    },

    tabText: {
        color: "#210F47",
        fontSize: 12,
        fontWeight: "500",
    },

    activeTab: {
        backgroundColor: "#210F47",
    },

    activeTabText: {
        color: "#fff",
        fontWeight: "500",
    },
});

export default CommunitySecondMenuSlider;
