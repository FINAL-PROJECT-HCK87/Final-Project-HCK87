import { StyleSheet, Text, View, ScrollView } from 'react-native'
import { Card } from 'react-native-paper'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

// Dummy data
const dummySong = {
  title: 'Blinding Lights',
  artist: 'The Weeknd',
  album: 'After Hours',
  lyrics: `Verse 1:\nI've been trying to call\nI've been on my own for long enough\nMaybe you can show me how to love, maybe\n\nChorus:\nI'm running out of time\n'Cause I can see the sun light up the sky\nSo I hit the road in overdrive, baby\n\nVerse 2:\nOh, the city's cold and empty\nNo one's around to judge me\nI can't see clearly when you're gone`
}

const LyricScreen = () => {
  return (
    <LinearGradient
      colors={['#FFE9D5', '#FFD4A3', '#FFB366', '#FF9F4D', '#FF8C3A']}
      locations={[0, 0.3, 0.5, 0.7, 1]}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Song Details</Text>
        
        {/* Song Info Card */}
        <Card style={styles.infoCard}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="musical-note" size={32} color="#FF8C3A" />
            </View>
            <View style={styles.songInfoContainer}>
              <Text style={styles.songTitle}>{dummySong.title}</Text>
              <Text style={styles.artistName}>{dummySong.artist}</Text>
              <Text style={styles.albumName}>{dummySong.album}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Lyrics Card */}
        <Card style={styles.lyricsCard}>
          <Card.Content>
            <View style={styles.lyricsHeaderContainer}>
              <Ionicons name="document-text" size={20} color="#FF8C3A" />
              <Text style={styles.lyricsHeader}>Lyrics</Text>
            </View>
            <Text style={styles.lyricsText}>{dummySong.lyrics}</Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </LinearGradient>
  )
}

export default LyricScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginTop: 50
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFE9D5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  songInfoContainer: {
    flex: 1,
  },
  songTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  albumName: {
    fontSize: 14,
    color: '#999',
  },
  lyricsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  lyricsHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  lyricsHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  lyricsText: {
    color: '#333',
    fontSize: 15,
    lineHeight: 24,
  },
})