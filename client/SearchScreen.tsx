import { StyleSheet, View, ScrollView } from 'react-native'
import React from 'react'
import { Card, Text } from 'react-native-paper'

const SearchScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Latest Search Card */}
        <Card style={styles.latestSearchCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Latest search</Text>
          </Card.Content>
        </Card>

        {/* Recent Search Card */}
        <Card style={styles.recentSearchCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Recent search</Text>
            <ScrollView style={styles.scrollView}>
              {/* Placeholder for recent search items */}
            </ScrollView>
          </Card.Content>
        </Card>
      </View>
    </View>
  )
}

export default SearchScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  content: {
    flex: 1,
    gap: 16,
  },
  latestSearchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minHeight: 70,
  },
  recentSearchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flex: 1,
    minHeight: 200,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
})