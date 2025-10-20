import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet } from 'react-native';
import SearchScreen from './SearchScreen';
import HistoryScreen from './HistoryScreen';
import HomeScreen from './HomeScreen';
import PlaylistDetailScreen from './PlaylistDetailScreen';
import BottomTabNavigator from './BottomTabNavigator';
import SongResultDetail from './SongResultDetail';
import ConcertsScreen from './ConcertsScreen';

export type RootStackParamList = {
  LyricScreen: undefined;
  SearchScreen: undefined;
  HistoryScreen: undefined;
  HomeScreen: undefined;
  MainTabs: undefined;
  ResultDetailScreen: undefined;
  PlaylistDetail: { playlistId: string; playlist: any };
  Concerts: { artistId: string; artistName: string };
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
      <Stack.Screen
        name="PlaylistDetail"
        component={PlaylistDetailScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ResultDetailScreen"
        component={SongResultDetail}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Concerts"
        component={ConcertsScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;

const styles = StyleSheet.create({});
