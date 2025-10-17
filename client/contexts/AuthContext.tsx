import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { instance } from '../utils/axios';

interface AuthContextType {
  deviceId: string | null;
  userId: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  deviceId: null,
  userId: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const getOrCreateDeviceId = async () => {
    let storedDeviceId = await AsyncStorage.getItem('device_id');
    if (storedDeviceId) {
      return storedDeviceId;
    }

    // const keys = await AsyncStorage.getAllKeys();
    // const result = await AsyncStorage.multiGet(keys);
    // await AsyncStorage.multiRemove(keys);
    // console.log('Semua data AsyncStorage:', result);
    const newDeviceId = Crypto.randomUUID();
    await AsyncStorage.setItem('device_id', newDeviceId);
    return newDeviceId;
  };

  const initializeAuth = async () => {
    try {
      const deviceIdValue = await getOrCreateDeviceId();
      setDeviceId(deviceIdValue);

      const response = await instance({
        url: '/users',
        method: 'POST',
        data: { device_id: deviceIdValue },
      });

      const { _id } = response.data;
      setUserId(_id);
      await AsyncStorage.setItem('user_id', _id);
    } catch (error) {
      console.error('❌ Error initializing auth:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ deviceId, userId, loading }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
