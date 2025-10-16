import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import React from 'react';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Poppins_700Bold, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Rajdhani_600SemiBold } from '@expo-google-fonts/rajdhani';

const { width, height } = Dimensions.get('window');

// Dummy featured playlists for carousel

// Dummy songs data
const dummySongs = [
  {
    id: '1',
    title: 'Change',
    artist: 'Deftones',
    duration: '3:12',
    cover: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
  },
  {
    id: '2',
    title: 'Reptilia',
    artist: 'The Strokes',
    duration: '4:38',
    cover: 'https://i.scdn.co/image/ab67616d0000b273be841ba4bc24340152e3a79a',
  },
  {
    id: '3',
    title: 'Tabu (Original Mix)',
    artist: 'ARTBAT',
    duration: '7:53',
    cover: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
  },
  {
    id: '4',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    duration: '3:20',
    cover: 'https://i.scdn.co/image/ab67616d0000b273ef017e899c0547766997d874',
  },
  {
    id: '5',
    title: 'Levitating',
    artist: 'Dua Lipa',
    duration: '3:23',
    cover: 'https://i.scdn.co/image/ab67616d0000b273be841ba4bc24340152e3a79a',
  },
];

interface PlaylistDetailScreenProps {
  route?: any;
  navigation?: any;
}

const PlaylistDetailScreen: React.FC<PlaylistDetailScreenProps> = ({ route, navigation }) => {
  const playlist = route?.params?.playlist || {
    title: 'Relax',
    description: '12 lagu • 45 menit',
    cover: 'https://i.scdn.co/image/ab67616d0000b273ef017e899c0547766997d874',
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
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header Section */}
          <View style={styles.headerWrapper}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation?.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={40} color="#000000ff" />
            </TouchableOpacity>

            <View style={styles.headerBackground} />

            {/* Vertical Text on Left */}
            <View style={styles.verticalTextContainer}>
              <View style={styles.verticalTextWrapper}>
                <Text style={styles.verticalText} numberOfLines={1}>
                  {playlist.title}
                </Text>
              </View>
            </View>

            {/* Overlapping Playlist Card - hanya 1 card */}
            <View style={styles.playlistCard}>
              <Image source={{ uri: playlist.cover }} style={styles.cardImage} resizeMode="cover" />
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

          {/* Songs List */}
          <View style={styles.songsList}>
            {dummySongs.map((song, index) => (
              <View key={song.id} style={styles.songItem}>
                <TouchableOpacity style={styles.songItemContent} activeOpacity={0.7}>
                  {/* Song Cover */}
                  <View style={styles.songCoverContainer}>
                    <Image
                      source={{ uri: song.cover }}
                      style={styles.songCover}
                      resizeMode="cover"
                    />
                  </View>

                  {/* Song Info + Duration */}
                  <View style={styles.songContentRight}>
                    <View style={styles.songTextContainer}>
                      <Text style={styles.songTitle} numberOfLines={1}>
                        {song.title}
                      </Text>
                      <Text style={styles.songArtist} numberOfLines={1}>
                        {song.artist}
                      </Text>
                    </View>

                    {/* Duration */}
                    <Text style={styles.songDuration}>{song.duration}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
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
    marginBottom: 40,
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
  // Songs List
  songsList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  songItem: {
    flexDirection: 'row',
  },
  songItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 12,
  },
  // Song Cover
  songCoverContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  songCover: {
    width: '100%',
    height: '100%',
  },
  // Song Content
  songContentRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
    paddingBottom: 12,
  },
  songTextContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 16,
  },
  songTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#000000ff',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  songArtist: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.65)',
    letterSpacing: 0.3,
  },
  songDuration: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.7)',
    letterSpacing: 0.3,
  },
});
