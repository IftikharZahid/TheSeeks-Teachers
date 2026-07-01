import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Animated, Dimensions, FlatList, Image, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppSelector } from '../../store/hooks';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { scale } from '../../utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';

export const VideoGalleriesScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const reduxGalleries = useAppSelector((s: any) => s.videos?.galleries) || [];
  const rawLikedVideos = useAppSelector((s: any) => s.videos?.likedVideos) || [];
  
  const [activeSlide, setActiveSlide] = useState(0);

  const handleScroll = useCallback((event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveSlide(Math.round(index));
  }, []);

  // Filter out any liked videos that have been deleted from the backend
  const validVideoIds = new Set(
    reduxGalleries.flatMap((g: any) => g.videos?.map((v: any) => v.id) || [])
  );
  const likedVideos = rawLikedVideos.filter((v: any) => validVideoIds.has(v.id));

  const selectedClass = route.params?.className;

  const classOrder = ["Playgroup", "Nursery", "Prep", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "1st Year", "2nd Year", "3rd Year", "4th Year", "BS"];
  const classesWithGalleries = Array.from(new Set(reduxGalleries.map((g: any) => g.targetClass).filter(Boolean)))
    .sort((a: any, b: any) => {
      const indexA = classOrder.indexOf(a);
      const indexB = classOrder.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });
  const galleriesToRender = selectedClass ? reduxGalleries.filter((g: any) => g.targetClass === selectedClass) : [];

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: StatusBar.currentHeight || 0 }]}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StatusBar.currentHeight || 0, backgroundColor: theme.primary, zIndex: 999 }} />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: theme.primary, borderBottomColor: 'transparent' }]}>
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
        onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('LibraryScreen' as any)}
      >
        <Ionicons name="arrow-back" size={scale(22)} color={isDark ? theme.text : '#ffffff'} />
      </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: isDark ? theme.text : '#fff' }]}>{selectedClass ? `${selectedClass} Lectures` : 'Select Class'}</Text>
          <Text style={[styles.headerSub, { color: isDark ? theme.textSecondary : 'rgba(255,255,255,0.8)' }]}>{selectedClass ? 'Educational video collections' : 'Choose a class to view subjects'}</Text>
        </View>
      </View>

      {/* ── Content ── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={undefined}>
        <ScrollView contentContainerStyle={{ padding: scale(16), paddingBottom: insets.bottom + scale(20) }} showsVerticalScrollIndicator={false}>
          {/* Liked Videos Slider */}
          {!selectedClass && likedVideos && likedVideos.length > 0 && (
            <View style={{ marginBottom: scale(24) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(12) }}>
                <Ionicons name="heart" size={scale(18)} color="#ef4444" style={{ marginRight: scale(6) }} />
                <Text style={{ fontSize: scale(16), fontWeight: '700', color: theme.text }}>Liked Videos</Text>
              </View>
              <FlatList
                data={likedVideos}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                keyExtractor={(item, index) => item.id || index.toString()}
                renderItem={({ item }) => (
                  <View style={{ width: Dimensions.get('window').width - scale(32) }}>
                    <TouchableOpacity
                      style={{
                        marginRight: scale(10),
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : '#fff',
                        borderRadius: scale(16),
                        padding: scale(12),
                        flexDirection: 'row',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.04,
                        shadowRadius: 12,
                        elevation: 2,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(0,0,0,0.04)',
                      }}
                      onPress={() => navigation.navigate('VideoLecturesScreen', { 
                        galleryId: item.galleryId, 
                        galleryName: item.galleryName, 
                        initialVideoId: item.id 
                      })}
                      activeOpacity={0.8}
                    >
                      <View style={{ width: scale(110), height: scale(75), borderRadius: scale(12), overflow: 'hidden', backgroundColor: '#000' }}>
                        <Image source={{ uri: item.thumbnail || `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg` }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                          <Ionicons name="play-circle" size={scale(32)} color="#fff" />
                        </View>
                        <View style={{ position: 'absolute', bottom: scale(4), right: scale(4), backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: scale(4), paddingVertical: scale(2), borderRadius: scale(4) }}>
                          <Text style={{ color: '#fff', fontSize: scale(8), fontWeight: '600' }}>{item.duration || '00:00'}</Text>
                        </View>
                      </View>
                      <View style={{ flex: 1, marginLeft: scale(14), justifyContent: 'center' }}>
                        <View style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', alignSelf: 'flex-start', paddingHorizontal: scale(8), paddingVertical: scale(3), borderRadius: scale(6), marginBottom: scale(6) }}>
                          <Text style={{ color: '#6366f1', fontSize: scale(9.5), fontWeight: '600' }}>
                            {reduxGalleries.find((g: any) => g.id === item.galleryId)?.targetClass || 'Class'} • {item.galleryName || 'Subject'}
                          </Text>
                        </View>
                        <Text style={{ fontSize: scale(13.5), fontWeight: '700', color: theme.text, marginBottom: scale(4) }} numberOfLines={2}>
                          {item.title || 'Video Title'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="book-outline" size={scale(12)} color={theme.textSecondary} style={{ marginRight: scale(4) }} />
                          <Text style={{ fontSize: scale(11), color: theme.textSecondary }} numberOfLines={1}>
                            {(() => {
                              const gallery = reduxGalleries.find((g: any) => g.id === item.galleryId);
                              const fullVideo = gallery?.videos?.find((v: any) => v.id === item.id);
                              const cName = fullVideo?.chapterName || item.chapterName;
                              const cNo = item.chapterNo || 1;
                              return `Chapter ${cNo}${cName ? ` - ${cName}` : ''}`;
                            })()}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              />
              {likedVideos.length > 1 && (
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: scale(12) }}>
                  {likedVideos.map((_: any, index: number) => (
                    <View
                      key={index}
                      style={{
                        width: activeSlide === index ? scale(16) : scale(6),
                        height: scale(6),
                        borderRadius: scale(3),
                        backgroundColor: activeSlide === index ? theme.primary || '#6366f1' : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                        marginHorizontal: scale(3),
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {!selectedClass ? (
            classesWithGalleries.length === 0 ? (
              <View style={styles.empty}>
                <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                  <Ionicons name="videocam-outline" size={scale(40)} color={theme.placeholder} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Video Lectures</Text>
                <Text style={[styles.emptySub, { color: theme.placeholder }]}>
                  No video lectures have been added yet.
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {classesWithGalleries.map((className: any, index: number) => {
                  const classGalleries = reduxGalleries.filter((g: any) => g.targetClass === className);
                  const totalVideos = classGalleries.reduce((sum: number, g: any) => sum + (g.videos?.length || 0), 0);
                  const palette = ['#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#eab308', '#ec4899', '#6366f1', '#f43f5e', '#0ea5e9', '#22c55e'];
                  const classColor = palette[index % palette.length];
                  
                  return (
                    <TouchableOpacity
                      key={className}
                      style={{
                        width: '48%',
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : '#fff',
                        borderRadius: scale(16),
                        padding: scale(12),
                        marginBottom: scale(16),
                        flexDirection: 'row',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.04,
                        shadowRadius: 12,
                        elevation: 2,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(0,0,0,0.04)',
                      }}
                      onPress={() => navigation.push('VideoGalleriesScreen', { className })}
                      activeOpacity={0.8}
                    >
                      <View style={{ width: scale(42), height: scale(42), borderRadius: scale(12), backgroundColor: classColor, alignItems: 'center', justifyContent: 'center', marginRight: scale(10) }}>
                        <Ionicons name="school" size={scale(22)} color="#fff" />
                      </View>

                      <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={{ fontSize: scale(12.5), fontWeight: '700', marginBottom: scale(2), color: theme.text }} numberOfLines={2}>{className}</Text>
                        <Text style={{ fontSize: scale(9.5), color: theme.textSecondary }} numberOfLines={1}>{classGalleries.length} Subjects</Text>
                      </View>

                      {totalVideos > 0 && (
                        <View style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          backgroundColor: classColor,
                          borderBottomLeftRadius: scale(10),
                          borderTopRightRadius: scale(15),
                          paddingHorizontal: scale(7),
                          paddingVertical: scale(3),
                        }}>
                          <Text style={{ fontSize: scale(9), fontWeight: 'bold', color: '#fff' }}>{totalVideos}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )
          ) : (
            galleriesToRender.length === 0 ? (
              <View style={styles.empty}>
                <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                  <Ionicons name="videocam-outline" size={scale(40)} color={theme.placeholder} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Video Lectures</Text>
                <Text style={[styles.emptySub, { color: theme.placeholder }]}>
                  No video galleries have been added for this class yet.
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {galleriesToRender.map((gallery: any, index: number) => {
                  const palette = ['#06b6d4', '#eab308', '#ec4899', '#6366f1', '#f43f5e', '#8b5cf6', '#10b981', '#f59e0b'];
                  const galleryColor = gallery.color || palette[index % palette.length];
                  const videoCount = gallery.videos?.length || 0;
                  return (
                    <TouchableOpacity
                      key={gallery.id}
                      style={{
                        width: '48%',
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : '#fff',
                        borderRadius: scale(16),
                        padding: scale(12),
                        marginBottom: scale(16),
                        flexDirection: 'row',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.04,
                        shadowRadius: 12,
                        elevation: 2,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(0,0,0,0.04)',
                      }}
                      onPress={() => navigation.navigate('VideoLecturesScreen', { galleryId: gallery.id, galleryName: gallery.name, galleryColor: gallery.color, videos: gallery.videos })}
                      activeOpacity={0.8}
                    >
                      <View style={{ width: scale(42), height: scale(42), borderRadius: scale(12), backgroundColor: galleryColor, alignItems: 'center', justifyContent: 'center', marginRight: scale(10) }}>
                        <Ionicons name="videocam" size={scale(22)} color="#fff" />
                      </View>

                      <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={{ fontSize: scale(12.5), fontWeight: '700', marginBottom: scale(2), color: theme.text }} numberOfLines={2}>{gallery.name}</Text>
                        <Text style={{ fontSize: scale(9.5), color: theme.textSecondary }} numberOfLines={1}>{gallery.description || 'Subject'}</Text>
                      </View>

                      {videoCount > 0 && (
                        <View style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          backgroundColor: galleryColor,
                          borderBottomLeftRadius: scale(10),
                          borderTopRightRadius: scale(15),
                          paddingHorizontal: scale(7),
                          paddingVertical: scale(3),
                        }}>
                          <Text style={{ fontSize: scale(9), fontWeight: 'bold', color: '#fff' }}>{videoCount}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,
  },
  header: { borderBottomLeftRadius: scale(24), borderBottomRightRadius: scale(24),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    borderBottomWidth: 1,
  },
  headerBtn: {
    marginRight: scale(14),
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: '700',
  },
  headerSub: {
    fontSize: scale(12),
    marginTop: scale(2),
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(40),
    marginTop: scale(40),
  },
  emptyIconWrap: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(16),
  },
  emptyTitle: {
    fontSize: scale(16),
    fontWeight: '600',
    marginBottom: scale(8),
  },
  emptySub: {
    fontSize: scale(13),
    textAlign: 'center',
    lineHeight: scale(20),
  },
});
