import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import MainNavigator from './MainNavigator';

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FFB366',
        }}
      >
        <ActivityIndicator size="large" color="#FF9F4D" />
      </View>
    );
  }

  return <MainNavigator />;
}

export default function App() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </NavigationContainer>
  );
}
