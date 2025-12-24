import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';

const SequencePostCard = ({ post, index, total, timeframe, onTimeframeChange }) => {
    return (
        <View style={styles.card}>
            {/* Header: Script Name and Price */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.scriptName}>{post.scriptName || 'Reliance Limited'}</Text>
                    <Text style={styles.scriptSymbol}>{post.scriptSymbol || 'RELIANCE'}</Text>
                </View>
                <View style={styles.priceContainer}>
                    <Text style={styles.price}>₹{post.price || '430.92'}</Text>
                    <Text style={[styles.change, { color: '#4CAF50' }]}>+45.30 (11.77%)</Text>
                </View>
            </View>

            {/* Chart Container (Placeholder) */}
            <View style={styles.chartContainer}>
                {/* Progress Bubble Overlay */}
                <View style={styles.progressBubble}>
                    <Text style={styles.progressText}>{index + 1 < 10 ? `0${index + 1}` : index + 1}/{total < 10 ? `0${total}` : total}</Text>
                </View>

                <View style={styles.chartPlaceholder}>
                    <MaterialCommunityIcons name="chart-line" size={100} color="#E0E0E0" />
                    <Text style={styles.chartHint}>Trading View Chart Placeholder</Text>
                </View>

                {/* Timeframe Selectors */}
                <View style={styles.timeframeContainer}>
                    {['1m', '5m', '30m', '1h', '4h', 'D', 'W', 'M'].map((tf) => (
                        <TouchableOpacity
                            key={tf}
                            style={[styles.tfButton, timeframe === tf && styles.tfActive]}
                            onTimeframeChange={() => onTimeframeChange?.(tf)}
                        >
                            <Text style={[styles.tfText, timeframe === tf && styles.tfTextActive]}>{tf}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Market Analysis Section */}
            <View style={styles.analysisSection}>
                <View style={styles.analysisHeader}>
                    <Text style={styles.analysisTitle}>Market Analysis</Text>
                    <View style={styles.navButtons}>
                        <TouchableOpacity style={styles.navBtn}><Ionicons name="arrow-back" size={18} color="#666" /></TouchableOpacity>
                        <TouchableOpacity style={styles.navBtn}><Ionicons name="arrow-forward" size={18} color="#666" /></TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.analysisContent}>
                    {post.content || 'Stocks continue upward trend as investors show confidence amid strong earnings reports.'}
                </Text>
                <Text style={styles.timestamp}>2 min ago</Text>
            </View>

            {/* Footer Interactive */}
            <View style={styles.footer}>
                <View style={styles.footerLeft}>
                    <TouchableOpacity style={styles.actionBtn}><Feather name="thumbs-up" size={18} color="#666" /><Text style={styles.actionCount}>20.9k</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}><Feather name="thumbs-down" size={18} color="#666" /></TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}><Feather name="message-circle" size={18} color="#666" /><Text style={styles.actionCount}>23</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}><Feather name="share-2" size={18} color="#666" /></TouchableOpacity>
                </View>
                <View style={styles.footerRight}>
                    <TouchableOpacity style={styles.iconCircle}><MaterialCommunityIcons name="currency-inr" size={16} color="#666" /></TouchableOpacity>
                    <TouchableOpacity style={styles.iconCircle}><MaterialCommunityIcons name="clock-outline" size={16} color="#666" /></TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        marginVertical: 10,
        marginHorizontal: 16,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    scriptName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#210F47',
    },
    scriptSymbol: {
        fontSize: 12,
        color: '#888',
        textTransform: 'uppercase',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    price: {
        fontSize: 18,
        fontWeight: '700',
        color: '#210F47',
    },
    change: {
        fontSize: 12,
        fontWeight: '600',
    },
    chartContainer: {
        position: 'relative',
        height: 250,
        backgroundColor: '#F9F9FB',
        borderRadius: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F0EFFF',
    },
    chartPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartHint: {
        color: '#BBB',
        fontSize: 12,
        marginTop: 10,
    },
    progressBubble: {
        position: 'absolute',
        right: 12,
        top: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 10,
        paddingVertical: 15,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        zIndex: 10,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#210F47',
    },
    timeframeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F0EFFF',
    },
    tfButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    tfActive: {
        backgroundColor: '#F0EFFF',
    },
    tfText: {
        fontSize: 11,
        color: '#666',
    },
    tfTextActive: {
        color: '#210F47',
        fontWeight: '700',
    },
    analysisSection: {
        marginTop: 15,
    },
    analysisHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    analysisTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#210F47',
    },
    navButtons: {
        flexDirection: 'row',
    },
    navBtn: {
        marginLeft: 10,
        backgroundColor: '#F0EFFF',
        padding: 4,
        borderRadius: 15,
    },
    analysisContent: {
        fontSize: 13,
        color: '#555',
        lineHeight: 18,
    },
    timestamp: {
        fontSize: 10,
        color: '#AAA',
        textAlign: 'right',
        marginTop: 4,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
    },
    actionCount: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    footerRight: {
        flexDirection: 'row',
    },
    iconCircle: {
        marginLeft: 10,
        padding: 6,
        borderRadius: 20,
        backgroundColor: '#F9F9FB',
    }
});

export default SequencePostCard;
