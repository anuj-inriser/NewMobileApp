import React, { useState, useRef, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import { WebView } from "react-native-webview";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "../api/axios";
import { apiUrl } from "../utils/apiUrl";

const AccountScreen = () => {
  const { authToken, setAuthData, clearAuth, disconnectBroker, clientId } = useAuth();
  const { showSuccess, showError } = useAlert();
  const [showAngelOneModal, setShowAngelOneModal] = useState(false);
  const [balance, setBalance] = useState(0)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const webViewRef = useRef(null);
  const isProcessingAuth = useRef(false);

  const angelOneUrl =
    "https://smartapi.angelone.in/publisher-login?api_key=IG8g0BMf&state=accountpage";

  const brokers = [
    {
      id: "angle",
      name: "AngleOne",
      icon: require("../../assets/angelone.png"),
      balance: "₹ 0,000",
      isConnected: !!authToken,
    },
    {
      id: "groww",
      name: "Groww",
      icon: require("../../assets/grow.png"),
      balance: "₹ 75,375",
      isConnected: false,
    },
    {
      id: "zerodha",
      name: "Zerodha",
      icon: require("../../assets/zerodha.png"),
      balance: "₹ 75,375",
      isConnected: false,
    },
  ];

  const handleAngelOneNavigation = async (navState) => {
    const { url } = navState;
    if (url.includes("auth_token") && url.includes("feed_token") && !isProcessingAuth.current) {
      isProcessingAuth.current = true; // Prevent multiple triggers

      let angelOneMeta = {
        success: false,
        message: "",
        userid: "",
      };

      // Stop WebView immediately to prevent flash of admin/success page
      webViewRef.current?.stopLoading();
      setShowAngelOneModal(false);

      try {
        const urlObj = new URL(url);
        const auth_token = urlObj.searchParams.get("auth_token");
        const feed_token = urlObj.searchParams.get("feed_token");
        const refresh_token = urlObj.searchParams.get("refresh_token");

        let cId = null;
        try {
          const payloadSnippet = auth_token.split(".")[1];
          const decoded = JSON.parse(atob(payloadSnippet));
          cId = decoded.username;
        } catch (e) { }

        await setAuthData({
          authToken: auth_token,
          feedToken: feed_token,
          refreshToken: refresh_token,
          clientId: cId,
        });

        showSuccess("Success", "Angel One connected successfully.");
        angelOneMeta.success = true;
        angelOneMeta.message = "AngelOne login success";
      } catch (e) {
        showError("Error", "Failed to connect Angel One.");
        angelOneMeta.message = "AngelOne login failed";
      } finally {
        try {
          const userId = await AsyncStorage.getItem("userId");
          angelOneMeta.userid = userId || "";

          const deviceId =
            Device.osBuildId || Device.modelId || Device.deviceName || "Unknown";

          await axiosInstance.post("/eventlog", {
            user_id: angelOneMeta.userid,
            success: angelOneMeta.success,
            device_id: deviceId,
            event_group_id: 1,
            event_type: "AngelOne Login",
            content: angelOneMeta.message,
            app_version: "1.0.0"
          });
        } catch (err) {
          console.log("Logging failed", err);
        }
        isProcessingAuth.current = false;
      }
    }
  };

  const fetchFunds = async (segmentType) => {
    try {
      const res = await fetch(
        `${apiUrl}/api/fundandmargin/get?segment=${segmentType}`,
        {
          headers: {
            Authorization: "Bearer " + authToken,
          },
        },
      );

      const data = await res.json();
      if (data.success) {
        setBalance(data.amountAvail || 0);
      }
    } catch (err) {
      console.log("Fund API error:", err.message);
    }
  };

  useEffect(() => {
    if (!authToken) return;

    fetchFunds("FETCHFUNDS");
  }, [authToken]);



  const handleLogout = async () => {
    let angelOneMeta = {
      success: false,
      message: "",
      userid: "",
    };

    try {
      await disconnectBroker();
      setShowDisconnectConfirm(false);
      showSuccess("Success", "Broker disconnected successfully.");
      angelOneMeta.success = true;
      angelOneMeta.message = "AngelOne logout success";

      const userId = await AsyncStorage.getItem("userId");
      angelOneMeta.userid = userId || "";

      // Delete portfolio records only after successful broker logout
      if (angelOneMeta.userid) {
        try {
          await axiosInstance.delete("/portfolio", {
            data: { user_id: angelOneMeta.userid },
          });
        } catch (deleteErr) {
          console.log("Portfolio delete failed", deleteErr);
        }
      }
    } catch (e) {
      showError("Error", "Failed to disconnect broker.");
      angelOneMeta.message = "AngelOne logout failed";
    } finally {
      try {
        if (!angelOneMeta.userid) {
          const userId = await AsyncStorage.getItem("userId");
          angelOneMeta.userid = userId || "";
        }

        const deviceId =
          Device.osBuildId || Device.modelId || Device.deviceName || "Unknown";

        await axiosInstance.post("/eventlog", {
          user_id: angelOneMeta.userid,
          success: angelOneMeta.success,
          device_id: deviceId,
          event_group_id: 1,
          event_type: "AngelOne Logout",
          content: angelOneMeta.message,
          app_version: "1.0.0"
        });
      } catch (err) {
        console.log("Logging failed", err);
      }
    }
  };

  const renderBrokerRow = (broker) => (
    <View key={broker.id} style={styles.brokerRow}>
      <View style={styles.brokerLeft}>
        <View style={styles.iconContainer}>
          <Image source={broker.icon} style={styles.brokerIcon} />
        </View>
        <Text style={styles.brokerName}>{broker.name}</Text>
      </View>
      <View style={styles.brokerRight}>
        <View style={styles.balanceBadge}>
          <Text style={styles.balanceText}>₹ {Number(balance).toFixed(2)}</Text>
          <TouchableOpacity style={styles.refreshBtn}>
            <Ionicons name="refresh-outline" size={18} color="#333" onPress={async () => {
              await fetchFunds("FETCHFUNDS")
            }}/>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.disconnectBtn}
          onPress={broker.id === "angle" ? () => setShowDisconnectConfirm(true) : undefined}
          disabled={!broker.isConnected}
        >
          <Ionicons name="remove-outline" size={20} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {authToken ? (
        <View style={styles.connectedView}>
          <Text style={styles.accountTitle2}>Connected Accounts</Text>
          <ScrollView contentContainerStyle={styles.listContent}>
            {/* When connected, show only AngleOne as per user instruction */}
            {brokers
              .filter((b) => b.id === "angle")
              .map(renderBrokerRow)}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.emptyState}>
          {/* Top Card for Broker Connection */}
          <Text style={styles.accountTitle}>Connect your existing DEMAT</Text>
          <View style={styles.connectCard}>
            <View style={styles.brokerLeft}>
              <View style={styles.iconContainer}>
                <Image source={require("../../assets/angelone.png")} style={styles.brokerIcon} />
              </View>
              <Text style={styles.brokerName}>AngleOne</Text>
            </View>
            <TouchableOpacity
              style={styles.inlineConnectBtn}
              onPress={() => setShowAngelOneModal(true)}
            >
              <Text style={styles.inlineConnectBtnText}>Add DEMAT</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.emptyTextContainer}>

            <Text style={styles.accountSubtitle}>
              Sync your portfolio, take trades, check fund status & more through
              secure connection to your Broker. We do not charge anything extra
              for your trades.
            </Text>
          </View>
        </View>
      )}

      {/* DISCONNECT CONFIRMATION MODAL */}
      <Modal
        visible={showDisconnectConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDisconnectConfirm(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.deleteBox}>
            <Text style={styles.deleteText}>
              Are you sure you want to disconnect your broker account?
            </Text>
            <View style={styles.deleteBtns}>
              <TouchableOpacity
                style={styles.noBtn}
                onPress={() => setShowDisconnectConfirm(false)}
              >
                <Text style={styles.noText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.yesBtn}
                onPress={handleLogout}
              >
                <Text style={styles.yesText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ANGELONE CONNECT MODAL */}
      <Modal
        visible={showAngelOneModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAngelOneModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowAngelOneModal(false)}
          >
            <Ionicons
              name="close"
              size={28}
              color={global.colors.textPrimary}
            />
          </TouchableOpacity>

          <WebView
            ref={webViewRef}
            source={{ uri: angelOneUrl }}
            style={styles.webView}
            onNavigationStateChange={handleAngelOneNavigation}
            incognito={true} // Helps clear previous session states
          />
        </View>
      </Modal>
    </View>
  );
};

export default AccountScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  connectedView: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  brokerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  brokerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 38,
    height: 38,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  brokerIcon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
  brokerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  brokerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAE6EC",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 8,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginRight: 6,
  },
  refreshBtn: {
    padding: 2,
  },
  disconnectBtn: {
    backgroundColor: "#EAE6EC",
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  connectCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 24,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inlineConnectBtn: {
    backgroundColor: "#1C0D3D",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  inlineConnectBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyTextContainer: {
    marginBottom: 40,
  },
  accountTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    marginTop: 12,
  },
  accountSubtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBox: {
    width: 280,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
  },
  deleteText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
    lineHeight: 20,
  },
  deleteBtns: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  noBtn: {
    padding: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  yesBtn: {
    padding: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    backgroundColor: "#FF3B30",
  },
  noText: { color: global.colors.textPrimary, fontWeight: "600" },
  yesText: { color: global.colors.background, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#fff",
  },
  closeButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 25,
  },
  webView: {
    flex: 1,
    marginTop: 80,
  },
  accountTitle2: {
    fontSize: 20,
    fontWeight: "600",
    color: global.colors.textPrimary,
    marginBottom: 12,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  header: {
    backgroundColor: global.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
});
