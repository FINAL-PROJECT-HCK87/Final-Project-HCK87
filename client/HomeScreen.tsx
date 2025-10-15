import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import React from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import LogoSvg from './components/LogoSvg';

const HomeScreen = () => {
  return (
    <LinearGradient
      colors={['#FFE9D5', '#FFD4A3', '#FFB366', '#FF9F4D', '#FF8C3A']}
      locations={[0, 0.3, 0.5, 0.7, 1]}
      style={styles.container}
    >
      <View style={styles.glowContainer}>
        <View style={styles.glowOuter} />
        <View style={styles.glowMiddle} />
        <View style={styles.glowInner} />
      </View>

      {/* Shazam Logo Button */}
      <TouchableOpacity style={styles.logoButton} activeOpacity={0.8}>
        <View style={styles.logoCircle}>
          <LogoSvg width={400} height={400} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      {/* Action buttons at bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.iconWrapper}>
            <Ionicons name="cloud-upload" size={35} color="#FFFFFF" />
          </View>
          <Text style={styles.buttonText}>Upload File</Text>
        </TouchableOpacity>

      </View>
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
  logoButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 280,
    height: 280,
    borderRadius: 90,
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
    overflow: 'hidden',
  },
  logoImage: {
    width: 180,
    height: 180,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    paddingHorizontal: 20,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});