import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native'
import React from 'react'
import { Card, Text } from 'react-native-paper'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

// Dummy data for searches
const latestSearch = {
  id: '1',
  title: 'Blinding Lights',
  artist: 'The Weeknd',
  time: 'Just now'
}

const recentSearches = [
  { id: '2', title: 'Shape of You', artist: 'Ed Sheeran', time: '10 mins ago' },
  { id: '3', title: 'Levitating', artist: 'Dua Lipa', time: '1 hour ago' },
  { id: '4', title: 'Save Your Tears', artist: 'The Weeknd', time: '3 hours ago' },
  { id: '5', title: 'Peaches', artist: 'Justin Bieber', time: '5 hours ago' },
  { id: '6', title: 'drivers license', artist: 'Olivia Rodrigo', time: '1 day ago' },
]

const SearchScreen = () => {
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
        <Text style={styles.headerTitle}>Your Searches</Text>
        
        {/* Latest Search Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Search</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Card style={styles.searchCard}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="search" size={24} color="#FF8C3A" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.songTitle}>{latestSearch.title}</Text>
                  <Text style={styles.artistName}>{latestSearch.artist}</Text>
                </View>
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{latestSearch.time}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Recent Searches Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          {recentSearches.map((item) => (
            <TouchableOpacity key={item.id} activeOpacity={0.7}>
              <Card style={styles.searchCard}>
                <Card.Content style={styles.cardContent}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="time" size={24} color="#FF8C3A" />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.songTitle}>{item.title}</Text>
                    <Text style={styles.artistName}>{item.artist}</Text>
                  </View>
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{item.time}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  )
}

export default SearchScreen

const styles = StyleSheet.create({
  container: {
    flex: 1
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  searchCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    marginBottom: 12,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE9D5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    color: '#666',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
})