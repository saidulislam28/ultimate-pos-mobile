import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { loginApi, fetchProfileApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/theme';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const setAuth = useAuthStore((state) => state.setAuth);
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Authenticate and get token
      const loginResponse = await loginApi({ username, password });
      
      const token = loginResponse?.data?.access_token || loginResponse?.access_token;
      
      if (!token) {
        throw new Error('No access token received from server.');
      }

      // 2. Store token securely
      await SecureStore.setItemAsync('access_token', token);

      // 3. Fetch user profile and permissions
      const profileResponse = await fetchProfileApi();
      const user = profileResponse?.data || profileResponse;
      
      // The connector module might return permissions within the user object
      // (e.g. user.permissions or meta.permissions)
      const permissions = profileResponse?.meta?.permissions || user?.permissions || [];

      // 4. Update global state
      setAuth(token, user, permissions);

      // 5. Navigate to Home
      router.replace('/(tabs)');
      
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Login failed. Please check your credentials.');
      // Cleanup token on failure
      await SecureStore.deleteItemAsync('access_token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.title, { color: themeColors.text }]}>Welcome Back</Text>
      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>Login to Ultimate POS Mobile</Text>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TextInput
        style={[styles.input, { borderColor: themeColors.backgroundSelected, color: themeColors.text }]}
        placeholder="Username or Email"
        placeholderTextColor={themeColors.textSecondary}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      
      <TextInput
        style={[styles.input, { borderColor: themeColors.backgroundSelected, color: themeColors.text }]}
        placeholder="Password"
        placeholderTextColor={themeColors.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: themeColors.primary }]} 
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  }
});
