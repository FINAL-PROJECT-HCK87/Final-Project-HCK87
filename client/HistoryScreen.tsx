import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, { useCallback, useState, useRef } from 'react';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import {
  Poppins_700Bold,
  Poppins_600SemiBold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import { Rajdhani_700Bold, Rajdhani_600SemiBold } from '@expo-google-fonts/rajdhani';
import { Inter_700Bold, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { instance } from './utils/axios';
import { useAuth } from './contexts/AuthContext';
import Swipeable from 'react-native-gesture-handler/Swipeable';

const { width, height } = Dimensions.get('window');
interface HistoryItem {
  _id: string;
  title: string;
  artist: string;
  duration_ms: number;
  cover_art_url: string;
}

interface ArtistItem {
  _id: string;
  name: string;
  slug: string;
  image_url: string;
}

interface HistoryScreenProps {
  navigation?: any;
}

interface PlaylistItem {
  _id: string;
  name: string;
  description: string;
  song_count: number;
  cover_images: string[];
}

const HistoryScreen = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [artists, setArtists] = useState<ArtistItem[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const { deviceId } = useAuth();
  const navigation = useNavigation<HistoryScreenProps['navigation']>();

  // Modal animation values
  const modalScale = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  // Dummy playlists data - mencontohkan semua kondisi
  const dummyPlaylists: PlaylistItem[] = [
    {
      _id: '1',
      name: 'Empty Playlist',
      description: 'No songs yet',
      song_count: 0,
      cover_images: [],
    },
    {
      _id: '2',
      name: 'Single Song',
      description: 'Only one track',
      song_count: 1,
      cover_images: ['https://i.scdn.co/image/ab67616d0000b273e787cffec20aa2a396a61647'],
    },
    {
      _id: '3',
      name: 'Duo Playlist',
      description: 'Two favorites',
      song_count: 2,
      cover_images: [
        'https://i.scdn.co/image/ab67616d0000b2733b5e11ca1b063583df9492db',
        'https://i.scdn.co/image/ab67616d0000b273c8b444df094279e70d0ed856',
      ],
    },
    {
      _id: '4',
      name: 'Trio Mix',
      description: 'Three songs',
      song_count: 3,
      cover_images: [
        'https://i.scdn.co/image/ab67616d0000b273907bd84d73508e91ab1e0269',
        'https://i.scdn.co/image/ab67616d0000b273fc915b69600dce2991a61f13',
        'https://i.scdn.co/image/ab67616d0000b2734f89844c76d620ff098ef5c6',
      ],
    },
    {
      _id: '5',
      name: 'Full Grid',
      description: '4 or more songs',
      song_count: 12,
      cover_images: [
        'https://i.scdn.co/image/ab67616d0000b273da5d5aeeabacacc1263c0f4b',
        'https://i.scdn.co/image/ab67616d0000b273a048415db06a5b6fa7ec4e1a',
        'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
        'https://i.scdn.co/image/ab67616d0000b273e787cffec20aa2a396a61647',
      ],
    },
  ];

  const fetchHistory = async () => {
    try {
      const response = await instance({
        method: 'GET',
        url: '/users/search-history',
        headers: {
          'x-device-id': deviceId,
        },
      });
      setHistory(response.data.search_history);
    } catch (error) {
      console.error('Error fetching search history:', error);
    }
  };

  const fetchArtists = async () => {
    try {
      const response = await instance({
        method: 'GET',
        url: '/users/artists-from-history',
        headers: {
          'x-device-id': deviceId,
        },
      });
      setArtists(response.data.artists);
    } catch (error) {
      console.error('Error fetching artists:', error);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const response = await instance({
        method: 'GET',
        url: '/playlists/all',
        headers: {
          'x-device-id': deviceId,
        },
      });

      console.log('Fetched playlists:', response.data.data);

      // Transform API data to match PlaylistItem interface
      const transformedPlaylists = response.data.data.map((playlist: any) => {
        // Extract unique cover images from tracks (max 4 for grid display)
        // Server now returns full track data with cover_art_url
        const coverImages = playlist.tracks
          ?.slice(0, 4)
          .map((track: any) => track.cover_art_url)
          .filter((url: string) => url) || [];

        return {
          _id: playlist._id,
          name: playlist.playlist_name || 'Untitled Playlist',
          description: `${playlist.tracks?.length || 0} songs`,
          song_count: playlist.tracks?.length || 0,
          cover_images: coverImages,
        };
      });

      setPlaylists(transformedPlaylists);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      // Fallback to empty array if error
      setPlaylists([]);
    }
  };

  const formatDuration = (durationMs: number) => {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleDeleteItem = async (songId: string) => {
    Alert.alert('Delete Song', 'Are you sure you want to remove this song from history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await instance({
              method: 'DELETE',
              url: `/users/search-history/${songId}`,
              headers: {
                'x-device-id': deviceId,
              },
            });
            // Refresh both history and artists
            fetchHistory();
            fetchArtists();
          } catch (error) {
            console.error('Error deleting history item:', error);
          }
        },
      },
    ]);
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Clear All History',
      'Are you sure you want to clear all your search history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await instance({
                method: 'DELETE',
                url: '/users/search-history',
                headers: {
                  'x-device-id': deviceId,
                },
              });
              // Refresh both history and artists
              fetchHistory();
              fetchArtists();
            } catch (error) {
              console.error('Error clearing history:', error);
            }
          },
        },
      ]
    );
  };

  // Handle create modal animation
  const openCreateModal = () => {
    setShowCreateModal(true);
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeCreateModal = () => {
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowCreateModal(false);
      setPlaylistName('');
    });
  };

  const handleCreatePlaylist = async () => {
    if (playlistName.trim().length === 0) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }

    try {
      console.log(playlistName);
      const response = await instance({
        method: 'POST',
        url: '/playlists/create',
        headers: {
          'x-device-id': deviceId,
        },
        data: { playlistName },
      });

      // Close modal and refresh playlists
      closeCreateModal();
      await fetchPlaylists(); // Refresh playlists after creating new one
      Alert.alert('Success', `Playlist "${playlistName}" created!`);
    } catch (error: unknown) {
      console.log(error as string);
      Alert.alert('Error', 'Failed to create playlist. Please try again.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
      fetchArtists();
      fetchPlaylists(); // Fetch real playlists from API
    }, [])
  );

  let [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_800ExtraBold,
    Rajdhani_700Bold,
    Rajdhani_600SemiBold,
    Inter_700Bold,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }
  // console.log(history);
  return (
    <LinearGradient
      colors={['#FFE9D5', '#FFD4A3', '#FFB366', '#FF9F4D', '#FF8C3A']}
      locations={[0, 0.3, 0.5, 0.7, 1]}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
        {/* Playlists Section - PALING ATAS */}
        <View style={styles.playlistsSection}>
          <View style={styles.playlistsHeader}>
            <Text style={styles.playlistsSectionTitle}>My Playlists</Text>
            <TouchableOpacity
              style={styles.createPlaylistButton}
              activeOpacity={0.8}
              onPress={openCreateModal}
            >
              <Ionicons name="add-circle" size={24} color="#FF9F4D" />
              <Text style={styles.createPlaylistText}>Create</Text>
            </TouchableOpacity>
          </View>

          {playlists.length === 0 ? (
            <View style={styles.emptyPlaylistContainer}>
              <Ionicons name="musical-notes-outline" size={48} color="rgba(0,0,0,0.25)" />
              <Text style={styles.emptyPlaylistText}>No playlists yet</Text>
              <Text style={styles.emptyPlaylistSubtext}>Tap Create to make your first playlist</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.playlistScrollContent}
            >
              {playlists.map((playlist, index) => (
                <TouchableOpacity
                  key={playlist._id}
                  style={[styles.playlistCard, index === 0 && styles.playlistCardFirst]}
                  activeOpacity={0.85}
                  onPress={() => {
                    // Navigate to PlaylistDetail with playlist data
                    navigation.navigate('PlaylistDetail', {
                      playlistId: playlist._id,
                      playlist: playlist
                    });
                  }}
                >
                  {/* Cover Grid - Dynamic based on song count */}
                  <View style={styles.playlistCoverContainer}>
                    {playlist.song_count === 0 ? (
                      /* No songs - Default melodix.png */
                      <Image
                        source={require('./assets/melodix.png')}
                        style={styles.coverSingle}
                        resizeMode="cover"
                      />
                    ) : playlist.song_count === 1 ? (
                      /* 1 song - Single full image */
                      <Image
                        source={{ uri: playlist.cover_images[0] }}
                        style={styles.coverSingle}
                        resizeMode="cover"
                      />
                    ) : playlist.song_count === 2 ? (
                      /* 2 songs - Split vertical */
                      <View style={styles.coverGrid}>
                        <View style={styles.coverHalfVertical}>
                          <Image
                            source={{ uri: playlist.cover_images[0] }}
                            style={styles.coverGridImage}
                            resizeMode="cover"
                          />
                        </View>
                        <View style={styles.coverHalfVertical}>
                          <Image
                            source={{ uri: playlist.cover_images[1] }}
                            style={styles.coverGridImage}
                            resizeMode="cover"
                          />
                        </View>
                      </View>
                    ) : playlist.song_count === 3 ? (
                      /* 3 songs - 1 full left, 2 split right */
                      <View style={styles.coverGrid}>
                        <View style={styles.coverFullLeft}>
                          <Image
                            source={{ uri: playlist.cover_images[0] }}
                            style={styles.coverGridImage}
                            resizeMode="cover"
                          />
                        </View>
                        <View style={styles.coverRightColumn}>
                          <View style={styles.coverHalfHorizontal}>
                            <Image
                              source={{ uri: playlist.cover_images[1] }}
                              style={styles.coverGridImage}
                              resizeMode="cover"
                            />
                          </View>
                          <View style={styles.coverHalfHorizontal}>
                            <Image
                              source={{ uri: playlist.cover_images[2] }}
                              style={styles.coverGridImage}
                              resizeMode="cover"
                            />
                          </View>
                        </View>
                      </View>
                    ) : (
                      /* 4+ songs - 2x2 grid */
                      <View style={styles.coverGrid}>
                        {[0, 1, 2, 3].map((i) => (
                          <View key={i} style={styles.coverGridItem}>
                            {playlist.cover_images[i] ? (
                              <Image
                                source={{ uri: playlist.cover_images[i] }}
                                style={styles.coverGridImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.coverGridPlaceholder}>
                                <Ionicons name="musical-notes" size={20} color="rgba(0,0,0,0.3)" />
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Playlist Info */}
                  <View style={styles.playlistInfo}>
                    <Text style={styles.playlistName} numberOfLines={1}>
                      {playlist.name}
                    </Text>
                    <Text style={styles.playlistSongCount}>
                      {playlist.song_count} {playlist.song_count === 1 ? 'song' : 'songs'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Your History Section - Only show if there's history */}
        {history.length === 0 ? (
          <View style={styles.emptyStateWrapper}>
            <View style={styles.emptyContainer}>
              <Ionicons name="musical-notes-outline" size={64} color="rgba(0,0,0,0.3)" />
              <Text style={styles.emptyText}>No history yet</Text>
              <Text style={styles.emptySubtext}>Start identifying songs to see them here</Text>
            </View>
          </View>
        ) : (
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>Your History</Text>
              <TouchableOpacity
                style={styles.deleteAllButton}
                onPress={handleDeleteAll}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={20} color="#FF4444" />
                <Text style={styles.deleteAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>

            {/* Circular Artists - Tepat di bawah "Your History" title */}
            {artists.length > 0 && (
              <View style={styles.artistsInlineSection}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.artistsInlineScrollContent}
                >
                  {artists.map((artist, index) => (
                    <TouchableOpacity
                      key={artist._id}
                      style={[
                        styles.artistCircleContainer,
                        index === 0 && styles.artistCircleFirst,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        navigation.navigate('Concerts', {
                          artistId: artist._id,
                          artistName: artist.name,
                        });
                      }}
                    >
                      <View style={styles.artistCircle}>
                        <Image
                          source={{ uri: artist.image_url || 'https://via.placeholder.com/80' }}
                          style={styles.artistCircleImage}
                          resizeMode="cover"
                        />
                      </View>
                      <Text style={styles.artistCircleName} numberOfLines={1}>
                        {artist.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {history.map((item) => {
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
                      onPress={() => handleDeleteItem(item._id)}
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
                  key={item._id}
                  renderRightActions={renderRightActions}
                  overshootRight={false}
                  onSwipeableOpen={() => setScrollEnabled(false)}
                  onSwipeableClose={() => setScrollEnabled(true)}
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('ResultDetailScreen', { songId: item._id })}
                    style={styles.rowFront}
                  >
                    <View style={styles.historyItem}>
                      <View style={styles.historyItemLeft}>
                        <Image
                          source={{ uri: item.cover_art_url }}
                          style={styles.albumCover}
                          resizeMode="cover"
                        />
                        <View style={styles.historyTextContainer}>
                          <Text style={styles.historyTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={styles.historyArtist} numberOfLines={1}>
                            {item.artist}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.historyItemRight}>
                        <Text style={styles.historyDuration}>
                          {formatDuration(item.duration_ms)}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color="rgba(0, 0, 0, 0.6)" />
                      </View>
                    </View>
                  </TouchableOpacity>
                </Swipeable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Create Playlist Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="none"
        onRequestClose={closeCreateModal}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeCreateModal}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Animated.View
              style={[
                styles.createModalContainer,
                {
                  opacity: modalOpacity,
                  transform: [{ scale: modalScale }],
                },
              ]}
            >
              <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                <BlurView intensity={95} tint="dark" style={styles.createModalBlur}>
                  {/* Modal Header */}
                  <View style={styles.createModalHeader}>
                    <View style={styles.modalIconContainer}>
                      <LinearGradient
                        colors={['#FF9F4D', '#FF8C3A']}
                        style={styles.modalIconGradient}
                      >
                        <Ionicons name="musical-notes" size={32} color="#FFFFFF" />
                      </LinearGradient>
                    </View>
                    <Text style={styles.createModalTitle}>Create Playlist</Text>
                    <Text style={styles.createModalSubtitle}>
                      Give your playlist a name and start adding songs
                    </Text>
                  </View>

                  {/* Input Fields */}
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="disc" size={20} color="#FF9F4D" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Playlist Name"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={playlistName}
                        onChangeText={setPlaylistName}
                        autoFocus
                        maxLength={50}
                      />
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={closeCreateModal}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.createButton,
                        playlistName.trim().length === 0 && styles.createButtonDisabled,
                      ]}
                      onPress={handleCreatePlaylist}
                      activeOpacity={0.8}
                      disabled={playlistName.trim().length === 0}
                    >
                      <LinearGradient
                        colors={
                          playlistName.trim().length === 0
                            ? ['#999', '#777']
                            : ['#FF9F4D', '#FF8C3A']
                        }
                        style={styles.createButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.createButtonText}>Create</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </BlurView>
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
};

export default HistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  // History Section
  historySection: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 38,
    color: '#000000ff',
    letterSpacing: 3,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 0,
    gap: 6,
  },
  deleteAllText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#FF4444',
    letterSpacing: 0.3,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
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
    width: 56,
    height: 56,
    borderRadius: 10,
    marginRight: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  historyTextContainer: {
    flex: 1,
  },
  historyTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    color: '#000000ff',
    marginBottom: 6,
    letterSpacing: 0.5,
  },

  historyArtist: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 14,
    color: '#000000ff',
    letterSpacing: 0.5,
  },

  historyItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  historyDuration: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#000000ff',
    letterSpacing: 0.5,
    marginRight: 4,
  },
  // Swipe List Styles
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
  // Empty State
  emptyStateWrapper: {
    height: height - 100, // Full screen height minus some padding
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },

  emptyText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: 'rgba(0, 0, 0, 0.6)',
    marginTop: 16,
    letterSpacing: 0.5,
  },

  emptySubtext: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.5)',
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  // Playlists Section
  playlistsSection: {
    paddingTop: 60,
    paddingBottom: 28,
  },
  playlistsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  playlistsSectionTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 38,
    color: '#000000ff',
    letterSpacing: 3,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  createPlaylistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    // borderWidth: 2,
    // borderColor: '#FF9F4D',
  },
  createPlaylistText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#FF9F4D',
    letterSpacing: 0.3,
  },
  playlistScrollContent: {
    paddingRight: 20,
  },
  emptyPlaylistContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPlaylistText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.5)',
    marginTop: 12,
    letterSpacing: 0.3,
  },
  emptyPlaylistSubtext: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.35)',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  playlistCard: {
    width: width * 0.42,
    marginLeft: 16,
    borderRadius: 14,
    overflow: 'visible',
  },
  playlistCardFirst: {
    marginLeft: 20,
  },
  playlistCoverContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 12,
    position: 'relative',
  },
  // Single cover (0 or 1 song)
  coverSingle: {
    width: '100%',
    height: '100%',
  },
  // Cover grid container
  coverGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  // 2 songs - Half vertical split
  coverHalfVertical: {
    width: '50%',
    height: '100%',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  // 3 songs - Full left (1 song)
  coverFullLeft: {
    width: '50%',
    height: '100%',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  // 3 songs - Right column (2 songs stacked)
  coverRightColumn: {
    width: '50%',
    height: '100%',
    flexDirection: 'column',
  },
  // 3 songs - Half horizontal (for right column)
  coverHalfHorizontal: {
    width: '100%',
    height: '50%',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  // 4+ songs - Grid item
  coverGridItem: {
    width: '50%',
    height: '50%',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  coverGridImage: {
    width: '100%',
    height: '100%',
  },
  coverGridPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistInfo: {
    paddingHorizontal: 4,
  },
  playlistName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#000000ff',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  playlistSongCount: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.7)',
    letterSpacing: 0.3,
  },
  // Circular Artists Section (Inline di bawah "Your History")
  artistsInlineSection: {
    marginBottom: 20,
    marginTop: 8,
  },
  artistsInlineScrollContent: {
    paddingHorizontal: 0,
  },
  artistCircleContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 80,
  },
  artistCircleFirst: {
    marginLeft: 0,
  },
  artistCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 3,
    borderColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  artistCircleImage: {
    width: '100%',
    height: '100%',
  },
  artistCircleName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#000000ff',
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  // Create Playlist Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  createModalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 25,
  },
  createModalBlur: {
    padding: 24,
  },
  createModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIconContainer: {
    marginBottom: 16,
  },
  modalIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF9F4D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  createModalTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 32,
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 8,
  },
  createModalSubtitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 159, 77, 0.3)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  createButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF9F4D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  createButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  createButtonText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
