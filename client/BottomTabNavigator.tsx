import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import LyricScreen from './LyricScreen'
import SearchScreen from './SearchScreen'
import HistoryScreen from './HistoryScreen'
import HomeScreen from './HomeScreen'

export type BottomTabParamList = {
  Home: undefined
  Search: undefined
  History: undefined
  Lyrics: undefined
}

const Tab = createBottomTabNavigator<BottomTabParamList>()

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home'

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline'
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline'
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline'
          } else if (route.name === 'Lyrics') {
            iconName = focused ? 'musical-notes' : 'musical-notes-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#FF9F4D',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name='Home'
        component={HomeScreen}
      />
      <Tab.Screen
        name='Search'
        component={SearchScreen}
      />
      <Tab.Screen
        name='History'
        component={HistoryScreen}
      />
      <Tab.Screen
        name='Lyrics'
        component={LyricScreen}
      />
    </Tab.Navigator>
  )
}

export default BottomTabNavigator
