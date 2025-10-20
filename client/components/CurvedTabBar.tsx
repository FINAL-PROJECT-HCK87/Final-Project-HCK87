import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 70;
const CURVE_HEIGHT = 30;
const NOTCH_DEPTH = 50;

const CurvedTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.container}>
      {/* SVG Curved Shape */}
      <Svg width={width} height={TAB_BAR_HEIGHT + CURVE_HEIGHT} style={styles.svgContainer}>
        <Path
          d={`
            M 0,${CURVE_HEIGHT}
            L 0,${TAB_BAR_HEIGHT + CURVE_HEIGHT}
            L ${width},${TAB_BAR_HEIGHT + CURVE_HEIGHT}
            L ${width},${CURVE_HEIGHT}
            L ${width * 0.68},${CURVE_HEIGHT}
            Q ${width * 0.63},${CURVE_HEIGHT} ${width * 0.59},${CURVE_HEIGHT - 10}
            Q ${width * 0.55},${CURVE_HEIGHT - 25} ${width * 0.5},${CURVE_HEIGHT - NOTCH_DEPTH}
            Q ${width * 0.45},${CURVE_HEIGHT - 25} ${width * 0.41},${CURVE_HEIGHT - 10}
            Q ${width * 0.37},${CURVE_HEIGHT} ${width * 0.32},${CURVE_HEIGHT}
            L 0,${CURVE_HEIGHT}
            Z
          `}
          fill="#FFFFFF"
          stroke="#E0E0E0"
          strokeWidth="1"
        />
      </Svg>

      {/* Tab Buttons */}
      <View style={styles.tabContainer}>
        {state.routes.map((route, index) => {
          // Skip rendering the center tab (Home) as it will be replaced by FAB
          if (route.name === 'Home') {
            return <View key={route.key} style={styles.emptyTab} />;
          }

          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          let label = '';

          if (route.name === 'Search') {
            iconName = isFocused ? 'search' : 'search-outline';
            label = 'Search';
          } else if (route.name === 'History') {
            iconName = isFocused ? 'library' : 'library-outline';
            label = 'Library';
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tab}
            >
              <Ionicons name={iconName} size={26} color={isFocused ? '#FF9F4D' : '#A0A0A5'} />
              <Text style={[styles.label, { color: isFocused ? '#FF9F4D' : '#A0A0A5' }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TAB_BAR_HEIGHT + CURVE_HEIGHT,
    elevation: 30,
    shadowColor: '#d45806ff',
    shadowOffset: {
      width: 0,
      height: -8,
    },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    zIndex: 100,
  },
  svgContainer: {
    position: 'absolute',
    bottom: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: CURVE_HEIGHT,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 4,
  },
  emptyTab: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default CurvedTabBar;
