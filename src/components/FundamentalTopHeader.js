import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Modal,
  Text,
  Animated,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import TextInput from "../components/TextInput";
import { Ionicons, ClearIcon } from "@expo/vector-icons";
import CancelIcon from "../../assets/cancelicon.png";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "../api/axios";
import { apiUrl } from "../utils/apiUrl";
import { useAuth } from "../context/AuthContext";
import { useWatchlistRefresh } from "../context/WatchlistContext";
import { useDrawer } from "../context/DrawerContext";
import rupeeIcon from "../../assets/trademenu.png";
import watchlistIcon from "../../assets/dropdownwatchlist.png";
import { useFocusEffect } from "@react-navigation/native";
import Profile from "../../assets/Profile.png";
import { useAlert } from "../context/AlertContext";
import { openDrawer } from "../context/DrawerContext";

const WISHLIST_API = `${apiUrl}/api/wishlistcontrol`;
const FundamentalTopHeader = ({ onWatchlistAdded, showBackButton }) => {
  const { showSuccess, showError } = useAlert();
  const insets = useSafeAreaInsets();
  const { openProfileDrawer, openNotificationDrawer } = useDrawer();
  const { authToken, clientId, clearAuth, profileImage } = useAuth();
  const { triggerRefresh } = useWatchlistRefresh();
  const [menuVisible, setMenuVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const navigation = useNavigation();
  const [masterData, setMasterData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [watchlistModalVisible, setWatchlistModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [watchlists, setWatchlists] = useState([]);
  const [loadingWatchlists, setLoadingWatchlists] = useState(false);
  const [userId, setUserId] = useState(null);
  const [addingToWishlist, setAddingToWishlist] = useState({});
  const [searchText, setSearchText] = useState("");

  const { openStockInfoDrawer } = useDrawer();

  const loadUserId = async () => {
    try {
      const uid = await AsyncStorage.getItem("userId");
      setUserId(uid);
    } catch (err) {
      console.log("User ID load error:", err);
    }
  };
  const getUserById = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const res = await axiosInstance.get(`${apiUrl}/api/users/${userId}`);
      const user = res.data.data;
    } catch (err) {
      console.log("API Error =>", err);
    }
  };
  const getImageSource = (img) => {
    if (!img) return Profile;

    if (img.startsWith("file://") || img.startsWith("content://")) {
      return { uri: img };
    }

    return { uri: `data:image/jpeg;base64,${img}` };
  };

  const fetchMaster = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/scripts`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      // ✅ Your API uses: { status: true, message: "...", data: [...] }
      if (data.status === true && Array.isArray(data.data)) {
        setMasterData(data.data);
      } else {
        console.warn("⚠️ Invalid or empty response data:", data);
        setMasterData([]);
      }
    } catch (err) {
      console.error("❌ Master Load Error:", err.message || err);
      setMasterData([]);
    }
  };
  useEffect(() => {
    fetchMaster();
    loadUserId();
    // getUserById();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      getUserById();
    }, []),
  );

  const searchFilter = (text) => {
    setSearchText(text);
    if (!text.trim()) {
      setFiltered([]);
      return;
    }

    const lower = text.toLowerCase();
    const results = masterData.filter((item) => {
      return (
        // ✅ Use PostgreSQL column names: script_name, script_id, exchange
        (item.script_name && item.script_name.toLowerCase().includes(lower)) ||
        (item.script_id && item.script_id.toLowerCase().includes(lower)) ||
        (item.exchange && item.exchange.toLowerCase().includes(lower))
      );
    });

    setFiltered(results.slice(0, 8));
  };
  // 🔻 Open popup with existing watchlists only
  const handleSuggestionSelect = (item) => {
    setSelectedItem(item);
    setFiltered([]);
  };

  const showMenu = () => {
    setMenuVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const hideMenu = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
    });
  };

  // const handleLogout = async () => {
  //   try {
  //     // 🔥 STEP 1: If any required value is missing → direct logout
  //     if (!userId || !authToken || !clientId) {

  //       await clearAuth();
  //       hideMenu();

  //       navigation.reset({
  //         index: 0,
  //         routes: [{ name: "Login" }],
  //       });

  //       return; // ⛔ STOP HERE → No API call
  //     }

  //     // 🔥 STEP 2: All values exist → API call
  //     const res = await fetch(`${apiUrl}/api/check-user/logout`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         userId,
  //         authToken,
  //         clientcode: clientId,
  //       }),
  //     });

  //     const data = await res.json();
  //     if (data.status) {
  //       await clearAuth();
  //       hideMenu();
  //       navigation.reset({
  //         index: 0,
  //         routes: [{ name: "Login" }],
  //       });
  //     }
  //   } catch (err) {
  //     Alert.alert("Error", "Logout failed");
  //   }
  // };

  // const menuOptions = [{ label: "Logout", action: handleLogout }];

  // 🔻 Fetch ONLY existing watchlists
  const fetchWatchlists = async () => {
    if (!userId) return;
    setLoadingWatchlists(true);
    try {
      const res = await axiosInstance.get(`${WISHLIST_API}?user_id=${userId}`);
      const listData = res?.data?.data || [];
      setWatchlists(
        listData.map((item) => ({
          id: item.wishlist_id,
          name: item.wishlist_name,
          user: item.user_id,
        })),
      );
    } catch (err) {
      console.log("Watchlist fetch error:", err);
      setWatchlists([]);
    }
    setLoadingWatchlists(false);
  };

  const closeWatchlistModal = () => {
    setWatchlistModalVisible(false);
    setSelectedItem(null);
  };

  const handleAddToWatchlist = async (wishlist) => {
    if (!selectedItem || !wishlist || !userId) return;

    // 🔒 Disable double-tap (optional but recommended)
    if (addingToWishlist[wishlist.id]) return;
    setAddingToWishlist((prev) => ({ ...prev, [wishlist.id]: true }));

    const payload = {
      script_id: selectedItem.script_id,
      user_id: parseInt(userId, 10),
      wishlist_id: parseInt(wishlist.id, 10),
      token: selectedItem.token,
    };

    try {
      const stocksRes = await axiosInstance.get(`${apiUrl}/api/wishlistcontrol/stocks`, {
        params: { wishlist_id: parseInt(wishlist.id, 10) },
      });
      const count = Array.isArray(stocksRes?.data?.data) ? stocksRes.data.data.length : 0;
      if (count >= 20) {
        showError("Error", "Each watchlist can have maximum 20 stocks.");
        return;
      }

      const response = await axiosInstance.post(
        `${apiUrl}/api/wishlistcontrol/add`,
        payload,
      );

      if (
        response.status === 201 ||
        response.status === 200 ||
        response.status === 409
      ) {
        const msg = response.data.message || "Added to watchlist";
        if (msg === "Added to watchlist") {
          // ✅ Trigger context refresh for real-time update
          triggerRefresh(parseInt(wishlist.id, 10));
          onWatchlistAdded?.(parseInt(wishlist.id, 10));
          // alert(`✅ ${msg}`);
        } else {
          showError("Error", msg);
        }
        closeWatchlistModal();
      } else {
        showError("Error", response.data.message || "Failed");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to add";
      showError("Error", msg);
    } finally {
      setAddingToWishlist((prev) => ({ ...prev, [wishlist.id]: false }));
    }
  };

  // Fetch watchlists when popup opens
  useEffect(() => {
    if (watchlistModalVisible) {
      fetchWatchlists();
    }
  }, [watchlistModalVisible, userId, addingToWishlist]);

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={global.colors.primary}
        barStyle="light-content"
      />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        {/* <TouchableOpacity onPress={() => navigation.navigate("ProfileScreen")}>
          <Image source={getImageSource(profileImage)} style={styles.avatar} />
        </TouchableOpacity> */}
        {/* Avatar (only if NOT showing back button) */}
        {!showBackButton && (
          <TouchableOpacity onPress={openProfileDrawer}>
            <Image
              source={getImageSource(profileImage)}
              style={styles.avatar}
            />
          </TouchableOpacity>
        )}

        {/* Back Button (only if showBackButton is true) */}
        {showBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={global.colors.background}
            />
          </TouchableOpacity>
        )}

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={16}
            color={global.colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search"
            placeholderTextColor={global.colors.textSecondary}
            style={styles.searchInput}
            value={searchText}
            onChangeText={searchFilter}
          />
          {(filtered.length > 0 || searchText.length > 0) && (
            <TouchableOpacity
              onPress={() => {
                setFiltered([]);
                setSearchText("");
                Keyboard.dismiss();
              }}
            >
              <Image
                source={CancelIcon}
                style={[styles.iconImage]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Suggestions dropdown */}
        {/* {filtered.length > 0 && (
          <View style={styles.suggestionBox}>
            <ScrollView style={{ maxHeight: 180 }}>
              {filtered.map((item) => (
                <TouchableOpacity
                  key={item.script_id}
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionSelect(item)}
                >
                  <Text style={styles.suggestionText}>
                    {item.script_name}
                    {item.script_id && ` - (${item.script_id})`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )} */}
        {filtered.length > 0 && (
          <View style={styles.dropdownWrapper}>
            <ScrollView style={styles.dropdownScroll}>
              {filtered.map((item) => (
                <TouchableOpacity
                  key={item.script_id}
                  style={styles.dropdownRow}
                >
                  {/* LEFT: Script Name */}

                  <Text
                    // onPress={() => openStockInfoDrawer(item.script_id, null, {
                    //   name: item.script_name
                    // })}
                    style={styles.dropdownText}
                    numberOfLines={1}
                  >
                    {item.exchange}
                    {item.script_id ? ` : ${item.script_id}` : ""}
                  </Text>

                  {/* RIGHT: TWO ICONS */}
                  <View style={styles.rightIcons}>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedItem(item);
                        setWatchlistModalVisible(true);
                      }}
                    >
                      <Image
                        source={watchlistIcon}
                        
                        style={styles.iconImage2}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  </View>
                  <View>
                    <TouchableOpacity
                      onPress={() => {
                        openStockInfoDrawer(item.token, item.script_id, "placeorder", item.isin, {
                          name: item.script_name,
                          tradeable: item.tradeable,
                          exchange: item.exchange
                        });
                      }}
                      // navigation.navigate("TradeOrder", {
                      //   stockSymbol: item.script_id,
                      //   stockName: item.script_name,
                      //   token: item.token,
                      // });
                    >
                      <Image
                        source={rupeeIcon}
                        style={[styles.iconImage]}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Notification Button */}
        <TouchableOpacity
          style={styles.circleButton}
          onPress={openNotificationDrawer}
        >
          <Ionicons
            name="notifications-outline"
            size={20}
            color={global.colors.background}
          />
          {/* <View style={styles.badge} /> */}
        </TouchableOpacity>

        {/* Menu Button */}
        {/* <TouchableOpacity style={styles.circleButton} onPress={showMenu}>
          <Ionicons name="menu" size={20} color="#fff" />
        </TouchableOpacity> */}
      </View>

      {/* Menu Modal */}
      {/* <Modal
        visible={menuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={hideMenu}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={hideMenu} />
          <Animated.View style={[styles.menuContainer, { opacity: fadeAnim }]}>
            {menuOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  index === menuOptions.length - 1 && styles.lastMenuItem,
                ]}
                onPress={option.action}
              >
                <Text style={styles.menuItemText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>
      </Modal> */}

      {/* 🔻 WATCHLIST POPUP — ONLY EXISTING LISTS */}
      <Modal
        transparent
        visible={watchlistModalVisible}
        animationType="fade"
        onRequestClose={closeWatchlistModal}
      >
        <Pressable
          style={styles.watchlistOverlay}
          onPress={closeWatchlistModal}
        >
          <Pressable
            style={styles.watchlistPopup}
            onStartShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}
          >
            <View style={styles.watchlistTitleBar}>
              <Text style={styles.watchlistTitleText}>Add to Watchlist</Text>
            </View>

            {loadingWatchlists ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator
                  size="small"
                  color={global.colors.secondary}
                />
              </View>
            ) : watchlists.length > 0 ? (
              <ScrollView style={{ maxHeight: 300 }}>
                {watchlists.map((wl) => (
                  <TouchableOpacity
                    key={wl.id}
                    style={[
                      styles.watchlistRow,
                      addingToWishlist[wl.id] && { opacity: 0.6 },
                    ]}
                    disabled={addingToWishlist[wl.id]}
                    onPress={() => handleAddToWatchlist(wl)}
                  >
                    <Text style={styles.watchlistRowText}>
                      {wl.name}
                      {addingToWishlist[wl.id] && (
                        <ActivityIndicator
                          size="small"
                          color={global.colors.secondary}
                          style={{ marginLeft: 8 }}
                        />
                      )}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={{ padding: 20, alignItems: "center" }}>
                <Text
                  style={{
                    color: global.colors.textSecondary,
                    textAlign: "center",
                  }}
                >
                  No watchlists found. Please create one from your profile.
                </Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: global.colors.background,
  },
  header: {
    backgroundColor: global.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: global.colors.background,
    borderRadius: 30,
    marginHorizontal: 10,
    paddingHorizontal: 10,
    elevation: 1,
    height: 35,
    position: "relative",
    zIndex: 9999,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: global.colors.textPrimary,
    paddingVertical: 0,
  },
  suggestionBox: {
    position: "absolute",
    top: 52,
    left: 60,
    width: "60%",
    backgroundColor: global.colors.background,
    borderRadius: 8,
    elevation: 8,
    zIndex: 99999,
    paddingVertical: 4,
  },
  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: global.colors.border,
  },
  suggestionText: {
    fontSize: 14,
    color: global.colors.textPrimary,
  },
  circleButton: {
    backgroundColor: global.colors.secondary,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: global.colors.error,
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: global.colors.overlay,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    marginTop: 50,
  },
  menuContainer: {
    backgroundColor: global.colors.background,
    borderRadius: 8,
    minWidth: 150,
    marginTop: 10,
    marginRight: 14,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: global.colors.border,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 16,
    color: global.colors.textPrimary,
  },

  // 🔻 Watchlist Popup Styles
  watchlistOverlay: {
    flex: 1,
    backgroundColor: global.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  watchlistPopup: {
    width: 280,
    backgroundColor: global.colors.background,
    borderRadius: 12,
    padding: 16,
    maxHeight: 400,
  },
  watchlistTitleBar: {
    marginBottom: 12,
    alignItems: "center",
  },
  watchlistTitleText: {
    fontSize: 16,
    fontWeight: "600",
  },
  watchlistRow: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: global.colors.border,
  },
  watchlistRowText: {
    fontSize: 15,
    color: global.colors.textPrimary,
  },
  dropdownWrapper: {
    position: "absolute",
    top: 90,
    left: 0,
    right: 0,
    backgroundColor: global.colors.background,
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderColor: global.colors.border,
    zIndex: 99999,
  },
  dropdownScroll: {
    maxHeight: 300,
  },
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: global.colors.border,
  },
  dropdownText: {
    fontSize: 15,
    color: global.colors.textPrimary,
    flex: 1,
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 25,
  },
  iconImage: {
    width: 20,
    height: 20,
  },
  iconImage2: {
    width: 20,
    height: 20,
    marginRight: 20,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: global.colors.secondary,
    shadowColor: global.colors.textPrimary,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 1,
    elevation: 1,
  },
});

export default FundamentalTopHeader;
