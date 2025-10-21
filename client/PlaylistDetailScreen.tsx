import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Poppins_700Bold, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Rajdhani_600SemiBold } from '@expo-google-fonts/rajdhani';
import { instance } from './utils/axios';
import { useAuth } from './contexts/AuthContext';
import Swipeable from 'react-native-gesture-handler/Swipeable';

const { width, height } = Dimensions.get('window');

interface Song {
  isrc?: string;
  song_name?: string;
  title?: string;
  artist?: string;
  duration_ms?: number;
  cover_art_url?: string;
  coverArt?: string;
}

interface PlaylistDetailScreenProps {
  route?: any;
  navigation?: any;
}

const PlaylistDetailScreen: React.FC<PlaylistDetailScreenProps> = ({ route, navigation }) => {
  const { deviceId } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [playlistData, setPlaylistData] = useState<any>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const playlistId = route?.params?.playlistId;
  const playlist = route?.params?.playlist || {
    name: 'My Playlist',
    description: '0 songs',
    cover_images: [],
  };

  // Check if current user is the owner
  const isOwner = playlistData?.ownerId === deviceId;
  const isShared = playlistData?.deviceIds?.length > 1;
  // Check if user is a member of the playlist
  const isMember = playlistData?.deviceIds?.includes(deviceId);

  useEffect(() => {
    if (playlistId) {
      fetchPlaylistDetail();
    }
  }, [playlistId]);

  const fetchPlaylistDetail = async () => {
    try {
      setLoading(true);
      const response = await instance({
        method: 'GET',
        url: `/playlists/${playlistId}`,
        headers: {
          'x-device-id': deviceId,
        },
      });

      if (response.data && response.data.data) {
        setPlaylistData(response.data.data);
        setSongs(response.data.data.tracks || []);
      }
    } catch (error) {
      console.error('Error fetching playlist detail:', error);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (durationMs?: number) => {
    if (!durationMs) return '0:00';
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleDeletePlaylist = () => {
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${
        playlistData?.playlist_name || playlist.name
      }"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await instance({
                method: 'DELETE',
                url: `/playlists/${playlistId}`,
                headers: { 'x-device-id': deviceId },
              });
              Alert.alert('Success', 'Playlist deleted successfully');
              navigation?.goBack();
            } catch (error) {
              console.error('Error deleting playlist:', error);
              Alert.alert('Error', 'Failed to delete playlist');
            }
          },
        },
      ]
    );
  };

  const handleLeavePlaylist = () => {
    Alert.alert(
      'Leave Playlist',
      `Are you sure you want to leave "${playlistData?.playlist_name || playlist.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await instance({
                method: 'DELETE',
                url: `/playlists/${playlistId}/leave`,
                headers: { 'x-device-id': deviceId },
              });
              Alert.alert('Success', 'You have left the playlist');
              navigation?.goBack();
            } catch (error) {
              console.error('Error leaving playlist:', error);
              Alert.alert('Error', 'Failed to leave playlist');
            }
          },
        },
      ]
    );
  };

  const handleJoinPlaylist = async () => {
    try {
      // Ensure playlistId is a string
      const id = typeof playlistId === 'object' ? playlistId._id || playlistId : playlistId;
      console.log('Joining playlist with ID:', id);

      await instance({
        method: 'POST',
        url: `/playlists/${id}/share`,
        headers: { 'x-device-id': deviceId },
      });
      Alert.alert('Success', 'You have joined the playlist');
      // Refresh playlist detail
      fetchPlaylistDetail();
    } catch (error) {
      console.error('Error joining playlist:', error);
      Alert.alert('Error', 'Failed to join playlist');
    }
  };

  const handleSongPress = (songId: string) => {
    // Extract all song IDs from current playlist
    const songIds = songs.map((song: any) => String(song._id)).filter((id) => id);

    navigation?.navigate('ResultDetailScreen', {
      songId,
      source: 'playlist',
      songIds: songIds,
    });
  };

  const handleDeleteSong = async (songId: string) => {
    try {
      await instance({
        method: 'DELETE',
        url: `/playlists/${playlistId}/songs/${songId}`,
        headers: { 'x-device-id': deviceId },
      });
      // Refresh playlist
      fetchPlaylistDetail();
    } catch (error) {
      console.error('Error deleting song:', error);
      Alert.alert('Error', 'Failed to remove song from playlist');
    }
  };

  let [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Rajdhani_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#C84B31', '#CD6155', '#E67E22', '#E59866', '#F8B88B']}
        locations={[0, 0.2, 0.4, 0.7, 1]}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}
        >
          {/* Header Section */}
          <View style={styles.headerWrapper}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation?.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back-outline" size={28} color="#000000" />
            </TouchableOpacity>

            <View style={styles.headerBackground} />

            {/* Vertical Text on Left */}
            <View style={styles.verticalTextContainer}>
              <View style={styles.verticalTextWrapper}>
                <Text style={styles.verticalText} numberOfLines={1}>
                  {playlist.name}
                </Text>
              </View>
            </View>

            {/* Overlapping Playlist Card - hanya 1 card */}
            <View style={styles.playlistCard}>
              {playlist.cover_images && playlist.cover_images.length > 0 ? (
                <Image
                  source={{ uri: playlist.cover_images[0] }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              ) : (
                <Image
                  source={require('./assets/melodix.png')}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              )}
              {/* Dark Gradient Overlay */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                style={styles.cardGradient}
              >
                {/* Play Button at Bottom Right */}
                <TouchableOpacity style={styles.cardPlayButton} activeOpacity={0.8}>
                  <Ionicons name="play" size={26} color="#FF8C3A" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>

          {/* Delete/Leave/Join Button - Above Song List */}
          {isOwner ? (
            <TouchableOpacity
              style={styles.deletePlaylistButton}
              onPress={handleDeletePlaylist}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color="#ffffffff" />
              <Text style={styles.deletePlaylistText}>Delete Playlist</Text>
            </TouchableOpacity>
          ) : isMember ? (
            <TouchableOpacity
              style={styles.leavePlaylistButton}
              onPress={handleLeavePlaylist}
              activeOpacity={0.7}
            >
              <Ionicons name="exit-outline" size={20} color="#ffffffff" />
              <Text style={styles.leavePlaylistText}>Leave Playlist</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.joinPlaylistButton}
              onPress={handleJoinPlaylist}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={20} color="#f8faf8ff" />
              <Text style={styles.joinPlaylistText}>Join Playlist</Text>
            </TouchableOpacity>
          )}

          {/* Songs List */}
          <View style={styles.songsList}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading songs...</Text>
              </View>
            ) : songs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="musical-notes-outline" size={60} color="rgba(0,0,0,0.3)" />
                <Text style={styles.emptyText}>No songs in this playlist</Text>
                <Text style={styles.emptySubtext}>Add songs to get started</Text>
              </View>
            ) : (
              songs.map((song, index) => {
                const songId = (song as any)._id;

                // Render right actions (delete button) - SAMA SEPERTI HISTORYSCREEN
                const renderRightActions = (
                  progress: Animated.AnimatedInterpolation<number>,
                  dragX: Animated.AnimatedInterpolation<number>
                ) => {
                  const translateX = progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                    extrapolate: 'clamp',
                  });

                  return (
                    <Animated.View
                      style={[
                        styles.deleteButtonContainer,
                        {
                          transform: [{ translateX }],
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteSong(songId)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="trash" size={24} color="#FFFFFF" />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                };

                return (
                  <Swipeable
                    key={songId || song.isrc || index}
                    renderRightActions={isOwner ? renderRightActions : undefined}
                    overshootRight={false}
                    enabled={isOwner}
                    onSwipeableOpen={() => setScrollEnabled(false)}
                    onSwipeableClose={() => setScrollEnabled(true)}
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleSongPress(songId)}
                      style={styles.rowFront}
                    >
                      <View style={styles.historyItem}>
                        <View style={styles.historyItemLeft}>
                          <Image
                            source={{ uri: song.cover_art_url || song.coverArt }}
                            style={styles.albumCover}
                            resizeMode="cover"
                          />
                          <View style={styles.historyTextContainer}>
                            <Text style={styles.historyTitle} numberOfLines={1}>
                              {song.song_name || song.title || 'Unknown Song'}
                            </Text>
                            <Text style={styles.historyArtist} numberOfLines={1}>
                              {song.artist || 'Unknown Artist'}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.historyItemRight}>
                          <Text style={styles.historyDuration}>
                            {formatDuration(song.duration_ms)}
                          </Text>
                          <Ionicons name="chevron-forward" size={20} color="rgba(0, 0, 0, 0.6)" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Swipeable>
                );
              })
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

export default PlaylistDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  // Header Wrapper
  headerWrapper: {
    height: height * 0.48,
    position: 'relative',
  },
  // Back Button
  backButton: {
    position: 'absolute',
    top: 50,
    left: 10,
    zIndex: 20,
    width: 40,
    height: 50,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  deletePlaylistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#FF3B30',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 20,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
  },
  deletePlaylistText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#ffffffff',
    letterSpacing: 0.3,
  },
  leavePlaylistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#FF3B30',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 20,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
  },
  leavePlaylistText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#ffffffff',
    letterSpacing: 0.3,
  },
  joinPlaylistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#3aab11ff',
    borderWidth: 1,
    borderColor: '#3aab11ff',
    borderRadius: 20,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
  },
  joinPlaylistText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#fbfbfbff',
    letterSpacing: 0.3,
  },

  headerBackground: {
    position: 'absolute',
    left: 50,
    top: 0,
    right: 0,
    height: height * 0.38,
    backgroundColor: '#03010041',
    borderBottomLeftRadius: 45,
  },
  // Vertical Text on Left
  verticalTextContainer: {
    position: 'absolute',
    left: 78,
    top: 155,
    width: 30,
    height: 250,
    zIndex: 10,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  verticalTextWrapper: {
    position: 'absolute',
    width: 250,
    height: 90,
    justifyContent: 'center',
    alignItems: 'flex-start',
    transform: [{ rotate: '-90deg' }],
    transformOrigin: 'center',
  },
  verticalText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    color: '#f1ececff',
    letterSpacing: 2.5,
    textAlign: 'left',
  },
  iconButton: {
    marginTop: 110,
  },
  // Overlapping Playlist Card - HANYA 1 CARD
  playlistCard: {
    position: 'absolute',
    left: width * 0.28,
    top: 60,
    width: width * 0.65,
    height: height * 0.38,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    padding: 20,
    justifyContent: 'flex-end',
  },
  cardPlayButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  // Songs List (SAMA PERSIS SEPERTI HISTORYSCREEN)
  songsList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.12)',
    backgroundColor: 'transparent',
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  albumCover: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: '#F0F0F0',
  },
  historyTextContainer: {
    flex: 1,
  },
  historyTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 19,
    color: '#000000ff',
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  historyArtist: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 16,
    color: '#000000ff',
    opacity: 0.7,
    letterSpacing: 0.3,
  },
  historyItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyDuration: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#000000ff',
    opacity: 0.7,
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: 'rgba(0, 0, 0, 0.6)',
    marginTop: 16,
  },
  emptySubtext: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    marginTop: 8,
  },
  playlistInfoSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  playlistHeader: {
    gap: 12,
  },
  playlistTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playlistTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: 'rgba(0, 0, 0, 0.85)',
    letterSpacing: 0.3,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  ownerBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: '#B8860B',
    letterSpacing: 0.3,
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  sharedBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: '#388E3C',
    letterSpacing: 0.3,
  },
  playlistStats: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    letterSpacing: 0.3,
  },
  // Swipe Delete Styles (SAMA SEPERTI HISTORYSCREEN)
  rowFront: {
    backgroundColor: 'transparent',
  },
  deleteButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    height: '100%',
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
    height: 100,
    backgroundColor: '#FF4444',
    borderRadius: 0,
    gap: 6,
  },
  deleteButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
