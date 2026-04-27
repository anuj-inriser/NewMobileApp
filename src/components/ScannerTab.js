import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCommunitySequences } from "../hooks/useCommunitySequences";
import GlobalTopMenu from "./GlobalTopMenu";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "../api/axios";
import { apiUrl } from "../utils/apiUrl";

const ScannerTab = ({ onScannerSelect, onWatchlistSelect  }) => {
  const [selectedScanner, setSelectedScanner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("All");

  const { sequences, loading } = useCommunitySequences(50); // Get enough sequences, though pagination might be better later

   // Watchlist state
  const [watchlists, setWatchlists] = useState([]);
  const [watchlistsLoading, setWatchlistsLoading] = useState(false);

  const filterTabs = ["All", "Bullish", "Bearish", "Fundamental", "Technical", "Watchlist"];

  // Fetch watchlists
  useEffect(() => {
    const fetchWatchlists = async () => {
      try {
        setWatchlistsLoading(true);
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
          setWatchlistsLoading(false);
          return;
        }

        const res = await axiosInstance.get(`${apiUrl}/api/wishlistcontrol`, {
          params: { user_id: userId }
        });
        const listData = res?.data?.data || [];
        setWatchlists(
          listData.map((item) => ({
            id: item.wishlist_id,
            name: item.wishlist_name,
            user: item.user_id,
            isWatchlist: true // Flag to identify watchlist items
          }))
        );
      } catch (err) {
        console.error("Error fetching watchlists:", err);
      } finally {
        setWatchlistsLoading(false);
      }
    };

    fetchWatchlists();
  }, []);

  const handleScannerPress = (scanner) => {
    setSelectedScanner(scanner);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedScanner(null), 300);
  };

  const renderScannerCard = ({ item }) => {
    const isWatchlist = item.isWatchlist;
    return(
    <TouchableOpacity
      style={styles.scannerCard}
      onPress={() => handleScannerPress(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{isWatchlist ? "📁" : item.icon || "📊"}</Text>
        {!isWatchlist && (
        <View style={styles.likeContainer}>
          <Ionicons name="thumbs-up-outline" size={16} color={global.colors.textSecondary} />
          <Text style={styles.likeCount}>{item.likes_count || "20.9k"}</Text>
        </View>
          )}
             {isWatchlist && (
            <Ionicons name="bookmark" size={20} color={global.colors.secondary} />
          )}
      </View>
      
      <Text style={styles.scannerName} numberOfLines={2}>
        {item.sequence_name || item.name}
      </Text>
      
      {/* Description hidden in list, shown in modal */}
      
      <TouchableOpacity 
        style={styles.viewScansButton}
        onPress={(e) => {
          e.stopPropagation();
      if (isWatchlist) {
              onWatchlistSelect && onWatchlistSelect(item);
            } else {
              onScannerSelect && onScannerSelect(item);
            }
        }}
      >
        <Text style={styles.viewScansText}> {isWatchlist ? "View Watchlist" : "View Scans"}</Text>
        <Ionicons name="chevron-forward" size={16} color={global.colors.secondary}/>
      </TouchableOpacity>
    </TouchableOpacity>
  )};

    // Determine which data to display based on active tab
  const displayData = activeTab === "Watchlist" ? watchlists : sequences;
  const isLoadingData = activeTab === "Watchlist" ? watchlistsLoading : loading;
  
  if (isLoadingData) {
    return (
      <View style={[styles.container, styles.center]}>
          <ActivityIndicator size="large" color={global.colors.secondary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <GlobalTopMenu
        tabs={filterTabs.map(tab => ({ id: tab, name: tab }))}
        activeTab={{ id: activeTab }}
        onTabChange={(tab) => setActiveTab(tab.id)}
        showFilter={false}
        type="secondary"
      />

      {/* Scanners Grid */}
      <FlatList
        data={displayData}
        renderItem={renderScannerCard}
        keyExtractor={(item) => (item.id || Math.random()).toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Details Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.overlayBackground}
            onPress={closeModal}
            activeOpacity={1}
          />
          
          <View style={styles.modalContent}>
            {selectedScanner && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Details</Text>
                  <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                     <Ionicons name="close" size={20} color={global.colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <Text style={styles.detailsDescription}>
                    {selectedScanner.sequence_description || selectedScanner.description}
                  </Text>
                  {selectedScanner.trigger_time && (
                    <View style={{ marginTop: 15, flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="time-outline" size={18} color={global.colors.textSecondary} />
                      <Text style={[styles.detailsDescription, { marginLeft: 8, fontWeight: '600' }]}>
                        Trigger Time: {selectedScanner.trigger_time}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
        backgroundColor: global.colors.background,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  tabContainer: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: global.colors.surface,
  },
  activeTab: {
    backgroundColor: global.colors.surface,
    elevation: 4,
    shadowColor: global.colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  tabText: {
    fontSize: 14,
    color:global.colors.textSecondary,
    fontWeight: "500",
  },
  activeTabText: {
    color:global.colors.textPrimary,
    fontWeight: "700"
  },
  gridContainer: {
    padding: 12,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  scannerCard: {
    width: "48%",
    backgroundColor: global.colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
        borderColor: global.colors.border,
    shadowColor: global.colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 32,
  },
  likeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  likeCount: {
    fontSize: 12,
        color: global.colors.textSecondary,
    fontWeight: "500",
  },
  scannerName: {
    fontSize: 16,
    fontWeight: "700",
    color: global.colors.textPrimary,
    marginBottom: 4,
  },
  scannerDescription: {
    fontSize: 12,
    color: global.colors.textSecondary,
    marginBottom: 12,
    lineHeight: 16,
  },
  viewScansButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: global.colors.surface,
    borderRadius: 8,
  },
  viewScansText: {
    fontSize: 12,
    color: global.colors.secondary,
    fontWeight: "600",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: global.colors.overlay,
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: global.colors.background,
    borderRadius: 20,
    padding: 24,
    zIndex: 10,
    shadowColor: global.colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: global.colors.border,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: -24,
    marginTop: -24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  modalTitle: {
    fontWeight: "600",
    color: global.colors.textPrimary,
    fontSize: 14,
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 20,
    color: global.colors.textSecondary,
    fontWeight: "600",
  },
  modalBody: {
    paddingVertical: 10,
  },
  detailsDescription: {
    fontSize: 14,
        color: global.colors.textSecondary,
    lineHeight: 20,
  },
  modalViewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: global.colors.secondary,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  modalViewButtonText: {
    color: global.colors.background,
    fontWeight: "600",
    fontSize: 14,
  },
});

export default ScannerTab;
