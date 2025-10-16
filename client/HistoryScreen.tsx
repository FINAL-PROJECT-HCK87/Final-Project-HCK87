import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import React, { use } from 'react';
import { Card, Text } from 'react-native-paper';
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
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Dummy data for featured artists (horizontal slider with artist photos)
const featuredItems = [
  {
    id: '1',
    artist: 'The Weeknd',
    image: 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb',
  },
  {
    id: '2',
    artist: 'Ed Sheeran',
    image: 'https://i.scdn.co/image/ab6761610000e5ebe03a98785f3658f0b6461ec4',
  },
  {
    id: '3',
    artist: 'Dua Lipa',
    image: 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb',
  },
  {
    id: '4',
    artist: 'Justin Bieber',
    image: 'https://i.scdn.co/image/ab6761610000e5eb8ae7f2aaa9817a704a87ea36',
  },
  {
    id: '5',
    artist: 'Olivia Rodrigo',
    image: 'https://i.scdn.co/image/ab6761610000e5ebe03a98785f3658f0b6461ec4',
  },
];

// Dummy data for history with album covers
const dummyHistory = [
  {
    id: '1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    duration: '3:20',
    cover: 'https://i.scdn.co/image/ab67616d0000b273ef017e899c0547766997d874',
  },
  {
    id: '2',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    duration: '3:53',
    cover: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
  },
  {
    id: '3',
    title: 'Levitating',
    artist: 'Dua Lipa',
    duration: '3:23',
    cover: 'https://i.scdn.co/image/ab67616d0000b273be841ba4bc24340152e3a79a',
  },
  {
    id: '4',
    title: 'Save Your Tears',
    artist: 'The Weeknd',
    duration: '3:35',
    cover: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
  },
  {
    id: '5',
    title: 'Peaches',
    artist: 'Justin Bieber',
    duration: '3:18',
    cover: 'https://i.scdn.co/image/ab67616d0000b273e6f407c7f3a0ec98845e4431',
  },
  {
    id: '6',
    title: 'drivers license',
    artist: 'Olivia Rodrigo',
    duration: '4:02',
    cover: 'https://i.scdn.co/image/ab67616d0000b273a91c10fe9472d9bd89802e5a',
  },
  {
    id: '7',
    title: 'good 4 u',
    artist: 'Olivia Rodrigo',
    duration: '2:58',
    cover: 'https://i.scdn.co/image/ab67616d0000b273a91c10fe9472d9bd89802e5a',
  },
  {
    id: '8',
    title: 'Stay',
    artist: 'The Kid LAROI & Justin Bieber',
    duration: '2:21',
    cover: 'https://i.scdn.co/image/ab67616d0000b273e46a155e6c8c5fb41e8fc875',
  },
];
interface HistoryScreenProps {
  navigation?: any;
}

const HistoryScreen = () => {
  const navigation = useNavigation<HistoryScreenProps['navigation']>();

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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Horizontal Slider for Featured Albums/Artists */}
        <View style={styles.featuredSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScrollContent}
            snapToInterval={width * 0.42}
            decelerationRate="fast"
          >
            {featuredItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.featuredItem, index === 0 && styles.featuredItemFirst]}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: item.image }}
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
                    {item.artist}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Your History Section */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Your History</Text>

          {dummyHistory.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ResultDetailScreen')}
            >
              <View style={styles.historyItem}>
                <View style={styles.historyItemLeft}>
                  <Image
                    source={{ uri: item.cover }}
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
                  <Text style={styles.historyDuration}>{item.duration}</Text>
                  <Ionicons name="chevron-forward" size={20} color="rgba(0, 0, 0, 0.6)" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
  sectionTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 38,
    color: '#000000ff',
    marginBottom: 24,
    letterSpacing: 3,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.12)',
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
});
