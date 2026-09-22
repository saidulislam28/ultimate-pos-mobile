import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/store/authStore';
import { fetchProfileApi } from '@/api/auth';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const { isAuthenticated, isLoading, setAuth, logout, setLoading } = useAuthStore();
  const segments = useSegments();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  useEffect(() => {
    // Check auth token on initial load
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('access_token');
        if (token) {
          // Verify token and fetch profile
          const profileResponse = await fetchProfileApi();
          const user = profileResponse?.data || profileResponse;
          const permissions = profileResponse?.meta?.permissions || user?.permissions || [];
          setAuth(token, user, permissions);
        } else {
          logout();
        }
      } catch (e) {
        // Token invalid or network error
        logout();
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect away from login if already authenticated
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.background }}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
    </Stack>
  );
}
