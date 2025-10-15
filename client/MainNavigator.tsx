import { createStackNavigator } from '@react-navigation/stack'
import { StyleSheet } from 'react-native'
import LyricScreen from './LyricScreen'
import SearchScreen from './SearchScreen'
import HistoryScreen from './HistoryScreen'

export type RootStackParamList = {
  LyricScreen: undefined
  SearchScreen: undefined
  HistoryScreen: undefined
}

const Stack = createStackNavigator<RootStackParamList>()
const MainNavigator = () => {
  return (
    
      <Stack.Navigator>
        <Stack.Screen name='HistoryScreen' component={HistoryScreen} />
        <Stack.Screen name='SearchScreen' component={SearchScreen} />
        <Stack.Screen name='LyricScreen' component={LyricScreen} />
      </Stack.Navigator>
    
  )
}

export default MainNavigator

const styles = StyleSheet.create({})