import React, { useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const SequencePost = ({
    title,
    content,
    timestamp,
    onNext,
    onPrev,
    showNavigation = true
}) => {
    // Local state to manage the displayed content for transition
    const [displayTitle, setDisplayTitle] = React.useState(title);
    const [displayContent, setDisplayContent] = React.useState(content);
    const [displayTimestamp, setDisplayTimestamp] = React.useState(timestamp);

    // Animation Value for Opacity
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Trigger animation when props change
    useEffect(() => {
        if (title !== displayTitle || content !== displayContent) {
            // Fade Out
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start(() => {
                // Update State to New Content
                setDisplayTitle(title);
                setDisplayContent(content);
                setDisplayTimestamp(timestamp);

                // Fade In
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }).start();
            });
        }
    }, [title, content, timestamp]);

    const timeAgo = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " mins ago";
        return Math.floor(seconds) + " seconds ago";
    };

    // Smart Truncation Helper
    const smartTruncate = (text, maxLength) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;

        // Cut at maxLength
        let truncated = text.substr(0, maxLength);

        // Find last space to avoid cutting word in half
        const lastSpaceIndex = truncated.lastIndexOf(' ');
        if (lastSpaceIndex > 0) {
            truncated = truncated.substr(0, lastSpaceIndex);
        }

        return truncated + '...';
    };

    return (
        <View style={styles.analysisContainer}>
            <View style={styles.analysisHeader}>
                <Animated.Text style={[styles.analysisTitle, { opacity: fadeAnim }]}>
                    {displayTitle}
                </Animated.Text>
            </View>

            <Animated.View style={{ opacity: fadeAnim }}>
                <Text style={styles.analysisText}>
                    {smartTruncate(displayContent, 90)}
                </Text>

                {/* Bottom Row: Date Left, Nav Right */}
                <View style={styles.bottomRow}>
                    <Text style={styles.timestampText}>{timeAgo(displayTimestamp)}</Text>

                    {showNavigation && (
                        <View style={styles.chevronGroup}>
                            <TouchableOpacity style={styles.navButton} onPress={onPrev}>
                                <ChevronLeft size={16} color={global.colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.navButton} onPress={onNext}>
                                <ChevronRight size={16} color={global.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </Animated.View>
        </View>
    );
};

export default SequencePost;

const styles = StyleSheet.create({
    analysisContainer: {
        marginBottom: 0,
        backgroundColor: global.colors.background,
        paddingHorizontal: 15,
        paddingBottom: 15
    },
    analysisHeader: {
        marginBottom: 8,
    },
    analysisTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: global.colors.textPrimary,
    },
    analysisText: {
        fontSize: 14,
        color: global.colors.textPrimary,
        lineHeight: 20, // Improved line height for readability
        marginBottom: 10,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    timestampText: {
        fontSize: 12,
        color: global.colors.disabled,
    },
    chevronGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    navButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: global.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
});