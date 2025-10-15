import { NavigationContainer, useNavigation } from '@react-navigation/native';
import MainNavigator, { RootStackParamList } from './MainNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export default function App() {
 
  return (
 <SafeAreaProvider>
  <NavigationContainer>
    <MainNavigator />
  </NavigationContainer>
 </SafeAreaProvider> 
  );
}

