import { StyleSheet, Text, View, ScrollView } from 'react-native'
import { Card } from 'react-native-paper'


const LyricScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Result Title Card */}
        <Card style={styles.titleCard}>
          <Card.Content>
            <Text style={styles.titleText}>Result title</Text>
          </Card.Content>
        </Card>

        {/* Result Lyrics Card */}
        <Card style={styles.lyricsCard}>
          <Card.Content>
            <Text style={styles.lyricsHeader}>Result Lyrics</Text>
            <ScrollView style={styles.lyricsScrollView}>
              <Text style={styles.lyricsText}>
                {/* Placeholder for lyrics */}
              </Text>
            </ScrollView>
          </Card.Content>
        </Card>
      </View>
    </View>
  )
}

export default LyricScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 16,
  },
  titleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minHeight: 60,
  },
  titleText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  lyricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flex: 1,
    minHeight: 400,
  },
  lyricsHeader: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  lyricsScrollView: {
    flex: 1,
  },
  lyricsText: {
    color: '#333',
    fontSize: 14,
    lineHeight: 22,
  },
})