import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, View } from 'react-native';
import LogoSvg from './LogoSvg';

interface FloatingActionButtonProps {
  onPress: () => void;
  isListening?: boolean;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  isListening = false,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Always rotate logo continuously
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000, // 8 seconds for full rotation
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    if (isListening) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
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

      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset animations (except rotation)
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [isListening]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  return (
    <View style={styles.container}>
      {/* Outer glow rings when listening */}
      {isListening && (
        <>
          <Animated.View
            style={[
              styles.glowRing,
              styles.glowRing1,
              {
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.glowRing,
              styles.glowRing2,
              {
                opacity: glowOpacity.interpolate({
                  inputRange: [0.3, 0.8],
                  outputRange: [0.2, 0.5],
                }),
                transform: [
                  {
                    scale: glowScale.interpolate({
                      inputRange: [1, 1.3],
                      outputRange: [1.1, 1.5],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.glowRing,
              styles.glowRing3,
              {
                opacity: glowOpacity.interpolate({
                  inputRange: [0.3, 0.8],
                  outputRange: [0.1, 0.3],
                }),
                transform: [
                  {
                    scale: glowScale.interpolate({
                      inputRange: [1, 1.3],
                      outputRange: [1.2, 1.7],
                    }),
                  },
                ],
              },
            ]}
          />
        </>
      )}

      {/* Main FAB Button */}
      <TouchableOpacity
        style={styles.fabContainer}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.fab,
            {
              transform: [{ scale: pulseAnim }, { rotate: spin }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <LogoSvg width={55} height={55} color="#FFFFFF" />
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 35,
    left: '50%',
    transform: [{ translateX: -40 }],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  fabContainer: {
    shadowColor: '#FF9F4D',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 15,
  },
  fab: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF9F4D',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FF9F4D',
  },
  glowRing1: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  glowRing2: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  glowRing3: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
});

export default FloatingActionButton;
