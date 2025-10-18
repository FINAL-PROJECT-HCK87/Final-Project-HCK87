import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Linking,
  Animated,
  ActivityIndicator,
  Dimensions,
  PanResponder,
  Platform,
  Modal,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import React, { useState, useEffect, useRef } from "react";
import { instance } from "./utils/axios";
import { Audio } from "expo-av";
import { useAuth } from "./contexts/AuthContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SongResultDetailProps {
  navigation?: any;
  route?: any;
}

const SongResultDetail: React.FC<SongResultDetailProps> = ({
  navigation,
  route,
}) => {
  const { deviceId } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [songData, setSongData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);

  // Modal state
  const modalY = useRef(new Animated.Value(SCREEN_HEIGHT * 0.92)).current;
  const modalStartY = useRef(0);

  // Playlist modal animation
  const playlistModalScale = useRef(new Animated.Value(0)).current;
  const playlistModalOpacity = useRef(new Animated.Value(0)).current;

  // Swipe animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  // PanResponder for swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        // Store the current position when gesture starts
        modalStartY.current = (modalY as any)._value;
      },
      onPanResponderMove: (_, gestureState) => {
        const newY = modalStartY.current + gestureState.dy;
        // Limit the movement - follow finger movement
        if (newY >= SCREEN_HEIGHT * 0.15 && newY <= SCREEN_HEIGHT * 0.98) {
          modalY.setValue(newY);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -100) {
          // Swipe up - expand
          Animated.spring(modalY, {
            toValue: SCREEN_HEIGHT * 0.15,
            useNativeDriver: false,
            tension: 50,
            friction: 8,
          }).start();
        } else if (gestureState.dy > 100) {
          // Swipe down - collapse
          Animated.spring(modalY, {
            toValue: SCREEN_HEIGHT * 0.92,
            useNativeDriver: false,
            tension: 50,
            friction: 8,
          }).start();
        } else {
          // Return to original position
          Animated.spring(modalY, {
            toValue: SCREEN_HEIGHT * 0.92,
            useNativeDriver: false,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  // Animation values for visualizer bars
  const bar1 = useRef(new Animated.Value(0.3)).current;
  const bar2 = useRef(new Animated.Value(0.5)).current;
  const bar3 = useRef(new Animated.Value(0.7)).current;
  const bar4 = useRef(new Animated.Value(0.4)).current;
  const bar5 = useRef(new Animated.Value(0.6)).current;

  // Animation for visualizer overlay fade in/out
  const visualizerOpacity = useRef(new Animated.Value(0)).current;

  // Animation for play button scale
  const playButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isPlaying && !audioLoading) {
      startAnimation();
      fadeInVisualizer();
    } else if (!isPlaying) {
      stopAnimation();
      fadeOutVisualizer();
    }
  }, [isPlaying, audioLoading]);

  const fetchPlaylists = async () => {
    // Dummy playlists data
    // const dummyPlaylists = [
    //   {
    //     _id: "1",
    //     name: "My Favorites",
    //     song_count: 12,
    //     cover_images: [
    //       "https://i.scdn.co/image/ab67616d0000b273e787cffec20aa2a396a61647",
    //       "https://i.scdn.co/image/ab67616d0000b2732c4f0a1c7bf8bb5b64b5a5f6",
    //       "https://i.scdn.co/image/ab67616d0000b273b5aa596b1e4b8e5d3e8dfe3a",
    //       "https://i.scdn.co/image/ab67616d0000b273f6c0a2d7e0c1f7a8d9b3c4e5",
    //     ],
    //   },
    //   {
    //     _id: "2",
    //     name: "Workout Mix",
    //     song_count: 8,
    //     cover_images: [
    //       "https://i.scdn.co/image/ab67616d0000b273a935e4689f15953311772cc4",
    //       "https://i.scdn.co/image/ab67616d0000b273c6f2f60e9b7e3b5d6a8c9d0e",
    //       "https://i.scdn.co/image/ab67616d0000b273d7f3f70e0c8e4b6d7a9d0e1f",
    //     ],
    //   },
    //   {
    //     _id: "3",
    //     name: "Chill Vibes",
    //     song_count: 5,
    //     cover_images: [
    //       "https://i.scdn.co/image/ab67616d0000b273e8f4f80f1d9f5c7e8b0e2f3a",
    //       "https://i.scdn.co/image/ab67616d0000b273f9f5f90f2e0f6d8f9c1f3a4b",
    //     ],
    //   },
    //   {
    //     _id: "4",
    //     name: "Party Hits",
    //     song_count: 1,
    //     cover_images: [
    //       "https://i.scdn.co/image/ab67616d0000b2730a0a091c2d1f7e9f0d2f4b5c",
    //     ],
    //   },
    //   {
    //     _id: "5",
    //     name: "Empty Playlist",
    //     song_count: 0,
    //     cover_images: [],
    //   },
    // ];
        try {
            const response = await instance({
                    method: 'GET',
                    url: '/playlists/all',
                    headers: {
                      'x-device-id': deviceId
                    }
                  });
            const {data} = response.data
            // console.log(data, "<<< ini data")
            setPlaylists(data);
            // console.log(playlists, "<<<<< INI PLAYLIST")
        } catch (error:unknown) {
          console.log(error as string)
        }
  };

  const openPlaylistModal = () => {
    fetchPlaylists();
    setShowPlaylistModal(true);
    Animated.parallel([
      Animated.spring(playlistModalScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(playlistModalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closePlaylistModal = () => {
    Animated.parallel([
      Animated.timing(playlistModalScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(playlistModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowPlaylistModal(false);
    });
  };

  const handleAddToPlaylist = async (
    playlistId: string,
    playlistName: string
  ) => {
    // Dummy implementation - just show success

    try {
      const response = await instance({
        method: "PUT",
        url: `/playlists/${playlistId}`,
        headers: {
          "x-device-id": deviceId,
        },
        data: { songData },
      });

      closePlaylistModal();
      Alert.alert("Success", `Added to "${playlistName}"!`);
    } catch (error: any) {
      // console.log(error.response.data.message as string);
      Alert.alert("Error", `${error.response.data.message}`);
    }
  };

  useEffect(() => {
    fetchSongDetail();
    fetchSearchHistory();

    // Load audio to get duration on mount
    const loadAudioDuration = async () => {
      try {
        const songId = route?.params?.songId;
        if (!songId) return;

        const response = await instance({
          method: "GET",
          url: `/songs/${songId}`,
        });

        const data = Array.isArray(response.data)
          ? response.data[0]
          : response.data;
        if (data?.preview_url) {
          // Create sound just to get duration
          const { sound: tempSound } = await Audio.Sound.createAsync(
            { uri: data.preview_url },
            { shouldPlay: false }
          );

          const status = await tempSound.getStatusAsync();
          if (status.isLoaded && status.durationMillis) {
            setDuration(status.durationMillis);
          }

          // Unload the temporary sound
          await tempSound.unloadAsync();
        }
      } catch (error) {
        console.error("Error loading duration:", error);
      }
    };

    loadAudioDuration();

    // Cleanup when component unmounts
    return () => {
      // Stop and unload sound when user leaves screen
      const cleanup = async () => {
        try {
          if (sound) {
            await sound.stopAsync();
            await sound.unloadAsync();
          }
        } catch (error) {
          console.error("Error cleaning up sound:", error);
        }
      };
      cleanup();
      setIsPlaying(false);
    };
  }, []); // Empty dependency - only run on mount/unmount

  // Add navigation listener to stop music when navigating away
  useEffect(() => {
    const unsubscribe = navigation?.addListener("beforeRemove", async () => {
      try {
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
        }
        setIsPlaying(false);
      } catch (error) {
        console.error("Error stopping sound on navigation:", error);
      }
    });

    return unsubscribe;
  }, [navigation, sound]);

  const fetchSearchHistory = async () => {
    try {
      const response = await instance({
        method: "GET",
        url: "/users/search-history",
        headers: {
          "x-device-id": deviceId,
        },
      });

      // console.log("Search History Response:", response.data);

      if (response.data && response.data.search_history) {
        // Extract _id from objects if they are objects, otherwise use the value directly
        const historyIds = response.data.search_history.map((item: any) => {
          if (typeof item === "object" && item !== null) {
            // If it's an object, get the _id field
            return String(item._id || item);
          }
          // If it's already a string, use it
          return String(item);
        });

        setSearchHistory(historyIds);

        // Find current song index in history
        const currentSongId = String(route?.params?.songId);
        const index = historyIds.indexOf(currentSongId);
        // console.log("Current song ID:", currentSongId);
        // console.log("History IDs:", historyIds);
        // console.log("Current index:", index);

        if (index !== -1) {
          setCurrentIndex(index);
        }
      }
    } catch (err: any) {
      console.error("Error fetching search history:", err);
    }
  };

  const fetchSongDetail = async (songId?: string, skipLoading = false) => {
    try {
      // Only show loading on initial load, not on next/prev
      if (!skipLoading) {
        setLoading(true);
      }
      setError(null);

      const idToFetch = songId || route?.params?.songId;

      if (!idToFetch) {
        throw new Error("Song ID not provided");
      }

      const response = await instance({
        method: "GET",
        url: `/songs/${idToFetch}`,
      });

      console.log("API Response:", response.data);
      // console.log("YouTube URL:", response.data?.youtube_url);
      // console.log("Preview URL:", response.data?.preview_url);

      if (response.data) {
        // Handle if response is an object directly or an array
        if (Array.isArray(response.data)) {
          if (response.data.length > 0) {
            setSongData(response.data[0]);
          } else {
            throw new Error("Song not found");
          }
        } else {
          setSongData(response.data);
        }
      } else {
        throw new Error("Song not found");
      }
    } catch (err: any) {
      console.error("Error fetching song details:", err);
      setError(err.message || "Failed to load song details");
    } finally {
      if (!skipLoading) {
        setLoading(false);
      }
    }
  };

  const animateSlide = (direction: "left" | "right", callback: () => void) => {
    const { width } = Dimensions.get("window");
    const startValue = direction === "right" ? -width : width;

    // Slide out current content
    Animated.timing(slideAnim, {
      toValue: startValue,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Execute callback (fetch new data)
      callback();

      // Reset position to opposite side
      slideAnim.setValue(-startValue);

      // Slide in new content
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleNext = async () => {
    if (searchHistory.length === 0) {
      // console.log("No search history available");
      return;
    }

    // Loop to first if at end
    const nextIndex =
      currentIndex < searchHistory.length - 1 ? currentIndex + 1 : 0;
    const nextSongId = searchHistory[nextIndex];

    console.log("Next button pressed");
    console.log("Current index:", currentIndex);
    console.log("Next index:", nextIndex);
    console.log("Next song ID:", nextSongId);

    if (!nextSongId) {
      console.error("Next song ID is undefined");
      return;
    }

    // Stop current sound
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
    setIsPlaying(false);
    setPosition(0);

    // Animate slide to left (next)
    animateSlide("left", async () => {
      setCurrentIndex(nextIndex);
      await fetchSongDetail(nextSongId, true);
    });
  };

  const handlePrevious = async () => {
    if (searchHistory.length === 0) {
      console.log("No search history available");
      return;
    }

    // Loop to last if at start
    const prevIndex =
      currentIndex > 0 ? currentIndex - 1 : searchHistory.length - 1;
    const prevSongId = searchHistory[prevIndex];

    console.log("Previous button pressed");
    console.log("Current index:", currentIndex);
    console.log("Previous index:", prevIndex);
    console.log("Previous song ID:", prevSongId);

    if (!prevSongId) {
      console.error("Previous song ID is undefined");
      return;
    }

    // Stop current sound
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
    setIsPlaying(false);
    setPosition(0);

    // Animate slide to right (previous)
    animateSlide("right", async () => {
      setCurrentIndex(prevIndex);
      await fetchSongDetail(prevSongId, true);
    });
  };

  const startAnimation = () => {
    const createAnimation = (animValue: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0.3,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      createAnimation(bar1, 400),
      createAnimation(bar2, 600),
      createAnimation(bar3, 500),
      createAnimation(bar4, 700),
      createAnimation(bar5, 550),
    ]).start();
  };

  const stopAnimation = () => {
    bar1.setValue(0.3);
    bar2.setValue(0.5);
    bar3.setValue(0.7);
    bar4.setValue(0.4);
    bar5.setValue(0.6);
  };

  const fadeInVisualizer = () => {
    Animated.timing(visualizerOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const fadeOutVisualizer = () => {
    Animated.timing(visualizerOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const animatePlayButton = () => {
    Animated.sequence([
      Animated.timing(playButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(playButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const artworkUrl = songData?.cover_art_url || songData?.artwork_url;

  // Format duration from milliseconds
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? "0" : ""}${seconds}`;
  };

  // Format release date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleOpenLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const handlePlayPress = async () => {
    try {
      if (!songData?.preview_url) {
        console.log("No preview URL available");
        return;
      }

      // If already playing, pause it
      if (isPlaying) {
        setIsPlaying(false);
        if (sound) {
          await sound.pauseAsync();
        }
        return;
      }

      // If sound already exists, just resume it
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          setIsPlaying(true);
          await sound.playAsync();
        }
        return;
      }

      // First time: Create new sound
      setAudioLoading(true);

      console.log("Loading Sound from:", songData.preview_url);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: songData.preview_url },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setAudioLoading(false);
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing sound:", error);
      setIsPlaying(false);
      setAudioLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading song details...</Text>
      </View>
    );
  }

  if (error || !songData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF4444" />
        <Text style={styles.errorText}>{error || "Song not found"}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            fetchSongDetail()
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButtonError}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonErrorText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#FFE9D5", "#FFD4A3", "#FFB366", "#FF9F4D", "#FF8C3A"]}
      locations={[0, 0.3, 0.5, 0.7, 1]}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back-outline" size={28} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preview</Text>
        <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
          <Ionicons name="ellipsis-horizontal" size={28} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Main Content with Slide Animation */}
      <Animated.View
        style={[
          styles.mainContent,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Album Artwork */}
        <View style={styles.artworkWrapper}>
          <Image source={{ uri: artworkUrl }} style={styles.mainArtwork} />
          <View style={styles.artworkOverlay} />
        </View>

        {/* Song Info */}
        <View style={styles.mainSongInfo}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.mainSongTitle} numberOfLines={1}>
                {songData.title}
              </Text>
              <Text style={styles.mainArtistName} numberOfLines={1}>
                {songData.artist_subtitle || songData.artist}
              </Text>
            </View>
            <TouchableOpacity onPress={openPlaylistModal} activeOpacity={0.7}>
              <Ionicons name="add-circle-outline" size={28} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${duration > 0 ? (position / duration) * 100 : 0}%` },
              ]}
            />
            <View
              style={[
                styles.progressThumb,
                { left: `${duration > 0 ? (position / duration) * 100 : 0}%` },
              ]}
            />
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatDuration(position)}</Text>
            <Text style={styles.timeText}>{formatDuration(duration)}</Text>
          </View>
        </View>

        {/* Player Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.controlButton}
            activeOpacity={0.7}
            onPress={handlePrevious}
          >
            <Ionicons name="play-skip-back" size={32} color="#000000" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playPauseButton}
            onPress={handlePlayPress}
            activeOpacity={0.8}
            disabled={audioLoading}
          >
            {audioLoading ? (
              <ActivityIndicator size="small" color="#FF9F4D" />
            ) : (
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={40}
                color="#FF9F4D"
                style={!isPlaying && { marginLeft: 3 }}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            activeOpacity={0.7}
            onPress={handleNext}
          >
            <Ionicons name="play-skip-forward" size={32} color="#000000" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Swipeable Song Detail Modal */}
      <Animated.View
        style={[
          styles.lyricsModal,
          {
            top: modalY,
            height: Animated.subtract(SCREEN_HEIGHT, modalY),
          },
        ]}
      >
        <BlurView intensity={80} tint="dark" style={styles.modalBlur}>
          {/* Handle Bar & Header - Swipeable Area */}
          <View {...panResponder.panHandlers}>
            <View style={styles.handleBar} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Ionicons name="chevron-up" size={20} color="#FFFFFF" />
              <Text style={styles.modalTitle}>SONG DETAIL</Text>
            </View>
          </View>

          {/* Song Detail Content */}
          <ScrollView
            style={styles.lyricsContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Title</Text>
              <Text style={styles.detailValue}>{songData?.title || "N/A"}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Artist</Text>
              <Text style={styles.detailValue}>
                {songData?.artist_subtitle || songData?.artist || "N/A"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Album</Text>
              <Text style={styles.detailValue}>{songData?.album || "N/A"}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Release Date</Text>
              <Text style={styles.detailValue}>
                {songData?.release_date
                  ? formatDate(songData.release_date)
                  : "N/A"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>
                {formatDuration(songData?.duration_ms || duration)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Genre</Text>
              <Text style={styles.detailValue}>{songData?.genre || "N/A"}</Text>
            </View>

            {/* Streaming Links */}
            <View style={styles.streamingSection}>
              <Text style={styles.streamingTitle}>Available On</Text>
              <View style={styles.streamingButtons}>
                {songData?.spotify_url && (
                  <TouchableOpacity
                    style={styles.streamingButton}
                    onPress={() => handleOpenLink(songData.spotify_url)}
                    activeOpacity={0.7}
                  >
                    <FontAwesome5 name="spotify" size={28} color="#1DB954" />
                    <Text style={styles.streamingButtonText}>Spotify</Text>
                  </TouchableOpacity>
                )}

                {songData?.youtube_url && (
                  <TouchableOpacity
                    style={styles.streamingButton}
                    onPress={() => handleOpenLink(songData.youtube_url)}
                    activeOpacity={0.7}
                  >
                    <FontAwesome5 name="youtube" size={28} color="#FF0000" />
                    <Text style={styles.streamingButtonText}>YouTube</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </BlurView>
      </Animated.View>

      {/* Add to Playlist Modal */}
      <Modal
        visible={showPlaylistModal}
        transparent
        animationType="none"
        onRequestClose={closePlaylistModal}
      >
        <TouchableOpacity
          style={styles.playlistModalOverlay}
          activeOpacity={1}
          onPress={closePlaylistModal}
        >
          <Animated.View
            style={[
              styles.playlistModalContainer,
              {
                opacity: playlistModalOpacity,
                transform: [{ scale: playlistModalScale }],
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <BlurView
                intensity={95}
                tint="dark"
                style={styles.playlistModalBlur}
              >
                {/* Modal Header */}
                <View style={styles.playlistModalHeader}>
                  <View style={styles.playlistModalIconContainer}>
                    <LinearGradient
                      colors={["#FF9F4D", "#FF8C3A"]}
                      style={styles.playlistModalIconGradient}
                    >
                      <Ionicons name="add-circle" size={28} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.playlistModalTitle}>Add to Playlist</Text>
                  <Text style={styles.playlistModalSubtitle}>
                    Choose a playlist for this song
                  </Text>
                </View>

                {/* Playlists List */}
                <ScrollView
                  style={styles.playlistsList}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.playlistsListContent}
                >
                  {playlists.length === 0 ? (
                    <View style={styles.emptyPlaylistsContainer}>
                      <Ionicons
                        name="musical-notes-outline"
                        size={48}
                        color="rgba(255,255,255,0.3)"
                      />
                      <Text style={styles.emptyPlaylistsText}>
                        No playlists yet
                      </Text>
                      <Text style={styles.emptyPlaylistsSubtext}>
                        Create a playlist in History tab
                      </Text>
                    </View>
                  ) : (
                    playlists.map((playlist) => (
                      <TouchableOpacity
                        key={playlist._id}
                        style={styles.playlistItem}
                        onPress={() =>
                          handleAddToPlaylist(playlist._id, playlist.playlist_name)
                        }
                        activeOpacity={0.7}
                      >
                        <View style={styles.playlistItemLeft}>
                          {/* Playlist Cover */}
                          {playlist.cover_images &&
                          playlist.cover_images.length > 0 ? (
                            <View style={styles.playlistItemCover}>
                              <Image
                                source={{ uri: playlist.cover_images[0] }}
                                style={styles.playlistItemCoverImage}
                                resizeMode="cover"
                              />
                            </View>
                          ) : (
                            <View style={styles.playlistItemCoverEmpty}>
                              <Ionicons
                                name="musical-notes"
                                size={20}
                                color="rgba(255,255,255,0.5)"
                              />
                            </View>
                          )}

                          {/* Playlist Info */}
                          <View style={styles.playlistItemInfo}>
                            <Text
                              style={styles.playlistItemName}
                              numberOfLines={1}
                            >
                              {playlist.playlist_name}
                            </Text>
                            <Text style={styles.playlistItemCount}>
                              {playlist.tracks.length}{" "}
                              {playlist.tracks.length <= 1 ? "song" : "songs"}
                            </Text>
                          </View>
                        </View>

                        <Ionicons name="add" size={24} color="#FF9F4D" />
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>

                {/* Cancel Button */}
                <TouchableOpacity
                  style={styles.playlistModalCancelButton}
                  onPress={closePlaylistModal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.playlistModalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </BlurView>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#000000",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#000000",
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 12,
  },
  retryButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  backButtonError: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonErrorText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    letterSpacing: 0.5,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  artworkWrapper: {
    alignItems: "center",
    marginBottom: 30,
    position: "relative",
  },
  mainArtwork: {
    width: 400,
    height: 400,
    borderRadius: 16,
    shadowColor: "#000000ff",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
    marginBottom: 35,
  },
  artworkOverlay: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    marginBottom: 35,
  },
  mainSongInfo: {
    marginBottom: 35,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mainSongTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  mainArtistName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 2,
    position: "relative",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#000000",
    borderRadius: 2,
  },
  progressThumb: {
    position: "absolute",
    top: -4,
    width: 12,
    height: 12,
    backgroundColor: "#000000",
    borderRadius: 6,
    marginLeft: -6,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    fontSize: 12,
    color: "#333333",
    fontWeight: "500",
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  playPauseButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#000000ff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  lyricsModal: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    overflow: "hidden",
  },
  modalBlur: {
    flex: 1,
    paddingTop: 10,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 15,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 1.5,
    marginLeft: 8,
  },
  lyricsContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  scrollContentContainer: {
    paddingBottom: 40,
  },
  lyricsText: {
    fontSize: 16,
    lineHeight: 28,
    color: "#FFFFFF",
    fontWeight: "400",
    textAlign: "center",
  },
  detailRow: {
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#FF9F4D",
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF9F4D",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    lineHeight: 24,
  },
  streamingSection: {
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: "rgba(255, 255, 255, 0.15)",
  },
  streamingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FF9F4D",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
  },
  streamingButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 20,
  },
  streamingButton: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    minWidth: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  streamingButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 8,
  },
  // Add to Playlist Modal
  playlistModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  playlistModalContainer: {
    width: "90%",
    maxWidth: 400,
    maxHeight: "70%",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 25,
  },
  playlistModalBlur: {
    padding: 20,
  },
  playlistModalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  playlistModalIconContainer: {
    marginBottom: 12,
  },
  playlistModalIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF9F4D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  playlistModalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  playlistModalSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
  playlistsList: {
    maxHeight: 300,
  },
  playlistsListContent: {
    paddingBottom: 10,
  },
  emptyPlaylistsContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyPlaylistsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 12,
  },
  emptyPlaylistsSubtext: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 6,
    textAlign: "center",
  },
  playlistItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 159, 77, 0.2)",
  },
  playlistItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  playlistItemCover: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 12,
  },
  playlistItemCoverImage: {
    width: "100%",
    height: "100%",
  },
  playlistItemCoverEmpty: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  playlistItemInfo: {
    flex: 1,
  },
  playlistItemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  playlistItemCount: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.6)",
  },
  playlistModalCancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  playlistModalCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default SongResultDetail;
