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
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCommunitySequences } from "../hooks/useCommunitySequences";
import { useScanCounts, useScanTypes, useBookmarks, useToggleBookmark, useWatchlists } from "../hooks/useScansResult";
import GlobalTopMenu from "./GlobalTopMenu";

const ScannerTab = ({ onScannerSelect, onWatchlistSelect }) => {
  const [activeTab, setActiveTab] = useState("All");

  const { sequences, loading: sequencesLoading, refetch: refetchSequences, isFetching: isFetchingSequences } = useCommunitySequences(50);
  const { data: watchlists = [], isLoading: watchlistsLoading, refetch: refetchWatchlists, isFetching: isFetchingWatchlists } = useWatchlists();
  const { scanCounts, isLoading: countsLoading, isFetching: isFetchingCounts } = useScanCounts(sequences);
  const { data: scanTypes = [], isLoading: scanTypesLoading, refetch: refetchScanTypes, isFetching: isFetchingScanTypes } = useScanTypes();
  const { data: bookmarkedIds = [], refetch: refetchBookmarks, isFetching: isFetchingBookmarks } = useBookmarks();
  const toggleBookmarkMutation = useToggleBookmark();

  const isRefreshing = isFetchingSequences || isFetchingWatchlists || isFetchingCounts || isFetchingScanTypes || isFetchingBookmarks;

  const onRefresh = React.useCallback(async () => {
    await Promise.all([refetchSequences(), refetchWatchlists(), refetchScanTypes(), refetchBookmarks()]);
  }, [refetchSequences, refetchWatchlists, refetchScanTypes, refetchBookmarks]);

  const filterTabs = React.useMemo(() => [
    "All",
    "My Scans",
    ...(Array.isArray(scanTypes) ? scanTypes.map(type => type.name) : [])
  ], [scanTypes]);

  const handleScannerPress = (scanner) => {
    if (scanner.isWatchlist) {
      onWatchlistSelect && onWatchlistSelect(scanner);
    } else {
      onScannerSelect && onScannerSelect(scanner);
    }
  };

  const renderScannerCard = ({ item }) => {
    if (item.isWatchlist) {
      return (
        <TouchableOpacity
          style={styles.scannerCard}
          onPress={() => handleScannerPress(item)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="list" size={16} color="#FFF" />
              </View>
              <View style={styles.titleContainer}>
                <Text style={styles.scannerName}>{item.name}</Text>
                <Text style={styles.cardAuthor}>User Watchlist</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    const isBookmarked = bookmarkedIds.includes(item.id);
    const isPremium = item.premium_category === 1 || item.premium_category === "1" || item.premium_category === true;

    const handleToggleBookmark = (e) => {
      e.stopPropagation();
      toggleBookmarkMutation.mutate({ scanId: item.id });
    };

    return (
      <TouchableOpacity
        style={styles.scannerCard}
        onPress={() => handleScannerPress(item)}
      >
        {/* Top Row: Avatar, Title/Author, Bookmark */}
        <View style={[styles.cardHeader, isPremium ? { marginTop: 12 } : null]}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="trending-up" size={16} color="#FFF" />
              </View>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.scannerName} numberOfLines={2}>
                {item.sequence_name || item.name || "Strategy Name"}
              </Text>
            </View>
          </View>

            <TouchableOpacity
              style={styles.bookmarkButton}
              onPress={handleToggleBookmark}
              disabled={toggleBookmarkMutation.isPending}
            >
              <Ionicons
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={20}
                color={isBookmarked ? global.colors.secondary : global.colors.textPrimary}
              />
            </TouchableOpacity>
        </View>

        {/* Bottom Row: Tags, Deploy */}
        <View style={styles.cardBottomRow}>
          <View style={styles.tagsRow}>
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>{item.scan_class}</Text>
            </View>
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>{item.scan_direction}</Text>
            </View>
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>{item.scan_timeframe}</Text>
            </View>
          </View>
        </View>
        <View style={styles.likescanscount}>
          {/* Add here badge */}
     
          {/* <View style={styles.bookmarkButton}>
              <Ionicons name="thumbs-up-outline" size={16} color={global.colors.textSecondary} />
              <Text style={styles.likeCount}>{item.likes_count || "20.9k"}</Text>
          </View> */}
          <TouchableOpacity
            style={styles.deployPill}
            onPress={(e) => {
              e.stopPropagation();
              onScannerSelect && onScannerSelect(item);
            }}
          >
            <Text style={styles.viewScansText}>{scanCounts[item.id] !== undefined ? scanCounts[item.id] : (item.likes_count || "0")} Stocks</Text>
            {/* <Ionicons name="chevron-forward" size={10} color={global.colors.secondary}/>  */}
          </TouchableOpacity>
        </View>
           {isPremium && (
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeText}>Premium</Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  // Determine which data to display based on active tab
  const displayData = React.useMemo(() => {
    if (!sequences) return [];

    if (activeTab === "All") return [ ...sequences];

    // if (activeTab === "Watchlist") return watchlists;

    if (activeTab === "My Scans") {
      return (sequences || []).filter(seq => (bookmarkedIds || []).includes(seq.id));
    }

    // Find the scan_class corresponding to the active tab name
    const selectedType = Array.isArray(scanTypes) ? scanTypes.find(t => t.name === activeTab) : null;
    const filterClass = selectedType ? (selectedType.scan_type || selectedType.name) : activeTab;

    return (sequences || []).filter(seq => {
      if (!seq.scan_type) return false;
      return seq.scan_type.toString().toLowerCase() === filterClass.toString().toLowerCase();
    });
  }, [sequences, activeTab, bookmarkedIds, scanTypes]);

  const isLoadingData = sequencesLoading || watchlistsLoading || scanTypesLoading;

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
        type="primary"
      />

      {/* Scanners Grid */}
      <FlatList
        data={displayData}
        renderItem={renderScannerCard}
        keyExtractor={(item) => (item.id || item.wishlist_id || Math.random()).toString()}
        numColumns={1}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[global.colors.secondary]} />
        }
      />
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
    color: global.colors.textSecondary,
    fontWeight: "500",
  },
  activeTabText: {
    color: global.colors.textPrimary,
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
    backgroundColor: global.colors.background,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: global.colors.border,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  cardBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: global.colors.secondary, // Same as COLORS.red in modal.js
    borderTopRightRadius: 20, // Match scannerCard border radius
    borderBottomLeftRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 10,
  },
  cardBadgeText: {
    color: '#FFFFFF', // Same as COLORS.white in modal.js
    fontWeight: '700',
    fontSize: 10,
  },
  cardHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerLeft: {
    width: "80%",
    flexDirection: "row",
    flex: 1,
    flexBasis: "wrap",
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: "#2C3E50",
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    justifyContent: "flex-start",
  },
  scannerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  cardAuthor: {
    fontSize: 14,
    color: "#777",
  },
  bookmarkButton: {
    gap: 4,
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  cardMiddleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  // minAmountRow: {
  //   flexDirection: "row",
  //   alignItems: "center",
  // },
  // minAmountLabel: {
  //   fontSize: 14,
  //   color: "#777",
  // },
  // minAmountValue: {
  //   fontSize: 16,
  //   fontWeight: "700",
  //   color: "#333",
  // },
  backtestPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A0B3C",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backtestText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
    marginRight: 4,
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  likescanscount: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  tagsRow: {
    flexDirection: "row",
    flex: 1,
    gap: 4,
  },
  tagPill: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
  },
  tagText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  deployPill: {
    backgroundColor: "#E8E6ED",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewScansText: {
    fontSize: 12,
    marginRight: 4,
    color: "#333",
    fontWeight: "600",
  },

  deployText: {
    color: "#555",
    fontWeight: "700",
    fontSize: 14,
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
