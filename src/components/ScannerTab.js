import React, { useState } from "react";
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



const ScannerTab = ({ onScannerSelect }) => {
  const [selectedScanner, setSelectedScanner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("All");

  const { sequences, loading } = useCommunitySequences(50); // Get enough sequences, though pagination might be better later

  const filterTabs = ["All", "Bullish", "Bearish", "Fundamental", "Technical"];

  const handleScannerPress = (scanner) => {
    setSelectedScanner(scanner);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedScanner(null), 300);
  };

  const renderScannerCard = ({ item }) => (
    <TouchableOpacity
      style={styles.scannerCard}
      onPress={() => handleScannerPress(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{item.icon || "📊"}</Text>
        <View style={styles.likeContainer}>
          <Ionicons name="thumbs-up-outline" size={16} color="#666" />
          <Text style={styles.likeCount}>{item.likes_count || "20.9k"}</Text>
        </View>
      </View>
      
      <Text style={styles.scannerName} numberOfLines={2}>
        {item.sequence_name || item.name}
      </Text>
      
      {/* Description hidden in list, shown in modal */}
      
      <TouchableOpacity 
        style={styles.viewScansButton}
        onPress={(e) => {
          e.stopPropagation();
          onScannerSelect && onScannerSelect(item);
        }}
      >
        <Text style={styles.viewScansText}>View Scans</Text>
        <Ionicons name="chevron-forward" size={16} color="#210F47" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#210F47" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filterTabs.map((tab) => (
            <TouchableOpacity 
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Scanners Grid */}
      <FlatList
        data={sequences}
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
                    <Ionicons name="close" size={20} color="#000" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <Text style={styles.detailsDescription}>
                    {selectedScanner.sequence_description || selectedScanner.description}
                  </Text>
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
    backgroundColor: "#fff",
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
    backgroundColor: "#f0f0f0",
  },
  activeTab: {
    backgroundColor: "#210F47",
  },
  tabText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#fff",
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
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
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
    color: "#666",
    fontWeight: "500",
  },
  scannerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  scannerDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
    lineHeight: 16,
  },
  viewScansButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  viewScansText: {
    fontSize: 12,
    color: "#210F47",
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
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    zIndex: 10,
    shadowColor: "#000",
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
    backgroundColor: "#E8E8E8",
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
    color: "#1a1a1a",
    fontSize: 14,
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 20,
    color: "#666",
    fontWeight: "600",
  },
  modalBody: {
    paddingVertical: 10,
  },
  detailsDescription: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  modalViewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#210F47",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  modalViewButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default ScannerTab;
