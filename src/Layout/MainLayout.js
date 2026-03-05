import React from "react";
import { View } from "react-native";
import FundamentalTopHeader from "../components/FundamentalTopHeader";
import BottomTabBar from "../components/BottomTabBar";
import ProfileSlider from "../components/ProfileSlider";
import NotificationSlider from "../components/NotificationSlider";
import StockinfoSlider from "../components/Stockinfoslider";

const MainLayout = ({ children }) => {

    return (
        <View style={{ flex: 1 }}>
            <FundamentalTopHeader />
            <View style={{ flex: 1 }}>
                {children}
            </View>
            <BottomTabBar />
            <ProfileSlider />
            <NotificationSlider />
            <StockinfoSlider />
        </View>
    );
};

export default React.memo(MainLayout);