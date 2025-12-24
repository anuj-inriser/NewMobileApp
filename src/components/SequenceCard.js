import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SequenceCard = ({ item, onPlay }) => {
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Ionicons
                    key={i}
                    name={i <= rating ? "star" : "star-outline"}
                    size={14}
                    color="#FF9800"
                    style={{ marginRight: 2 }}
                />
            );
        }
        return stars;
    };

    return (
        <View style={styles.card}>
            <View style={styles.container}>
                <View style={styles.mainContent}>
                    {/* Headline */}
                    <Text style={styles.title} numberOfLines={expanded ? undefined : 2}>
                        {item.title}
                    </Text>

                    {/* Description (Expanded Only) */}
                    {expanded && (
                        <Text style={styles.description}>
                            {item.description}
                        </Text>
                    )}

                    {/* Rating Row */}
                    <View style={styles.ratingRow}>
                        {renderStars(item.rating || 4)}
                        <Text style={styles.ratingCount}>({item.ratingCount || 45})</Text>
                    </View>
                </View>

                {/* Side Actions */}
                <View style={styles.sideActions}>
                    <TouchableOpacity style={styles.chevronContainer} onPress={toggleExpand}>
                        <Ionicons
                            name={expanded ? "chevron-up" : "chevron-down"}
                            size={18}
                            color="#333"
                        />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => onPlay?.(item)}>
                        <Ionicons name="play-circle" size={24} color="#333" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="bookmark-outline" size={22} color="#333" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#EFEFEF',
        // Shadow for better depth
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    container: {
        flexDirection: 'row',
        padding: 16,
    },
    mainContent: {
        flex: 1,
        paddingRight: 12,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A1A1A',
        lineHeight: 22,
        marginBottom: 8,
    },
    description: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
        marginBottom: 12,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 'auto',
    },
    ratingCount: {
        fontSize: 12,
        color: '#888',
        marginLeft: 4,
    },
    sideActions: {
        alignItems: 'center',
        justifyContent: 'space-between',
        width: 32,
    },
    chevronContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F7F7F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
    },
    actionButton: {
        marginTop: 10,
    },
});

export default SequenceCard;
