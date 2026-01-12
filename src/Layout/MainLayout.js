import React from "react";
import { View } from "react-native";
import TopHeader from "../components/TopHeader";
import FundamentalTopHeader from "../components/FundamentalTopHeader";
import BottomTabBar from "../components/BottomTabBar";

const MainLayout = ({ children }) => {
    return (
        <View style={{ flex: 1 }}>
            <FundamentalTopHeader />
            <View style={{ flex: 1 }}>
                {children}
            </View>
            <BottomTabBar />
        </View>
    );
};

export default React.memo(MainLayout);
