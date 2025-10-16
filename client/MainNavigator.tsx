import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet } from 'react-native';
import LyricScreen from './LyricScreen';
import SearchScreen from './SearchScreen';
import HistoryScreen from './HistoryScreen';
import HomeScreen from './HomeScreen';
import PlaylistDetailScreen from './PlaylistDetailScreen';
import BottomTabNavigator from './BottomTabNavigator';

export type RootStackParamList = {
  LyricScreen: undefined;
  SearchScreen: undefined;
  HistoryScreen: undefined;
  HomeScreen: undefined;
  MainTabs: undefined;
  PlaylistDetail: { playlist: any };
};

const Stack = createStackNavigator<RootStackParamList>();
const MainNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={BottomTabNavigator}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="SearchScreen" component={SearchScreen} />
      <Stack.Screen name="HistoryScreen" component={HistoryScreen} />
      <Stack.Screen name="LyricScreen" component={LyricScreen} />
      <Stack.Screen
        name="PlaylistDetail"
        component={PlaylistDetailScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;

const styles = StyleSheet.create({});
