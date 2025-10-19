import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { instance } from './utils/axios';

interface Venue {
  name: string;
  city: string;
  region: string;
  country: string;
  latitude: string;
  longitude: string;
}

interface Concert {
  id: string;
  title: string;
  datetime: string;
  venue: Venue;
  lineup: string[];
  description: string;
  url: string;
  offers: any[];
}

interface Artist {
  _id: string;
  name: string;
  image_url: string;
}

interface ConcertsScreenProps {
  route: {
    params: {
      artistId: string;
      artistName: string;
    };
  };
  navigation: any;
}

const ConcertsScreen: React.FC<ConcertsScreenProps> = ({ route, navigation }) => {
  const { artistId, artistName } = route.params;
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConcerts = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params: any = {
        date: 'upcoming',
        limit: 50,
      };

      console.log('Fetching concerts for artist:', artistId);
      const response = await instance.get(`/artists/${artistId}/concerts`, { params });

      console.log('Concerts response:', response.data);

      setArtist(response.data.artist);
      setConcerts(response.data.concerts || []);

      // Show message if API returned a message (like "no concerts" or "unable to fetch")
      if (response.data.message && response.data.concerts.length === 0) {
        console.log('API message:', response.data.message);
      }
    } catch (err: any) {
      console.error('Error fetching concerts:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Failed to load concerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConcerts();
  }, [artistId]);

  const formatDate = (datetime: string) => {
    const date = new Date(datetime);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const openEventUrl = (url: string) => {
    if (url) {
      Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#FFE9D5', '#FFD4A3', '#FFB366', '#FF9F4D', '#FF8C3A']}
        locations={[0, 0.3, 0.5, 0.7, 1]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading concerts...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#FFE9D5', '#FFD4A3', '#FFB366', '#FF9F4D', '#FF8C3A']}
      locations={[0, 0.3, 0.5, 0.7, 1]}
      style={styles.container}
    >
      {/* Header with Artist Info */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <MaterialCommunityIcons name="ticket-confirmation-outline" size={32} color="#000" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerSubtitle}>Upcoming Concerts</Text>
            <Text style={styles.headerTitle}>{artist?.name || artistName}</Text>
          </View>
        </View>

        <View style={styles.backButton} />
      </View>

      {/* Stats Bar */}
      {!loading && !error && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="calendar" size={24} color="#FF9F4D" />
            <Text style={styles.statNumber}>{concerts.length}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="ticket" size={24} color="#FF9F4D" />
            <Text style={styles.statNumber}>Available</Text>
            <Text style={styles.statLabel}>Tickets</Text>
          </View>
        </View>
      )}

      {/* Concerts List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchConcerts(true)}
            tintColor="#00d4ff"
          />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={48} color="#8B0000" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchConcerts()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : concerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="ticket-outline" size={64} color="#333" />
            <Text style={styles.emptyText}>No upcoming concerts found</Text>
            <Text style={styles.emptySubtext}>
              {artist?.name
                ? `${artist.name} has no scheduled concerts at the moment`
                : 'Check back later for tour dates'}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchConcerts()}>
              <Text style={styles.retryButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          concerts.map((concert, index) => {
            const concertDate = new Date(concert.datetime);
            const month = concertDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            const day = concertDate.getDate();

            return (
              <TouchableOpacity
                key={concert.id || index}
                style={styles.concertCard}
                onPress={() => openEventUrl(concert.url)}
                activeOpacity={0.8}
              >
                <View style={styles.cardContainer}>
                  {/* Left: Date Calendar */}
                  <View style={styles.calendarBox}>
                    <Text style={styles.calendarMonth}>{month}</Text>
                    <Text style={styles.calendarDay}>{day}</Text>
                  </View>

                  {/* Right: Concert Info */}
                  <View style={styles.concertInfo}>
                    {/* Title */}
                    <Text style={styles.concertTitle} numberOfLines={2}>
                      {concert.title}
                    </Text>

                    {/* Venue */}
                    <View style={styles.infoRow}>
                      <Ionicons name="location-sharp" size={16} color="#FF9F4D" />
                      <Text style={styles.venueText} numberOfLines={1}>
                        {concert.venue.name}
                      </Text>
                    </View>

                    {/* Location */}
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="map-marker-outline" size={16} color="#666" />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {concert.venue.city}
                        {concert.venue.country ? `, ${concert.venue.country}` : ''}
                      </Text>
                    </View>

                    {/* Time */}
                    <View style={styles.infoRow}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <Text style={styles.timeText}>
                        {concertDate.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>

                    {/* Get Tickets Button */}
                    {concert.url && (
                      <View style={styles.ticketButton}>
                        <MaterialCommunityIcons name="ticket-confirmation" size={18} color="#fff" />
                        <Text style={styles.ticketButtonText}>Get Tickets</Text>
                        <Ionicons name="chevron-forward" size={18} color="#fff" />
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Bottom Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#000',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextContainer: {
    alignItems: 'flex-start',
  },
  headerSubtitle: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 16,

    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 2,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  statNumber: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorText: {
    color: '#8B0000',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#000',
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFE9D5',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#333',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  concertCard: {
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: '#f3f1f175',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  calendarBox: {
    width: 70,
    height: 70,
    backgroundColor: '#050505ff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  calendarMonth: {
    color: '#FF9F4D',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  calendarDay: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: -4,
  },
  concertInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  concertTitle: {
    color: '#000',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  venueText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  locationText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  timeText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
  },
  ticketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FF9F4D',
    borderRadius: 12,
    marginTop: 8,
  },
  ticketButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ConcertsScreen;
