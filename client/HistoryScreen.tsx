import { StyleSheet, View, ScrollView } from 'react-native'
import React from 'react'
import { Card, Text } from 'react-native-paper'

const HistoryScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* History Card */}
        <Card style={styles.historyCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>History</Text>
          </Card.Content>
        </Card>

        {/* History List Card */}
        <Card style={styles.historyListCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>History list</Text>
            <ScrollView style={styles.scrollView}>
              {/* Placeholder for history items */}
            </ScrollView>
          </Card.Content>
        </Card>
      </View>
    </View>
  )
}

export default HistoryScreen

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
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minHeight: 70,
  },
  historyListCard: {
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