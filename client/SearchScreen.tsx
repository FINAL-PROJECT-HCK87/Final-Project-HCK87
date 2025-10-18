import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Poppins_700Bold, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Rajdhani_600SemiBold } from '@expo-google-fonts/rajdhani';
import { instance } from './utils/axios';

const { width } = Dimensions.get('window');

interface SearchScreenProps {
  navigation?: any;
}

// Dummy data for playlists - Modern single image design
const playlists = [
  {
    id: '1',
    title: 'Rumah Ke Rumah',
    description: '12 lagu • 45 menit',
    cover: 'https://i.scdn.co/image/ab67616d0000b273ef017e899c0547766997d874',
  },
  {
    id: '2',
    title: 'Tunggu Apa Lagi',
    description: '18 lagu • 58 menit',
    cover: 'https://i.scdn.co/image/ab67616d0000b273e6f407c7f3a0ec98845e4431',
  },
  {
    id: '3',
    title: 'Hitam Putih',
    description: '25 lagu • 1 jam 32 menit',
    cover: 'https://i.scdn.co/image/ab67616d0000b273be841ba4bc24340152e3a79a',
  },
  {
    id: '4',
    title: 'BIRDS OF A FEATHER',
    description: '15 lagu • 52 menit',
    cover: 'https://i.scdn.co/image/ab67616d0000b273ef017e899c0547766997d874',
  },
  {
    id: '5',
    title: 'Terbuang Dalam Waktu',
    description: '22 lagu • 1 jam 18 menit',
    cover: 'https://i.scdn.co/image/ab67616d0000b273e6f407c7f3a0ec98845e4431',
  },
  {
    id: '6',
    title: 'When We Were Young',
    description: '20 lagu • 1 jam 5 menit',
    cover: 'https://i.scdn.co/image/ab67616d0000b273be841ba4bc24340152e3a79a',
  },
  {
    id: '7',
    title: 'Pop Hits Indonesia',
    description: '30 lagu • 2 jam 15 menit',
    cover: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
  },
  {
    id: '8',
    title: 'Acoustic Sessions',
    description: '16 lagu • 48 menit',
    cover: 'https://i.scdn.co/image/ab67616d0000b273a91c10fe9472d9bd89802e5a',
  },
];

const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const [topSongs, setTopSongs] = useState<any[]>([]);

  let [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Rajdhani_600SemiBold,
  });

  useEffect(() => {
    fetchTopSongs();
  }, []);

  const fetchTopSongs = async () => {
    try {
      const response = await instance({
        method: 'GET',
        url: '/songs/top/popular',
      });

      if (response.data && response.data.top_songs) {
        setTopSongs(response.data.top_songs);
      }
    } catch (err: any) {
      console.error('Error fetching top songs:', err);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  const handlePlaylistPress = (playlist: any) => {
    navigation?.navigate('PlaylistDetail', { playlist });
  };

  const handleTopSongPress = (songId: string) => {
    navigation?.navigate('ResultDetailScreen', { songId });
  };

  return (
    <LinearGradient
      colors={['#FFE9D5', '#FFD4A3', '#FFB366', '#FF9F4D', '#FF8C3A']}
      locations={[0, 0.3, 0.5, 0.7, 1]}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Discover</Text>
        </View>

        {/* Top 4 Most Searched Songs */}
        {topSongs.length > 0 && (
          <View style={styles.topSongsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flame" size={22} color="#FF9F4D" />
              <Text style={styles.sectionTitle}>Trending Now</Text>
            </View>
            <View style={styles.topSongsList}>
              {topSongs.map((song, index) => (
                <TouchableOpacity
                  key={song._id}
                  style={styles.topSongItem}
                  activeOpacity={0.7}
                  onPress={() => handleTopSongPress(song._id)}
                >
                  <View style={styles.topSongRank}>
                    <Text style={styles.topSongRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.topSongContent}>
                    <Image source={{ uri: song.cover_art_url }} style={styles.topSongCover} />
                    <View style={styles.topSongInfo}>
                      <Text style={styles.topSongTitle} numberOfLines={2}>
                        {song.title}
                      </Text>
                      <Text style={styles.topSongArtist} numberOfLines={1}>
                        {song.artist}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Section Title for Playlists */}
        <View style={styles.playlistSectionHeader}>
          <Text style={styles.playlistSectionTitle}>Playlists for you</Text>
        </View>

        {/* Playlist List - Modern 1 Column Design */}
        <View style={styles.playlistList}>
          {playlists.map((playlist) => (
            <View key={playlist.id} style={styles.playlistItem}>
              <TouchableOpacity
                style={styles.playlistItemContent}
                activeOpacity={0.7}
                onPress={() => handlePlaylistPress(playlist)}
              >
                {/* Squircle Thumbnail with Gradient Overlay */}
                <View style={styles.thumbnailContainer}>
                  <Image
                    source={{ uri: playlist.cover }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                </View>

                {/* Text Content + Icon Container */}
                <View style={styles.contentRight}>
                  <View style={styles.textContainer}>
                    <Text style={styles.playlistTitle} numberOfLines={1}>
                      {playlist.title}
                    </Text>
                    <Text style={styles.playlistDescription} numberOfLines={1}>
                      {playlist.description}
                    </Text>
                  </View>

                  {/* Right Side: Menu Icon */}
                  <Ionicons name="chevron-forward" size={24} color="rgba(0, 0, 0, 0.7)" />
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 42,
    color: '#000000ff',
    letterSpacing: 3,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  // Top Songs Section
  topSongsSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: '#000000',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  topSongsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  topSongItem: {
    width: (width - 64) / 2,
    position: 'relative',
    backgroundColor: 'rgba(73, 71, 71, 0.2)',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(253, 253, 253, 0.84)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  topSongRank: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF9F4D',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#FF9F4D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  topSongRankText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  topSongContent: {
    gap: 12,
  },
  topSongCover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  topSongInfo: {
    gap: 4,
  },
  topSongTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#000000',
    lineHeight: 18,
  },
  topSongArtist: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.6)',
    lineHeight: 16,
  },
  // Playlist Section Title
  playlistSectionHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  playlistSectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: '#000000',
    letterSpacing: 0.3,
  },
  // Modern 1 Column List Styles
  playlistList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  playlistItem: {
    flexDirection: 'row',
  },
  playlistItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 16,
  },
  // Squircle Thumbnail
  thumbnailContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  // Content Right: Text + Icon with Border
  contentRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
    paddingBottom: 16,
  },
  // Text Hierarchy
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 16,
  },
  playlistTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#000000ff',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  playlistDescription: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.65)',
    letterSpacing: 0.4,
  },
});
