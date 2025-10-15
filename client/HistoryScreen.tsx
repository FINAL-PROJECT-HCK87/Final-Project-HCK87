import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native'
import React from 'react'
import { Card, Text } from 'react-native-paper'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

// Dummy data for history
const dummyHistory = [
  { id: '1', title: 'Blinding Lights', artist: 'The Weeknd', date: '2 hours ago' },
  { id: '2', title: 'Shape of You', artist: 'Ed Sheeran', date: '5 hours ago' },
  { id: '3', title: 'Levitating', artist: 'Dua Lipa', date: '1 day ago' },
  { id: '4', title: 'Save Your Tears', artist: 'The Weeknd', date: '2 days ago' },
  { id: '5', title: 'Peaches', artist: 'Justin Bieber', date: '3 days ago' },
  { id: '6', title: 'drivers license', artist: 'Olivia Rodrigo', date: '4 days ago' },
  { id: '7', title: 'good 4 u', artist: 'Olivia Rodrigo', date: '5 days ago' },
  { id: '8', title: 'Stay', artist: 'The Kid LAROI & Justin Bieber', date: '1 week ago' },
]

const HistoryScreen = () => {
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
        <Text style={styles.headerTitle}>Your History</Text>
        
        {dummyHistory.map((item) => (
          <TouchableOpacity key={item.id} activeOpacity={0.7}>
            <Card style={styles.historyCard}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="musical-notes" size={24} color="#FF8C3A" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.songTitle}>{item.title}</Text>
                  <Text style={styles.artistName}>{item.artist}</Text>
                </View>
                <View style={styles.dateContainer}>
                  <Text style={styles.dateText}>{item.date}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </LinearGradient>
  )
}

export default HistoryScreen

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
  },
  historyCard: {
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
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
})