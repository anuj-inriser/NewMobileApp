import React, { useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const SequencePost = ({
    title = "Market Analysis",
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
        // console.log(`[SequencePost Effect] Title Changed: "${title}" vs Display: "${displayTitle}"`);
        if (title !== displayTitle || content !== displayContent) {
            console.log(`[SequencePost Animation] Starting Fade Out for new title: "${title}"`);
            // Fade Out
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start(() => {
                console.log(`[SequencePost Animation] Fade Out Done. Updating State.`);
                // Update State to New Content
                setDisplayTitle(title);
                setDisplayContent(content);
                setDisplayTimestamp(timestamp);

                // Fade In
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }).start(() => console.log(`[SequencePost Animation] Fade In Done.`));
            });
        }
    }, [title, content, timestamp]);

    const timeAgo = (dateString) => {
        if (!dateString) return 'Just now';
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

    return (
        <View style={styles.analysisContainer}>
            <View style={styles.analysisHeader}>
                <Animated.Text style={[styles.analysisTitle, { opacity: fadeAnim }]}>
                    {displayTitle}
                </Animated.Text>
                {showNavigation && (
                    <View style={styles.chevronGroup}>
                        <TouchableOpacity style={styles.navButton} onPress={onPrev}>
                            <ChevronLeft size={16} color="#666" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.navButton} onPress={onNext}>
                            <ChevronRight size={16} color="#666" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
            <Animated.View style={{ opacity: fadeAnim }}>
                <Text style={styles.analysisText}>{displayContent}</Text>
                <Text style={styles.timestampText}>{timeAgo(displayTimestamp)}</Text>
            </Animated.View>
        </View>
    );
};

export default SequencePost;

const styles = StyleSheet.create({
    analysisContainer: {
        marginBottom: 0,
        backgroundColor: "#fff",
        paddingHorizontal: 15,
        paddingBottom: 15
    },
    analysisHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        position: 'relative', // Context for absolute positioning
    },
    analysisTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#000',
        paddingRight: 80,
    },
    chevronGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 10,
    },
    navButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F5F5F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    analysisText: {
        fontSize: 14,
        color: '#444',
        lineHeight: 14,
        marginBottom: 3,
    },
    timestampText: {
        fontSize: 12,
        color: '#999',
        alignSelf: 'flex-end',
        marginTop: 2
    },
});
