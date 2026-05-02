import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import TextInput from "./TextInput";
import Calendar from "../../assets/calendar.png";
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiUrl } from '../utils/apiUrl';

const ManualEntryModal = ({ visible, onClose, data, onChange, onSave }) => {
    const [show, setShow] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    useEffect(() => {
        if (!visible) {
            setSuggestions([]);
        }
    }, [visible]);

    const onDateChange = (event, selectedDate) => {
        setShow(false);
        if (selectedDate) {
            onChange('purchaseDate', selectedDate);
        }
    }

    const searchStocks = async (query) => {
        onChange('script', query);
        
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }

        try {
            setLoadingSuggestions(true);
            const response = await fetch(`${apiUrl}/api/internaltoken/search?q=${query}`);
            const json = await response.json();
            if (json.status) {
                setSuggestions(json.data);
            }
        } catch (error) {
            console.error("Search Error:", error);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const handleSelectStock = (item) => {
        onChange('script', item.symbol);
        onChange('exchange', item.exch_seg);
        setSuggestions([]);
    };


    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.formContainer}>
                    <View style={styles.formHeader}>
                        <Text style={styles.formTitle}>{data.id ? 'Edit Holding' : 'Add Holding'}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={global.colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Stock name</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="e.g. RELIANCE"
                                value={data.script}
                                onChangeText={searchStocks}
                            />
                            {loadingSuggestions && (
                                <ActivityIndicator size="small" color={global.colors.secondary} style={styles.loader} />
                            )}
                            {suggestions.length > 0 && (
                                <View style={styles.suggestionsContainer}>
                                    {suggestions.map((item, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.suggestionItem}
                                            onPress={() => handleSelectStock(item)}
                                        >
                                            <View style={styles.suggestionMain}>
                                                <Text style={styles.suggestionSymbol}>{item.symbol}</Text>
                                                <Text style={styles.suggestionExch}>{item.exch_seg}</Text>
                                            </View>
                                            <Text style={styles.suggestionName} numberOfLines={1}>{item.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Purchase Date</Text>
                            <TouchableOpacity
                                style={styles.datepickerinputBox}
                                onPress={() => setShow(true)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.inputText}>
                                    {data.purchaseDate instanceof Date
                                        ? data.purchaseDate.toLocaleDateString("en-IN")
                                        : "Select Purchase Date"}
                                </Text>
                                <Image source={Calendar} style={styles.iconSmall} />
                            </TouchableOpacity>
                        </View>


                        {show && (
                            <DateTimePicker
                                value={data.purchaseDate instanceof Date ? data.purchaseDate : new Date()}
                                mode="date"
                                display="calendar"
                                maximumDate={new Date()}
                                onChange={onDateChange}
                            />
                        )}

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Quantity</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="0"
                                keyboardType="numeric"
                                value={data.quantity}
                                onChangeText={(val) => onChange('quantity', val)}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Average Buy Price</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="0.00"
                                keyboardType="numeric"
                                value={data.avgPrice}
                                onChangeText={(val) => onChange('avgPrice', val)}
                            />
                        </View>
                    </ScrollView>

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={onSave}
                    >
                        <Text style={styles.saveButtonText}>Save Holding</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    formContainer: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        maxHeight: '80%',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,
    },
    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        paddingBottom: 15,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#210F47',
    },
    formScroll: {
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 15,
        position: 'relative',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666666',
        marginBottom: 8,
    },
    formInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333333',
        backgroundColor: '#F9FAFB',
    },
    datepickerinputBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#F9FAFB',
    },
    inputText: {
        fontSize: 16,
        color: '#333333',
    },
    iconSmall: {
        width: 20,
        height: 20,
    },
    loader: {
        position: 'absolute',
        right: 15,
        top: 40,
    },
    suggestionsContainer: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        marginTop: 5,
        maxHeight: 200,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        zIndex: 1000,
    },
    suggestionItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    suggestionMain: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    suggestionSymbol: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#210F47',
    },
    suggestionName: {
        fontSize: 12,
        color: '#666666',
    },
    suggestionExch: {
        fontSize: 10,
        fontWeight: 'bold',
        color: global.colors.secondary,
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    selectedExchangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        backgroundColor: '#F3F4F6',
        padding: 10,
        borderRadius: 8,
    },
    selectedExchangeLabel: {
        fontSize: 13,
        color: '#666666',
        fontWeight: '500',
    },
    selectedExchangeValue: {
        fontSize: 13,
        color: '#210F47',
        fontWeight: '700',
    },
    saveButton: {
        backgroundColor: '#210F47',
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ManualEntryModal;