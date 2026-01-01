import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    FlatList,
    TextInput,
    Image,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Animated,
    Alert
} from 'react-native';
import { X, Send, MoreVertical, Trash2, Edit2, Check } from 'lucide-react-native'; // Added icons
import axios from 'axios';
import { apiUrl } from '../utils/apiUrl';
import { useAuth } from '../context/AuthContext';

const { height } = Dimensions.get('window');

const CommentOverlay = ({ visible, onClose, contentId, contentType = 'post', onCommentAdded, onCommentDeleted }) => {
    const { userId, user } = useAuth();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const slideAnim = useRef(new Animated.Value(height)).current;

    // Edit/Delete State
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [menuVisibleId, setMenuVisibleId] = useState(null);

    useEffect(() => {
        if (visible) {
            fetchComments();
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                damping: 20,
                mass: 1,
                stiffness: 100,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: height,
                duration: 250,
                useNativeDriver: true
            }).start();
        }
    }, [visible]);

    const fetchComments = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const res = await axios.get(`${apiUrl}/api/comments/content/${contentId}`);
            if (res.data.status) {
                setComments(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch comments", error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!text.trim() || !userId) return;

        if (editingCommentId) {
            handleUpdateComment();
            return;
        }

        const newComment = {
            id: Date.now(),
            content_id: contentId,
            comment_user_id: userId,
            comment: text,
            created_at: new Date().toISOString(),
            user_name: user?.name || "Me",
            user_image: user?.profile_pic || user?.userimage || null
        };

        setComments([newComment, ...comments]);
        if (onCommentAdded) onCommentAdded();
        const commentToSend = text;
        setText('');
        setSending(true);

        try {
            await axios.post(`${apiUrl}/api/comments`, {
                content_id: contentId,
                content_type: contentType,
                comment_user_id: userId,
                comment: commentToSend,
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString('en-GB')
            });
            fetchComments(false); // Silent refresh
        } catch (error) {
            console.error("Failed to send comment", error);
            alert("Failed to send comment");
        } finally {
            setSending(false);
        }
    };

    const handleUpdateComment = async () => {
        if (!editingCommentId || !text.trim()) return;

        const originalComments = [...comments];
        const updatedComments = comments.map(c =>
            c.id === editingCommentId ? { ...c, comment: text, updated_at: new Date().toISOString() } : c
        );
        setComments(updatedComments);
        setSending(true);

        try {
            await axios.put(`${apiUrl}/api/comments/${editingCommentId}`, {
                comment: text,
                comment_user_id: userId // verify ownership in backend if needed
            });
            setText('');
            setEditingCommentId(null);
            fetchComments(false); // Silent refresh
        } catch (error) {
            console.error("Failed to update comment", error);
            alert("Failed to update comment");
            setComments(originalComments);
        } finally {
            setSending(false);
        }
    };

    const handleDeleteComment = async (id) => {
        Alert.alert(
            "Delete Comment",
            "Are you sure you want to delete this comment?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const originalComments = [...comments];
                        setComments(comments.filter(c => c.id !== id));
                        try {
                            await axios.delete(`${apiUrl}/api/comments/${id}`);
                            if (onCommentDeleted) onCommentDeleted();
                            fetchComments(false); // Silent refresh
                        } catch (error) {
                            console.error("Failed to delete comment", error);
                            alert("Failed to delete comment");
                            setComments(originalComments);
                        }
                    }
                }
            ]
        );
    };

    const startEditing = (comment) => {
        setText(comment.comment);
        setEditingCommentId(comment.id);
        setMenuVisibleId(null);
    };

    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: height,
            duration: 250,
            useNativeDriver: true,

        }).start(() => onClose());
    };

    const renderItem = ({ item }) => {
        const displayDate = (item.updated_at && new Date(item.updated_at) > new Date(item.created_at))
            ? item.updated_at
            : item.created_at;
        const timeString = new Date(displayDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isMyComment = item.comment_user_id == userId;

        return (
            <View style={styles.commentItem}>
                <Image
                    source={{ uri: item.user_image || 'https://via.placeholder.com/40' }}
                    style={styles.avatar}
                />
                <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.userName}>{item.user_name || `User ${item.comment_user_id}`}</Text>
                            <Text style={styles.time}>{timeString}</Text>
                            {item.updated_at && new Date(item.updated_at) > new Date(item.created_at) && (
                                <Text style={styles.editedText}>(edited)</Text>
                            )}
                        </View>
                        {isMyComment && (
                            <TouchableOpacity onPress={() => setMenuVisibleId(menuVisibleId === item.id ? null : item.id)}>
                                <MoreVertical size={16} color="#999" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={styles.commentText}>{item.comment}</Text>

                    {/* Menu for Edit/Delete */}
                    {menuVisibleId === item.id && (
                        <View style={styles.menuContainer}>
                            <TouchableOpacity style={styles.menuOption} onPress={() => startEditing(item)}>
                                <Edit2 size={14} color="#333" />
                                <Text style={styles.menuText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.menuOption} onPress={() => { setMenuVisibleId(null); handleDeleteComment(item.id); }}>
                                <Trash2 size={14} color="#F44336" />
                                <Text style={[styles.menuText, { color: '#F44336' }]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            onRequestClose={handleClose}
            animationType="none"
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />

                <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Comments</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                            <X size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#210F47" style={{ marginTop: 20 }} />
                    ) : (
                        <FlatList
                            data={comments}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={<Text style={styles.emptyText}>No comments yet. Be the first!</Text>}
                            keyboardShouldPersistTaps="handled"
                        />
                    )}

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
                    >
                        <View style={styles.inputContainer}>
                            <Image
                                source={{ uri: user?.profile_pic || 'https://via.placeholder.com/40' }}
                                style={[styles.avatar, { width: 32, height: 32 }]}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder={editingCommentId ? "Update comment..." : "Write a comment..."}
                                value={text}
                                onChangeText={setText}
                                multiline
                            />
                            {editingCommentId ? (
                                <View style={{ flexDirection: 'row' }}>
                                    <TouchableOpacity onPress={() => { setText(''); setEditingCommentId(null); }} style={{ marginRight: 10, padding: 5 }}>
                                        <X size={24} color="#666" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleSend} disabled={!text.trim() || sending}>
                                        <Check size={24} color="#210F47" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity onPress={handleSend} disabled={!text.trim() || sending}>
                                    <Send size={24} color={text.trim() ? "#210F47" : "#999"} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </KeyboardAvoidingView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '70%', // Take up 70% of screen
        paddingTop: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    closeBtn: {
        padding: 5,
    },
    listContent: {
        padding: 20,
        paddingBottom: 80, // Space for input
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 20,
        position: 'relative', // For menu absolute
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: '#ddd',
    },
    commentContent: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // Changed to between for menu
        marginBottom: 4,
    },
    userName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#000',
        marginRight: 8,
    },
    time: {
        fontSize: 12,
        color: '#888',
    },
    editedText: {
        fontSize: 11,
        color: '#999',
        marginLeft: 4,
        fontStyle: 'italic'
    },
    commentText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        backgroundColor: '#F5F5F7',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginHorizontal: 10,
        maxHeight: 100,
        color: '#000',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#888'
    },
    // New Menu Styles
    menuContainer: {
        position: 'absolute',
        right: 0,
        top: 25,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 10,
        padding: 5,
        minWidth: 100,
    },
    menuOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    menuText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#333',
    }
});

export default CommentOverlay;
