import { scale } from '../../utils/responsive';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, Image, FlatList, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { doc, setDoc, deleteDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateGalleryVideos } from '../../store/slices/videosSlice';

interface Video {
    id: string;
    title: string;
    youtubeUrl: string;
    duration?: string;
    chapterNo?: string;
}

interface Gallery {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    videos: Video[];
}

export const AdminVideoGalleryScreen: React.FC = () => {
    const navigation = useNavigation();
    const { theme, isDark } = useTheme();
    const dispatch = useAppDispatch();

    // Read galleries from Redux (shared listener in videosSlice)
    const reduxGalleries = useAppSelector(state => state.videos.galleries);
    const loading = useAppSelector(state => state.videos.isLoading);

    // Map Redux galleries to the local Gallery type (which includes videos array)
    const galleries: Gallery[] = reduxGalleries.map(g => ({
        id: g.id,
        name: g.name || '',
        description: (g as any).description || '',
        thumbnail: (g as any).thumbnail || '',
        videos: (g as any).videos || [],
    }));

    const [galleryModalVisible, setGalleryModalVisible] = useState(false);
    const [videoModalVisible, setVideoModalVisible] = useState(false);
    const [videosListVisible, setVideosListVisible] = useState(false);
    const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);
    const [editingVideo, setEditingVideo] = useState<Video | null>(null);
    const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Gallery Form State
    const [galleryName, setGalleryName] = useState('');
    const [galleryDescription, setGalleryDescription] = useState('');
    const [galleryThumbnail, setGalleryThumbnail] = useState('');

    // Video Form State
    const [videoTitle, setVideoTitle] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [videoDuration, setVideoDuration] = useState('');
    const [videoChapterNo, setVideoChapterNo] = useState('1');

    // Derive selectedGallery from ID to ensure live updates without syncing state
    const selectedGallery = selectedGalleryId
        ? galleries.find(g => g.id === selectedGalleryId) || null
        : null;

    // useEffect removed - no longer needed for syncing

    // Gallery CRUD
    const handleSaveGallery = async () => {
        if (!galleryName) {
            Alert.alert('Error', 'Please enter gallery name');
            return;
        }

        const galleryData = {
            name: galleryName,
            description: galleryDescription,
            thumbnail: galleryThumbnail || '',
            videos: editingGallery?.videos || [],
            updatedAt: serverTimestamp(),
        };

        try {
            if (editingGallery) {
                await setDoc(doc(db, 'videoGalleries', editingGallery.id), galleryData, { merge: true });
                Alert.alert('Success', 'Gallery updated successfully');
            } else {
                const newId = Date.now().toString();
                await setDoc(doc(db, 'videoGalleries', newId), galleryData);
                Alert.alert('Success', 'Gallery created successfully');
            }

            setGalleryModalVisible(false);
            resetGalleryForm();
        } catch (error) {
            Alert.alert('Error', 'Failed to save gallery');
            console.error(error);
        }
    };

    const handleDeleteGallery = async (id: string) => {
        Alert.alert('Delete Gallery', 'This will delete the gallery and all its videos. Continue?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteDoc(doc(db, 'videoGalleries', id));
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete gallery');
                    }
                }
            }
        ]);
    };

    // Video CRUD
    const handleSaveVideo = async () => {
        if (!videoTitle || !videoUrl || !selectedGallery) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        // Check for duplicate URL
        const isDuplicate = selectedGallery.videos.some(
            v => v.youtubeUrl === videoUrl && v.id !== (editingVideo?.id || '')
        );

        if (isDuplicate) {
            Alert.alert('Error', 'This video URL already exists in this gallery');
            return;
        }

        const videoData: Video = {
            id: editingVideo?.id || Date.now().toString(),
            title: videoTitle,
            youtubeUrl: videoUrl,
            duration: videoDuration || '',
            chapterNo: videoChapterNo || '1',
        };

        try {
            // Optimistic update via Redux Thunk
            let updatedVideos: Video[];
            if (editingVideo) {
                updatedVideos = selectedGallery.videos.map(v => v.id === editingVideo.id ? videoData : v);
            } else {
                updatedVideos = [...selectedGallery.videos, videoData];
            }

            dispatch(updateGalleryVideos({ galleryId: selectedGallery.id, videos: updatedVideos }));

            // Instant UI feedback
            setVideoModalVisible(false);
            resetVideoForm();
            Alert.alert('Success', editingVideo ? 'Video updated successfully' : 'Video added successfully');

        } catch (error) {
            Alert.alert('Error', 'Failed to save video');
            console.error(error);
        }
    };

    const handleDeleteVideo = async (video: Video) => {
        if (!selectedGallery) return;

        Alert.alert('Delete Video', `Remove "${video.title}" from this gallery?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const updatedVideos = selectedGallery.videos.filter(v => v.id !== video.id);
                        dispatch(updateGalleryVideos({ galleryId: selectedGallery.id, videos: updatedVideos }));
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete video');
                    }
                }
            }
        ]);
    };

    const openGalleryModal = (gallery?: Gallery) => {
        if (gallery) {
            setEditingGallery(gallery);
            setGalleryName(gallery.name);
            setGalleryDescription(gallery.description);
            setGalleryThumbnail(gallery.thumbnail);
        } else {
            resetGalleryForm();
        }
        setGalleryModalVisible(true);
    };

    const openVideoModal = (video?: Video) => {
        if (video) {
            setEditingVideo(video);
            setVideoTitle(video.title);
            setVideoUrl(video.youtubeUrl);
            setVideoDuration(video.duration || '');
            setVideoChapterNo(video.chapterNo || '1');
        } else {
            resetVideoForm();
            // Auto-increment chapter from last video if adding new
            const lastVideo = selectedGallery?.videos[selectedGallery.videos.length - 1];
            if (lastVideo && lastVideo.chapterNo) {
                setVideoChapterNo(lastVideo.chapterNo);
            }
        }
        setVideoModalVisible(true);
    };

    const openVideosList = (gallery: Gallery) => {
        setSelectedGalleryId(gallery.id);
        setVideosListVisible(true);
    };

    const resetGalleryForm = () => {
        setEditingGallery(null);
        setGalleryName('');
        setGalleryDescription('');
        setGalleryThumbnail('');
    };

    const resetVideoForm = () => {
        setEditingVideo(null);
        setVideoTitle('');
        setVideoUrl('');
        setVideoDuration('');
        setVideoChapterNo('1');
    };

    const filteredGalleries = galleries.filter(g =>
        (g.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Update selected gallery when galleries change - REMOVED (Derived state handles this)

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: StatusBar.currentHeight || 0 }]}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StatusBar.currentHeight || 0, backgroundColor: isDark ? theme.card : theme.primary, zIndex: 999 }} />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <View style={[styles.header, { backgroundColor: isDark ? theme.card : theme.primary, borderBottomColor: isDark ? theme.border : 'transparent' }]}>
                <TouchableOpacity
        style={{ 
          width: scale(38), 
          height: scale(38), 
          borderRadius: scale(12), 
          backgroundColor: isDark ? theme.border : 'rgba(255, 255, 255, 0.15)', 
          justifyContent: 'center', 
          alignItems: 'center', 
          marginRight: scale(12) 
        }} 
        activeOpacity={0.7}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={scale(22)} color={isDark ? theme.text : '#ffffff'} />
      </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? theme.text : '#fff' }]} numberOfLines={1} adjustsFontSizeToFit>Video Gallery</Text>
                <TouchableOpacity onPress={() => openGalleryModal()} style={styles.addButton}>
                    <Ionicons name="add" size={20} color={isDark ? theme.text : theme.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={[styles.searchInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                    placeholder="Search galleries..."
                    placeholderTextColor={theme.textSecondary}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
            </View>

            {loading ? (
                <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: scale(16) }} />
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={[styles.listTitle, { color: theme.text }]}>Galleries ({galleries.length})</Text>
                    {filteredGalleries.length === 0 ? (
                        <Text style={[styles.noDataText, { color: theme.textSecondary }]}>No galleries found.</Text>
                    ) : (
                        filteredGalleries.map((item, index) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.card, { backgroundColor: theme.card }]}
                                onPress={() => openVideosList(item)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.serialNo, { backgroundColor: theme.primary + '12' }]}>
                                    <Text style={[styles.serialNoText, { color: theme.primary }]}>{index + 1}</Text>
                                </View>
                                {item.thumbnail && item.thumbnail.trim() !== '' ? (
                                    <Image source={{ uri: item.thumbnail }} style={styles.galleryImage} />
                                ) : (
                                    <View style={[styles.galleryImage, { backgroundColor: theme.primary + '15', justifyContent: 'center', alignItems: 'center' }]}>
                                        <Ionicons name="videocam" size={20} color={theme.primary} />
                                    </View>
                                )}
                                <View style={styles.cardInfo}>
                                    <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                                    <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={1}>
                                        {item.description || 'No description'}
                                    </Text>
                                    <View style={styles.videoBadge}>
                                        <Ionicons name="videocam" size={10} color={theme.primary} />
                                        <Text style={[styles.videoCount, { color: theme.primary }]}>
                                            {item.videos?.length || 0} videos
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.cardActions}>
                                    <TouchableOpacity onPress={() => openGalleryModal(item)} style={styles.actionBtn}>
                                        <Ionicons name="pencil" size={16} color={theme.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDeleteGallery(item.id)} style={styles.actionBtn}>
                                        <Ionicons name="trash" size={16} color={theme.error} />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            )}

            {/* Gallery Edit/Add Modal */}
            <Modal visible={galleryModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            {editingGallery ? 'Edit Gallery' : 'New Gallery'}
                        </Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.label, { color: theme.text }]}>Gallery Name *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                placeholder="e.g. Mathematics Lectures"
                                placeholderTextColor={theme.textSecondary}
                                value={galleryName}
                                onChangeText={setGalleryName}
                            />

                            <Text style={[styles.label, { color: theme.text }]}>Description</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                placeholder="Brief description..."
                                placeholderTextColor={theme.textSecondary}
                                value={galleryDescription}
                                onChangeText={setGalleryDescription}
                                multiline
                            />

                            <Text style={[styles.label, { color: theme.text }]}>Thumbnail URL</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                placeholder="https://..."
                                placeholderTextColor={theme.textSecondary}
                                value={galleryThumbnail}
                                onChangeText={setGalleryThumbnail}
                            />
                        </ScrollView>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setGalleryModalVisible(false)} style={[styles.modalBtn, { backgroundColor: theme.border }]}>
                                <Text style={{ color: theme.text, fontSize: scale(13) }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveGallery} style={[styles.modalBtn, { backgroundColor: theme.primary }]}>
                                <Text style={{ color: '#fff', fontSize: scale(13) }}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Videos List Modal */}
            <Modal visible={videosListVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.videosModalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.videosModalHeader}>
                            <TouchableOpacity
        style={{ 
          width: scale(38), 
          height: scale(38), 
          borderRadius: scale(12), 
          backgroundColor: 'rgba(255, 255, 255, 0.15)', 
          justifyContent: 'center', 
          alignItems: 'center', 
          marginRight: scale(12) 
        }} 
        activeOpacity={0.7}
        onPress={() => setVideosListVisible(false)}
      >
        <Ionicons name="arrow-back" size={scale(22)} color="#ffffff" />
      </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: theme.text, flex: 1, marginBottom: 0 }]}>
                                {selectedGallery?.name}
                            </Text>
                            <TouchableOpacity onPress={() => openVideoModal()} style={styles.addVideoBtn}>
                                <Ionicons name="add" size={20} color={theme.primary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.listTitle, { color: theme.textSecondary, marginTop: scale(8) }]}>
                            {selectedGallery?.videos?.length || 0} Videos
                        </Text>

                        {selectedGallery?.videos?.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="videocam-outline" size={40} color={theme.textSecondary} />
                                <Text style={[styles.noDataText, { color: theme.textSecondary }]}>No videos yet</Text>
                                <TouchableOpacity
                                    onPress={() => openVideoModal()}
                                    style={[styles.addFirstBtn, { backgroundColor: theme.primary }]}
                                >
                                    <Text style={{ color: '#fff', fontSize: scale(12) }}>Add First Video</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
                                {(() => {
                                    const videos = selectedGallery?.videos || [];
                                    const grouped: { [key: number]: Video[] } = {};
                                    videos.forEach(v => {
                                        const ch = parseInt(v.chapterNo || '1') || 1;
                                        if (!grouped[ch]) grouped[ch] = [];
                                        grouped[ch].push(v);
                                    });

                                    const sortedChapters = Object.keys(grouped).map(Number).sort((a, b) => a - b);

                                    return sortedChapters.map(chapterNum => (
                                        <View key={chapterNum} style={{ marginBottom: scale(12) }}>
                                            <View style={[styles.chapterHeader, { backgroundColor: theme.card }]}>
                                                <Ionicons name="book-outline" size={14} color={theme.primary} style={{ marginRight: scale(6) }} />
                                                <Text style={[styles.chapterTitle, { color: theme.text }]}>Chapter {chapterNum}</Text>
                                                <View style={{ flex: 1, height: scale(1), backgroundColor: theme.border, marginLeft: scale(10) }} />
                                            </View>

                                            {grouped[chapterNum].map((item, index) => (
                                                <View key={item.id} style={[styles.videoCard, { backgroundColor: theme.background }]}>
                                                    <View style={[styles.serialNo, { backgroundColor: theme.primary + '12' }]}>
                                                        <Text style={[styles.serialNoText, { color: theme.primary }]}>{index + 1}</Text>
                                                    </View>
                                                    <View style={styles.videoIcon}>
                                                        <Ionicons name="play-circle" size={28} color={theme.primary} />
                                                    </View>
                                                    <View style={styles.videoInfo}>
                                                        <Text style={[styles.videoTitle, { color: theme.text }]} numberOfLines={1}>
                                                            {item.title}
                                                        </Text>
                                                        {item.duration && (
                                                            <Text style={[styles.videoDuration, { color: theme.textSecondary }]}>
                                                                {item.duration}
                                                            </Text>
                                                        )}
                                                    </View>
                                                    <View style={styles.cardActions}>
                                                        <TouchableOpacity onPress={() => openVideoModal(item)} style={styles.actionBtn}>
                                                            <Ionicons name="pencil" size={14} color={theme.primary} />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity onPress={() => handleDeleteVideo(item)} style={styles.actionBtn}>
                                                            <Ionicons name="trash" size={14} color={theme.error} />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    ));
                                })()}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Video Edit/Add Modal */}
            <Modal visible={videoModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            {editingVideo ? 'Edit Video' : 'Add Video'}
                        </Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.label, { color: theme.text }]}>Video Title *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                placeholder="e.g. Lecture 1: Introduction"
                                placeholderTextColor={theme.textSecondary}
                                value={videoTitle}
                                onChangeText={setVideoTitle}
                            />

                            <Text style={[styles.label, { color: theme.text }]}>YouTube URL *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                placeholder="https://youtube.com/watch?v=..."
                                placeholderTextColor={theme.textSecondary}
                                value={videoUrl}
                                onChangeText={setVideoUrl}
                                autoCapitalize="none"
                            />

                            <Text style={[styles.label, { color: theme.text }]}>Duration (optional)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                placeholder="e.g. 15:30"
                                placeholderTextColor={theme.textSecondary}
                                value={videoDuration}
                                onChangeText={setVideoDuration}
                            />

                            <Text style={[styles.label, { color: theme.text }]}>Chapter Number</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                placeholder="e.g. 1"
                                placeholderTextColor={theme.textSecondary}
                                value={videoChapterNo}
                                onChangeText={setVideoChapterNo}
                                keyboardType="number-pad"
                            />
                        </ScrollView>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setVideoModalVisible(false)} style={[styles.modalBtn, { backgroundColor: theme.border }]}>
                                <Text style={{ color: theme.text, fontSize: scale(13) }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveVideo} style={[styles.modalBtn, { backgroundColor: theme.primary }]}>
                                <Text style={{ color: '#fff', fontSize: scale(13) }}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: StatusBar.currentHeight || 0 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: scale(12),
        paddingVertical: scale(10),
        borderBottomWidth: 0.5,
    },
    headerTitle: { fontSize: scale(16), fontWeight: '600' },
    backButton: { padding: scale(2) },
    addButton: { padding: scale(2) },
    searchContainer: { padding: scale(12), paddingBottom: 0 },
    searchInput: {
        padding: scale(10),
        borderRadius: scale(6),
        borderWidth: 1,
        fontSize: scale(13),
    },
    content: { padding: scale(12) },
    listTitle: { fontSize: scale(13), fontWeight: '600', marginBottom: scale(10) },
    noDataText: { textAlign: 'center', marginTop: scale(16), fontSize: scale(13) },
    card: {
        padding: scale(10),
        borderRadius: scale(8),
        marginBottom: scale(8),
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    serialNo: {
        width: scale(22),
        height: scale(22),
        borderRadius: scale(11),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: scale(8),
    },
    serialNoText: {
        fontSize: scale(10),
        fontWeight: '600',
    },
    galleryImage: {
        width: scale(44),
        height: scale(44),
        borderRadius: scale(6),
        marginRight: scale(10),
        backgroundColor: '#e5e5e5',
    },
    cardInfo: { flex: 1 },
    name: { fontSize: scale(13), fontWeight: '600', marginBottom: scale(1) },
    description: { fontSize: scale(10), marginBottom: scale(2) },
    videoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(3),
    },
    videoCount: { fontSize: scale(10), fontWeight: '500' },
    cardActions: { flexDirection: 'row', gap: scale(10), paddingLeft: scale(6), alignItems: 'center' },
    actionBtn: { padding: scale(5), borderRadius: scale(4) },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: scale(16),
    },
    modalContent: {
        borderRadius: scale(12),
        padding: scale(14),
        elevation: 4,
        maxHeight: '70%',
    },
    videosModalContent: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: scale(12),
        padding: scale(14),
        elevation: 4,
        maxHeight: '85%',
    },
    videosModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: scale(8),
    },
    closeBtn: { padding: scale(4), marginRight: scale(8) },
    addVideoBtn: { padding: scale(4) },
    modalTitle: { fontSize: scale(16), fontWeight: '600', marginBottom: scale(14), textAlign: 'center' },
    label: { fontSize: scale(12), fontWeight: '600', marginBottom: scale(4) },
    input: {
        borderWidth: 1,
        borderRadius: scale(6),
        padding: scale(10),
        marginBottom: scale(10),
        fontSize: scale(13),
    },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: scale(8), marginTop: scale(8) },
    modalBtn: {
        paddingVertical: scale(8),
        paddingHorizontal: scale(16),
        borderRadius: scale(6),
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: scale(30),
    },
    addFirstBtn: {
        marginTop: scale(12),
        paddingVertical: scale(8),
        paddingHorizontal: scale(16),
        borderRadius: scale(6),
    },
    videoCard: {
        padding: scale(10),
        borderRadius: scale(8),
        marginBottom: scale(6),
        flexDirection: 'row',
        alignItems: 'center',
    },
    videoIcon: {
        marginRight: scale(10),
    },
    videoInfo: { flex: 1 },
    videoTitle: { fontSize: scale(12), fontWeight: '600' },
    videoDuration: { fontSize: scale(10) },
    chapterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: scale(8),
        marginTop: scale(8),
    },
    chapterTitle: {
        fontSize: scale(13),
        fontWeight: '700',
    },
});

