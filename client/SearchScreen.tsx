import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import React from 'react';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Poppins_700Bold, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Rajdhani_600SemiBold } from '@expo-google-fonts/rajdhani';

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
  let [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Rajdhani_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handlePlaylistPress = (playlist: any) => {
    navigation?.navigate('PlaylistDetail', { playlist });
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
          <Text style={styles.headerTitle}>Playlist for you</Text>
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
