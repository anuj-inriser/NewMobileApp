import React, { useState, useEffect } from "react";
import { View,DeviceEventEmitter } from "react-native";
import FundamentalTopHeader from "../components/FundamentalTopHeader";
import BottomTabBar from "../components/BottomTabBar";
import ProfileSlider from "../components/ProfileSlider";
import NotificationSlider from "../components/NotificationSlider";
import StockinfoSlider from "../components/Stockinfoslider";
import PremiumOverlay from "../components/PremiumOverlay";
// import Popuponphoneopen from "../components/Popuponphoneopen";
// import Popuponclose from "../components/Popuponclose";

const MainLayout = ({ children }) => {
 const [promoVisible, setPromoVisible] = useState(false);
    // const [specialOfferVisible, setSpecialOfferVisible] = useState(false);
    // const [exitPopupVisible, setExitPopupVisible] = useState(false);

    useEffect(() => {
        // Listen for manual triggers from other screens (e.g., TradeScreen)
        const sub = DeviceEventEmitter.addListener('SHOW_PREMIUM_MODAL', () => {
            setPromoVisible(true);
        });

        // // Show special offer on app startup (e.g., after 2 seconds)
        // const timer = setTimeout(() => {
        //     setSpecialOfferVisible(true);
        // }, 2000);

        return () => {
            sub.remove();
        };
    }, []);
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
            <PremiumOverlay
                visible={promoVisible}
                onClose={() => setPromoVisible(false)}
            />
            {/* <Popuponphoneopen
                visible={specialOfferVisible}
                onClose={() => setSpecialOfferVisible(false)}
                onUnlock={() => {
                    setSpecialOfferVisible(false);
                    setPromoVisible(true); // Open the plans modal
                }}
            />
            <Popuponclose
                visible={exitPopupVisible}
                onClose={() => setExitPopupVisible(false)}
                onUnlock={() => {
                    setExitPopupVisible(false);
                    setPromoVisible(true); // Open the plans modal
                }}
            /> */}
        </View>
    );
};

export default React.memo(MainLayout);
