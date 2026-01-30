import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useAlert } from "../context/AlertContext";
import TextInput from "../components/TextInput";
import { Entypo, Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import axiosInstance from "../api/axios";
import { apiUrl } from "../utils/apiUrl";

const API = `${apiUrl}/api/wishlistcontrol`;

const TopWatchlistMenu = ({ onWatchlistChange }) => {
  const { showSuccess, showError } = useAlert();
  const SHOW_KEY = "watchlist_show_names";
  const [active, setActive] = useState(1);
  const [showPopup, setShowPopup] = useState(false);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [userId, setUserId] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [showContent, setShowContent] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const deleteScale = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loadShowState = async () => {
      const saved = await AsyncStorage.getItem(SHOW_KEY);
      if (saved === "true") {
        setShowContent(true);
      }
    };
    loadShowState();
  }, []);
  useEffect(() => {
    loadUserAndFetch();
  }, []);

  useEffect(() => {
    if (lists.length > 0) {
      const current = lists[active - 1];
      onWatchlistChange?.(current?.id || null);
    } else {
      onWatchlistChange?.(null);
    }
  }, [active, lists]);

  const loadUserAndFetch = async () => {
    try {
      const uid = await AsyncStorage.getItem("userId");
      setUserId(uid);
      if (uid) fetchLists(uid);
    } catch (err) {
      setLoading(false);
    }
  };

  const fetchLists = async (uid) => {
    try {
      const res = await axiosInstance.get(`${API}?user_id=${uid}`);
      const listData = res?.data?.data || [];
      setLists(
        listData.map((item) => ({
          id: item.wishlist_id,
          name: item.wishlist_name,
          user: item.user_id,
        }))
      );
    } catch (err) {
      setLists([]);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!inputValue.trim() || !userId) return;

    try {
      if (editIndex !== null) {
        const target = lists[editIndex];
        await axiosInstance.put(`${API}/${target.id}`, {
          wishlist_name: inputValue.trim(),
          user_id: userId,
        });
        const updated = [...lists];
        updated[editIndex].name = inputValue.trim();
        setLists(updated);
      } else {
        const res = await axiosInstance.post(API, {
          wishlist_name: inputValue.trim(),
          user_id: userId,
        });
        setLists([...lists, { id: res.data.id, name: inputValue.trim(), user: userId }]);
      }
    } catch (err) {
      console.log("Save error:", err);
    }

    setInputValue("");
    setInputVisible(false);
    setEditIndex(null);
  };

  const handleDeleteConfirm = async () => {
    if (!lists[deleteIndex]) return;

    try {
      const target = lists[deleteIndex];
      const userId = await AsyncStorage.getItem("userId"); // ✅ Get userId

      if (!userId) {
        showError(
          "Error",
          "User not logged In."
        );
        return;
      }

      // ✅ Bhejo URL params mein: /api/wishlistcontrol/:id?user_id=:userId
      await axiosInstance.delete(`${API}/${target.id}`, {
        params: { user_id: userId } // 👈 query param
      });

      const updatedLists = lists.filter((_, idx) => idx !== deleteIndex);
      setLists(updatedLists);

      if (deleteIndex === active - 1) {
        setActive(updatedLists.length > 0 ? 1 : 0);
      }
    } catch (err) {
      console.error("Delete error:", err.response?.data || err.message);
      showError(
          "Error",
         "Failed to delete watchlist. It may not belong to you or no longer exist."
        );
    } finally {
      setDeleteIndex(null);
    }
  };

  useEffect(() => {
    if (inputVisible) {
      Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [inputVisible]);

  useEffect(() => {
    if (deleteIndex !== null) {
      Animated.spring(deleteScale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
    } else {
      deleteScale.setValue(0.5);
    }
  }, [deleteIndex]);

  return (
    <>
      <View style={styles.paginationContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.pagination}>
            {lists.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.pageBtn,
                  { marginHorizontal: showContent ? 4 : 16 },
                  active === index + 1 && styles.activePage,
                ]}
                onPress={() => setActive(index + 1)}
              >
                <Text
                  style={[
                    styles.pageText,
                    active === index + 1 ? styles.activeText : styles.inactiveText,
                  ]}
                >
                  {showContent ? item.name : index + 1}
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

      {/* 🔹 Manage Watchlists Popup */}
      <Modal transparent visible={showPopup} animationType="fade">
        <Pressable
          style={styles.overlay}
          onPress={() => {
            setShowPopup(false);
            setInputVisible(false);
            setEditIndex(null);
          }}
        >
          <Pressable style={styles.popupBox}>
            <View style={styles.titleBar}>
              <Text style={styles.titleText}>Manage Watchlists</Text>
            </View>

            {loading && (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#210F47" />
              </View>
            )}

            {!loading &&
              lists.map((item, index) => (
                <View style={styles.row} key={item.id ?? index}>
                  <Text style={styles.rowLabel}>
                    {index + 1}. {item.name}
                  </Text>

                  <View style={styles.rowIcons}>
                    <TouchableOpacity
                      onPress={() => {
                        setInputVisible(true);
                        setInputValue(item.name);
                        setEditIndex(index);
                      }}
                    >
                      <Feather
                        name="edit"
                        size={16}
                        color="#555"
                        style={{ marginRight: 12 }}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setDeleteIndex(index)}>
                      <Feather name="trash-2" size={16} color="#555" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

            {!inputVisible && !loading && (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: 'space-around' }}>
                <TouchableOpacity
                  onPress={async () => {
                    const newValue = !showContent;
                    setShowContent(newValue);
                    await AsyncStorage.setItem(SHOW_KEY, newValue ? "true" : "false");
                  }}

                  style={{ marginTop: 16 }}
                >
                  <Ionicons
                    name={showContent ? "eye-outline" : "eye-off-outline"}
                    size={19}
                    color="#ffffff"
                    style={{ backgroundColor: '#210F47', borderRadius: 50, padding: 10 }}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addMoreBtn}
                  onPress={() => {
                    setInputVisible(true);
                    setInputValue("");
                    setEditIndex(null);
                  }}
                >
                  <Text style={styles.addMoreText}>Add More</Text>
                </TouchableOpacity>
              </View>
            )}

            {inputVisible && (
              <Animated.View
                style={[
                  styles.inputArea,
                  {
                    opacity: slideAnim,
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-10, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TextInput
                  placeholder="Enter watchlist name"
                  value={inputValue}
                  onChangeText={setInputValue}
                  style={styles.input}
                />

                <View style={styles.inputButtonRow}>
                  <TouchableOpacity
                    style={[styles.inputBtn, { backgroundColor: "#ccc" }]}
                    onPress={() => {
                      setInputVisible(false);
                      setInputValue("");
                      setEditIndex(null);
                    }}
                  >
                    <Text>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.inputBtn} onPress={handleSave}>
                    <Text style={{ color: "#fff" }}>
                      {editIndex !== null ? "Update" : "Add"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* 🔹 Delete Confirmation Modal */}
      <Modal transparent visible={deleteIndex !== null}>
        <Pressable style={styles.overlay} onPress={() => setDeleteIndex(null)}>
          <Animated.View style={[styles.deleteBox, { transform: [{ scale: deleteScale }] }]}>
            <Text style={styles.deleteText}>
              Are you sure you want to delete this watchlist?
            </Text>

            <View style={styles.deleteBtns}>
              <TouchableOpacity
                style={styles.noBtn}
                onPress={() => setDeleteIndex(null)}
              >
                <Text style={styles.noText}>No</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.yesBtn} onPress={handleDeleteConfirm}>
                <Text style={styles.yesText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  paginationContainer: {
    backgroundColor: "#fff",
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
  },
  pageBtn: {
    minWidth: 28,          // Minimum width for numbers
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10, // Space for names
    borderRadius: 14,
  },

  activePage: {
    backgroundColor: "#ebe4f2",
  },

  pageText: {
    fontSize: 13,
    textAlign: "center",
  },

  activeText: {
    color: "#000",
    fontWeight: "600"
  },

  inactiveText: {
    color: "#555"
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

export default TopWatchlistMenu;