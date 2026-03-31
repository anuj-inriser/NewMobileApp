import React from 'react';
import {
  Modal,
  StyleSheet,
  View,
} from 'react-native';
import ModalScreen from '../screens/modal';

const PromoPopup = ({ visible, onClose }) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.modalContainer}>
        {/* Render the ModalScreen (Premium Features) */}
        <ModalScreen onBack={onClose} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
});

export default PromoPopup;
