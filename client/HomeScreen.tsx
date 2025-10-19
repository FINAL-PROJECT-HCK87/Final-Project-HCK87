import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Animated,
  Modal,
  Image,
  Linking,
  Alert,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import LogoSvg from './components/LogoSvg';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useListening } from './contexts/ListeningContext';
import { instance, heavyInstance } from './utils/axios';
import { useAuth } from './contexts/AuthContext';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { deviceId } = useAuth();
  const { setIsListening } = useListening();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const modalScale = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(-50)).current;
  const listeningOpacity = useRef(new Animated.Value(1)).current;
  const listeningScale = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;
  const visualizer1 = useRef(new Animated.Value(0)).current;
  const visualizer2 = useRef(new Animated.Value(0)).current;
  const visualizer3 = useRef(new Animated.Value(0)).current;
  const visualizer4 = useRef(new Animated.Value(0)).current;

  const spectrumBars = useRef(Array.from({ length: 12 }, () => new Animated.Value(0))).current;
  console.log(deviceId);

  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: {
        display: isRecording || isIdentifying ? 'none' : 'flex',
      },
    });
  }, [isRecording, isIdentifying, navigation]);

  useEffect(() => {
    setIsListening(isRecording || isIdentifying);
  }, [isRecording, isIdentifying, setIsListening]);

  useEffect(() => {
    if (isRecording || isIdentifying) {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(listeningOpacity, {
              toValue: 0.4,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(listeningScale, {
              toValue: 1.08,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(listeningOpacity, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(listeningScale, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    } else {
      listeningOpacity.setValue(1);
      listeningScale.setValue(1);
    }
  }, [isRecording, isIdentifying]);

  useEffect(() => {
    if (showModal) {
      // Animate in
      modalScale.setValue(0.3);
      modalOpacity.setValue(0);
      modalTranslateY.setValue(-50);

      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(modalTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(modalScale, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalTranslateY, {
          toValue: -30,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showModal]);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    }).catch(console.error);

    return () => {
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
      }
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
      Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!isRecording && !isIdentifying) {
      rotateAnim.setValue(0);
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        })
      ).start();

      // Multiple slow waves when idle for more dynamic look
      Animated.loop(
        Animated.sequence([
          Animated.timing(wave1, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(wave1, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();

      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(wave2, {
              toValue: 1,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(wave2, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, 800);

      // Subtle spectrum animation when idle
      spectrumBars.forEach((bar, index) => {
        setTimeout(() => {
          Animated.loop(
            Animated.sequence([
              Animated.timing(bar, {
                toValue: 0.3 + Math.random() * 0.2,
                duration: 800 + Math.random() * 400,
                useNativeDriver: true,
              }),
              Animated.timing(bar, {
                toValue: 0,
                duration: 800 + Math.random() * 400,
                useNativeDriver: true,
              }),
            ])
          ).start();
        }, index * 80);
      });
    }
  }, [isRecording, isIdentifying]);

  useEffect(() => {
    if (isRecording || isIdentifying) {
      // Logo rotate fast
      rotateAnim.setValue(0);
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();

      // Logo pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Multiple wave ripples with different timing
      const createWaveAnimation = (waveAnim: Animated.Value, delay: number) => {
        return setTimeout(() => {
          Animated.loop(
            Animated.sequence([
              Animated.timing(waveAnim, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
              }),
              Animated.timing(waveAnim, {
                toValue: 0,
                duration: 0,
                useNativeDriver: true,
              }),
            ])
          ).start();
        }, delay);
      };

      createWaveAnimation(wave1, 0);
      createWaveAnimation(wave2, 400);
      createWaveAnimation(wave3, 800);

      // Audio visualizer animations (using scaleY instead of height)
      const createVisualizerAnimation = (animValue: Animated.Value) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 300 + Math.random() * 200,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 300 + Math.random() * 200,
              useNativeDriver: true,
            }),
          ])
        );
      };

      createVisualizerAnimation(visualizer1).start();
      setTimeout(() => createVisualizerAnimation(visualizer2).start(), 100);
      setTimeout(() => createVisualizerAnimation(visualizer3).start(), 200);
      setTimeout(() => createVisualizerAnimation(visualizer4).start(), 300);

      // Circular spectrum bars - more active during recording
      spectrumBars.forEach((bar, index) => {
        setTimeout(() => {
          Animated.loop(
            Animated.sequence([
              Animated.timing(bar, {
                toValue: 0.5 + Math.random() * 0.5,
                duration: 150 + Math.random() * 150,
                useNativeDriver: true,
              }),
              Animated.timing(bar, {
                toValue: 0.2 + Math.random() * 0.3,
                duration: 150 + Math.random() * 150,
                useNativeDriver: true,
              }),
            ])
          ).start();
        }, index * 50);
      });
    } else {
      pulseAnim.setValue(1);
      wave1.setValue(0);
      wave2.setValue(0);
      wave3.setValue(0);
      visualizer1.setValue(0);
      visualizer2.setValue(0);
      visualizer3.setValue(0);
      visualizer4.setValue(0);
      spectrumBars.forEach((bar) => bar.setValue(0));
    }
  }, [isRecording, isIdentifying]);

  const requestAudioPermissions = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Microphone permission is required to record audio');
      return false;
    }
    return true;
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestAudioPermissions();
      if (!hasPermission) return;

      // Clear any existing timer
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
      }

      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (e) {}
        setRecording(null);
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setResult(null);
      setShowModal(false);

      // Auto-stop after 10 seconds
      recordingTimerRef.current = setTimeout(async () => {
        try {
          if (newRecording) {
            setIsRecording(false);
            setIsIdentifying(true);

            await newRecording.stopAndUnloadAsync();
            const uri = newRecording.getURI();

            await Audio.setAudioModeAsync({
              allowsRecordingIOS: false,
              playsInSilentModeIOS: true,
            });

            await identifySong(uri || '');
            setRecording(null);
          }
        } catch (err: any) {
          console.error('Failed to auto-stop recording', err);
          setIsRecording(false);
          setIsIdentifying(false);
        }
      }, 10000);
    } catch (err: any) {
      console.error('❌ ERROR:', err.message);
      setIsRecording(false);

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      } catch (e) {}

      Alert.alert(
        '⚠️ Cannot Record',
        'Audio session error.\n\n✅ Solution:\n1. FORCE CLOSE this app\n2. Wait 5 seconds\n3. Open app again',
        [{ text: 'OK' }]
      );
    }
  };

  const identifySong = async (fileUri: string) => {
    try {
      console.log('🎵 Sending audio to backend for recognition...');

      const formData = new FormData();
      formData.append('audio', {
        uri: fileUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      const response = await heavyInstance({
        url: '/songs/recognize',
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-device-id': deviceId,
        },
      });

      console.log('✅ Recognition successful:', response.data);

      const songData = {
        _id: response.data._id, // Add song ID for navigation
        title: response.data.title || 'Unknown',
        artist: response.data.artist || 'Unknown Artist',
        coverArt: response.data.cover_art_url || null,
        youtube: response.data.youtube || null,
      };

      setResult(songData);
      setShowModal(true);
    } catch (err: any) {
      console.error('❌ Recognition error:', err.message);

      let errorMessage = 'Failed to identify song';

      if (err.response) {
        // Backend error response
        errorMessage = err.response.data?.error || err.response.data?.message || errorMessage;
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again';
      } else if (err.message.includes('Network')) {
        errorMessage = 'Network error. Check your connection';
      }

      setResult({
        title: 'Error',
        artist: errorMessage,
        coverArt: null,
        youtube: null,
      });
      setShowModal(true);
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleLogoPress = () => {
    if (isRecording || isIdentifying) {
      return;
    } else {
      startRecording();
    }
  };

  const cancelListening = async () => {
    try {
      // Clear timer
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      // Stop recording if active
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      // Reset states
      setIsRecording(false);
      setIsIdentifying(false);
      setResult(null);
      setShowModal(false);
    } catch (err) {
      console.error('Failed to cancel', err);
      setIsRecording(false);
      setIsIdentifying(false);
    }
  };

  const openYoutube = async () => {
    if (result?.youtube) {
      const canOpen = await Linking.canOpenURL(result.youtube);
      if (canOpen) {
        await Linking.openURL(result.youtube);
      }
    }
  };

  const importVideo = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Media library permission is required to pick videos');
        return;
      }

      setIsIdentifying(true);

      // Launch video picker
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        const videoUri = pickerResult.assets[0].uri;

        setResult(null);
        setShowModal(false);

        // Identify song from imported video
        await identifySong(videoUri);
      } else {
        setIsIdentifying(false);
      }
    } catch (err: any) {
      console.error('Failed to import video', err);
      setResult({
        title: 'Error',
        artist: 'Failed to import video',
        coverArt: null,
        youtube: null,
      });
      setShowModal(true);
      setIsIdentifying(false);
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const waveScale1 = wave1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
  });

  const waveOpacity1 = wave1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0],
  });

  const waveScale2 = wave2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
  });

  const waveOpacity2 = wave2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0],
  });

  const waveScale3 = wave3.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
  });

  const waveOpacity3 = wave3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0],
  });

  return (
    <LinearGradient
      colors={['#FFE9D5', '#FFD4A3', '#FFB366', '#FF9F4D', '#FF8C3A']}
      locations={[0, 0.3, 0.5, 0.7, 1]}
      style={styles.container}
    >
      {/* Static glow and waves (when idle) */}
      {!isRecording && !isIdentifying && (
        <>
          <View style={styles.glowContainer}>
            <View style={styles.glowOuter} />
            <View style={styles.glowMiddle} />
            <View style={styles.glowInner} />
          </View>
          <View style={styles.waveContainer}>
            <Animated.View
              style={[
                styles.idleWave,
                {
                  transform: [{ scale: waveScale1 }],
                  opacity: waveOpacity1,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.idleWave,
                {
                  transform: [{ scale: waveScale2 }],
                  opacity: waveOpacity2,
                },
              ]}
            />
          </View>
        </>
      )}

      {/* Animated waves (visible when recording/identifying) */}
      {(isRecording || isIdentifying) && (
        <>
          <View style={styles.waveContainer}>
            <Animated.View
              style={[
                styles.wave,
                {
                  transform: [{ scale: waveScale1 }],
                  opacity: waveOpacity1,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.wave,
                {
                  transform: [{ scale: waveScale2 }],
                  opacity: waveOpacity2,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.wave,
                {
                  transform: [{ scale: waveScale3 }],
                  opacity: waveOpacity3,
                },
              ]}
            />
          </View>

          {/* Pulsing glow effect */}
          <View style={styles.glowContainer}>
            <Animated.View
              style={[
                styles.glowPulse,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.1],
                    outputRange: [0.3, 0.6],
                  }),
                },
              ]}
            />
          </View>
        </>
      )}

      {/* Circular Spectrum Visualizer - always visible, intensity varies */}
      <View style={styles.spectrumContainer}>
        {spectrumBars.map((bar, index) => {
          const angle = (index * 360) / 12;
          const radius = 160;
          const barScale = bar.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 2],
          });
          const barOpacity = bar.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.9],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.spectrumBar,
                {
                  opacity: barOpacity,
                  transform: [
                    { translateX: radius * Math.cos((angle * Math.PI) / 180) },
                    { translateY: radius * Math.sin((angle * Math.PI) / 180) },
                    { rotate: `${angle + 90}deg` },
                    { scaleY: barScale },
                  ],
                },
              ]}
            />
          );
        })}
      </View>

      {/* Audio visualizer bars */}
      {(isRecording || isIdentifying) && (
        <View style={styles.visualizerContainer}>
          <Animated.View
            style={[
              styles.visualizerBar,
              {
                transform: [
                  {
                    scaleY: visualizer1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1.5],
                    }),
                  },
                ],
                left: -120,
                top: 0,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.visualizerBar,
              {
                transform: [
                  {
                    scaleY: visualizer2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.7, 1.3],
                    }),
                  },
                ],
                right: -120,
                top: 0,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.visualizerBar,
              {
                transform: [
                  {
                    scaleY: visualizer3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 1.4],
                    }),
                  },
                ],
                left: -100,
                top: 80,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.visualizerBar,
              {
                transform: [
                  {
                    scaleY: visualizer4.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1.2],
                    }),
                  },
                ],
                right: -100,
                top: 80,
              },
            ]}
          />
        </View>
      )}

      {/* Logo Button */}
      <TouchableOpacity
        style={styles.logoButton}
        activeOpacity={0.8}
        onPress={handleLogoPress}
        disabled={isIdentifying}
      >
        <Animated.View
          style={[
            styles.logoCircle,
            {
              transform: [{ scale: pulseAnim }, { rotate: spin }],
            },
          ]}
        >
          <LogoSvg width={400} height={400} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>

      {/* Status text - Listening (for both recording and identifying) */}
      {(isRecording || isIdentifying) && (
        <>
          <Animated.View
            style={[
              styles.statusContainer,
              {
                opacity: listeningOpacity,
                transform: [{ scale: listeningScale }],
              },
            ]}
          >
            <View style={styles.statusBadge}>
              <View style={styles.recordingDot} />
              <Text style={styles.statusTextBold}>Listening</Text>
            </View>
          </Animated.View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={cancelListening}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </>
      )}

      {/* Upload button - Top Right Corner */}
      {!isRecording && !isIdentifying && (
        <TouchableOpacity style={styles.uploadButton} activeOpacity={0.8} onPress={importVideo}>
          <View style={styles.uploadButtonInner}>
            <Ionicons name="cloud-upload-outline" size={24} color="#FF9F4D" />
            <Text style={styles.uploadButtonText}>Import</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Result Modal - Dark Theme with Animation */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <Animated.View
            style={[
              styles.modalWrapper,
              {
                opacity: modalOpacity,
                transform: [{ scale: modalScale }, { translateY: modalTranslateY }],
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={(e) => {
                e.stopPropagation();
                // Navigate to SongDetail if we have a valid song ID
                if (
                  result?._id &&
                  result?.title !== 'Error' &&
                  result?.title !== 'Song Not Found'
                ) {
                  setShowModal(false);
                  navigation.navigate('ResultDetailScreen', { songId: result._id });
                }
              }}
              style={styles.modalContent}
            >
              <View style={styles.songCard}>
                {result?.coverArt ? (
                  <Image source={{ uri: result.coverArt }} style={styles.albumCover} />
                ) : (
                  <View style={[styles.albumCover, styles.albumCoverPlaceholder]}>
                    <Ionicons
                      name={
                        result?.title === 'Song Not Found' || result?.title === 'Error'
                          ? 'close-circle'
                          : 'musical-notes'
                      }
                      size={40}
                      color="#A0A0A5"
                    />
                  </View>
                )}

                <View style={styles.songInfo}>
                  <Text style={styles.songTitle} numberOfLines={2} ellipsizeMode="tail">
                    {result?.title}
                  </Text>
                  <Text style={styles.artistName} numberOfLines={1} ellipsizeMode="tail">
                    {result?.artist}
                  </Text>
                </View>

                {result?.youtube && (
                  <TouchableOpacity
                    style={styles.youtubeButton}
                    onPress={(e) => {
                      e.stopPropagation(); // Prevent navigation when YouTube button is pressed
                      openYoutube();
                    }}
                  >
                    <Ionicons name="logo-youtube" size={24} color="#FFF" />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  glowMiddle: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  glowInner: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  glowPulse: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  waveContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wave: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  idleWave: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  spectrumContainer: {
    position: 'absolute',
    width: 320,
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spectrumBar: {
    position: 'absolute',
    width: 5,
    height: 35,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  visualizerContainer: {
    position: 'absolute',
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualizerBar: {
    position: 'absolute',
    width: 4,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 2,
  },
  logoButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  statusContainer: {
    position: 'absolute',
    top: 100,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9F4D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#FF9F4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  statusTextBold: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    marginRight: 10,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  cancelButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  uploadButton: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 77, 0.3)',
  },
  uploadButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadButtonText: {
    color: '#FF9F4D',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingTop: 80,
  },
  modalWrapper: {
    width: '90%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: '#2C2C2E',
    borderRadius: 28,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  albumCover: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#3C3C3E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  albumCoverPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  songTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 24,
  },
  artistName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#A0A0A5',
    lineHeight: 20,
  },
  youtubeButton: {
    backgroundColor: '#FF0000',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
});
