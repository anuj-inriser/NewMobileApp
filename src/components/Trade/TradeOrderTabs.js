import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  Animated,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Entypo, Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { apiUrl } from "../../utils/apiUrl";

const API = `${apiUrl}/api/wishlistcontrol`;

const orderTabs = [
    { id: 1, name: "Trade" },
  { id: 2, name: "Orders" },
  { id: 3, name: "Positions" },
]

const TradeOrderTabs = ({ onTabChange, activeTab }) => {
  const [active, setActive] = useState(activeTab || 1);
  const [showPopup, setShowPopup] = useState(false);
  useEffect(() => {
    if (activeTab !== undefined) {
      setActive(activeTab);
    }
  }, [activeTab]);
  const handlePress = (index) => {
    setActive(index);
    onTabChange(index);
  };

  return (
    <>
      <View style={styles.paginationContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.pagination}>
            {orderTabs.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.pageBtn,
                  active === item.id
                    ? { backgroundColor: "#210F47" }
                    : { backgroundColor: "#fff" },
                ]}
                onPress={() => handlePress(item.id)}
              >
                <Text
                  style={[
                    styles.pageText,
                    active === item.id
                      ? styles.activeText
                      : styles.inactiveText,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <TouchableOpacity onPress={() => setShowPopup(true)}>
          <Entypo
            name="dots-three-vertical"
            size={14}
            color="#555"
            style={{ paddingHorizontal: 10, marginHorizontal: 15 }}
          />
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  paginationContainer: {
    backgroundColor: "#fff",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 16,
  },
  pageBtn: {
    backgroundColor: "#fff",
    borderRadius: 40,
    paddingVertical: 5,
    paddingHorizontal: 16,
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    elevation: 2,
  },

  pageText: {
    color: "#210F47",
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    fontWeight: "500",
  },

  activeText: {
    color: "#fff",
    fontWeight: "600",
  },

  inactiveText: {
    color: "#555",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  popupBox: {
    width: 260,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    paddingBottom: 16,
  },
  titleBar: {
    paddingVertical: 12,
    backgroundColor: "#f0eef5",
    alignItems: "center",
  },
  titleText: { fontSize: 15, fontWeight: "600" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  rowLabel: { fontSize: 14, color: "#333" },
  rowIcons: { flexDirection: "row" },
  addMoreBtn: {
    marginTop: 16,
    alignSelf: "center",
    backgroundColor: "#210F47",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  addMoreText: { color: "#fff", fontWeight: "600" },
  inputArea: {
    marginTop: 16,
    paddingHorizontal: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#f9f9f9",
  },
  inputButtonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 10,
  },
  inputBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#210F47",
  },
  deleteBox: {
    width: 260,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
  },
  deleteText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
  },
  deleteBtns: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  noBtn: {
    padding: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    backgroundColor: "#ddd",
  },
  yesBtn: {
    padding: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    backgroundColor: "#D32F2F",
  },
  noText: { color: "#333", fontWeight: "600" },
  yesText: { color: "#fff", fontWeight: "600" },
});

export default TradeOrderTabs;
