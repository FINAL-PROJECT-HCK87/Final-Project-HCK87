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
import React, { useCallback, useState } from 'react';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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

const HistoryScreen = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [artists, setArtists] = useState<ArtistItem[]>([]);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const { deviceId } = useAuth();
  const navigation = useNavigation<HistoryScreenProps['navigation']>();

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

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
      fetchArtists();
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
        {/* Horizontal Slider for Artists from Search History */}
        {artists.length > 0 && (
          <View style={styles.featuredSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScrollContent}
              snapToInterval={width * 0.42}
              decelerationRate="fast"
            >
              {artists.map((item, index) => (
                <TouchableOpacity
                  key={item._id}
                  style={[styles.featuredItem, index === 0 && styles.featuredItemFirst]}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: item.image_url || 'https://via.placeholder.com/200' }}
                    style={styles.featuredImage}
                    resizeMode="cover"
                  />
                  {/* Dark overlay untuk membuat tulisan lebih timbul */}
                  <View style={styles.featuredOverlay} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.85)']}
                    style={styles.featuredGradient}
                  >
                    <Text style={styles.featuredArtist} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

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
                    onPress={() => navigation.navigate('ResultDetailScreen')}
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
  // Featured Section (Horizontal Slider)
  featuredSection: {
    paddingTop: 60,
    paddingBottom: 32,
  },
  featuredScrollContent: {
    paddingRight: 20,
  },
  featuredItem: {
    width: width * 0.5,
    height: width * 0.5,
    marginLeft: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  featuredItemFirst: {
    marginLeft: 20,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    justifyContent: 'flex-end',
    height: '50%',
  },
  featuredArtist: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 24,
    color: '#FFFFFF',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
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
});
