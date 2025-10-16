import React, { useEffect, useRef } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { View, Animated } from 'react-native'
import SearchScreen from './SearchScreen'
import HistoryScreen from './HistoryScreen'
import HomeScreen from './HomeScreen'
import CurvedTabBar from './components/CurvedTabBar'
import FloatingActionButton from './components/FloatingActionButton'
import { ListeningProvider, useListening } from './contexts/ListeningContext'

export type BottomTabParamList = {
  Home: undefined
  Search: undefined
  History: undefined
}

const Tab = createBottomTabNavigator<BottomTabParamList>()

const BottomTabNavigatorContent = () => {
  const { isListening } = useListening()
  const slideAnim = useRef(new Animated.Value(0)).current

  // Animate tab bar slide down/up based on listening state
  useEffect(() => {
    if (isListening) {
      // Slide down (hide)
      Animated.timing(slideAnim, {
        toValue: 150, // Slide down beyond screen
        duration: 300,
        useNativeDriver: true,
      }).start()
    } else {
      // Slide up (show)
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start()
    }
  }, [isListening])

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={(props) => (
          <Animated.View
            style={{
              transform: [{ translateY: slideAnim }],
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
            }}
          >
            <CurvedTabBar {...props} />
            <FloatingActionButton
              onPress={() => {
                console.log('FAB pressed, navigating to Home')
                props.navigation.navigate('Home')
              }}
              isListening={isListening}
            />
          </Animated.View>
        )}
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
        }}
        initialRouteName='Home'
      >
        <Tab.Screen
          name='Search'
          component={SearchScreen}
        />
        <Tab.Screen
          name='Home'
          component={HomeScreen}
          options={{
            tabBarButton: () => null,
          }}
        />
        <Tab.Screen
          name='History'
          component={HistoryScreen}
        />
      </Tab.Navigator>
    </View>
  )
}

const BottomTabNavigator = () => {
  return (
    <ListeningProvider>
      <BottomTabNavigatorContent />
    </ListeningProvider>
  )
}

export default BottomTabNavigator
