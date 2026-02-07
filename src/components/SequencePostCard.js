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
                    <Text style={[styles.change, { color: global.colors.success }]}>+45.30 (11.77%)</Text>
                </View>
            </View>

            {/* Chart Container (Placeholder) */}
            <View style={styles.chartContainer}>
                {/* Progress Bubble Overlay */}
                <View style={styles.progressBubble}>
                    <Text style={styles.progressText}>{index + 1 < 10 ? `0${index + 1}` : index + 1}/{total < 10 ? `0${total}` : total}</Text>
                </View>

                <View style={styles.chartPlaceholder}>
                    <MaterialCommunityIcons name="chart-line" size={100} color={global.colors.disabled} />
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
                        <TouchableOpacity style={styles.navBtn}><Ionicons name="arrow-back" size={18} color={global.colors.textSecondary} /></TouchableOpacity>
                        <TouchableOpacity style={styles.navBtn}><Ionicons name="arrow-forward" size={18} color={global.colors.textSecondary} /></TouchableOpacity>
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
                    <TouchableOpacity style={styles.actionBtn}><Feather name="thumbs-up" size={18} color={global.colors.textSecondary} /><Text style={styles.actionCount}>20.9k</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}><Feather name="thumbs-down" size={18} color={global.colors.textSecondary} /></TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}><Feather name="message-circle" size={18} color={global.colors.textSecondary} /><Text style={styles.actionCount}>23</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}><Feather name="share-2" size={18} color={global.colors.textSecondary} /></TouchableOpacity>
                </View>
                <View style={styles.footerRight}>
                    <TouchableOpacity style={styles.iconCircle}><MaterialCommunityIcons name="currency-inr" size={16} color={global.colors.textSecondary} /></TouchableOpacity>
                    <TouchableOpacity style={styles.iconCircle}><MaterialCommunityIcons name="clock-outline" size={16} color={global.colors.textSecondary} /></TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: global.colors.background,
        borderRadius: 20,
        marginVertical: 10,
        marginHorizontal: 16,
        padding: 16,
        elevation: 2,
        shadowColor: global.colors.textPrimary,
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
        color: global.colors.secondary,
    },
    scriptSymbol: {
        fontSize: 12,
        color: global.colors.disabled,
        textTransform: 'uppercase',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    price: {
        fontSize: 18,
        fontWeight: '700',
        color: global.colors.secondary,
    },
    change: {
        fontSize: 12,
        fontWeight: '600',
    },
    chartContainer: {
        position: 'relative',
        height: 250,
        backgroundColor: global.colors.surface,
        borderRadius: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: global.colors.border,
    },
    chartPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartHint: {
        color: global.colors.disabled,
        fontSize: 12,
        marginTop: 10,
    },
    progressBubble: {
        position: 'absolute',
        right: 12,
        top: '50%',
        backgroundColor: global.colors.secondary,
        paddingHorizontal: 10,
        paddingVertical: 15,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: global.colors.border,
        zIndex: 10,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '700',
        color: global.colors.secondary,
    },
    timeframeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 8,
        backgroundColor: global.colors.background,
        borderTopWidth: 1,
        borderTopColor: global.colors.border,
    },
    tfButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    tfActive: {
        backgroundColor: global.colors.surface,
    },
    tfText: {
        fontSize: 11,
        color: global.colors.textSecondary,
    },
    tfTextActive: {
        color: global.colors.secondary,
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
        color: global.colors.secondary,
    },
    navButtons: {
        flexDirection: 'row',
    },
    navBtn: {
        marginLeft: 10,
        backgroundColor: global.colors.surface,
        padding: 4,
        borderRadius: 15,
    },
    analysisContent: {
        fontSize: 13,
        color: global.colors.textSecondary,
        lineHeight: 18,
    },
    timestamp: {
        fontSize: 10,
        color: global.colors.disabled,
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
        borderTopColor: global.colors.border,
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
        color: global.colors.textSecondary,
        marginLeft: 4,
    },
    footerRight: {
        flexDirection: 'row',
    },
    iconCircle: {
        marginLeft: 10,
        padding: 6,
        borderRadius: 20,
        backgroundColor: global.colors.surface,
    }
});

export default SequencePostCard;