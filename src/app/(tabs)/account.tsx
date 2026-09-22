import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/theme';

export default function AccountScreen() {
  const { user, logout } = useAuthStore();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('access_token');
      logout(); // This will trigger the root layout to redirect to /auth/login
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const displayName = user?.first_name 
    ? `${user.first_name} ${user.last_name || ''}`.trim() 
    : 'User';

  return (
    <View style={[styles.container, { backgroundColor: themeColors.backgroundElement }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: themeColors.background }]}>
          <View style={[styles.avatar, { backgroundColor: themeColors.primary }]}>
            <Text style={styles.avatarText}>{getInitials(user?.first_name)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: themeColors.text }]}>{displayName}</Text>
            <Text style={[styles.email, { color: themeColors.textSecondary }]}>{user?.email || 'No email provided'}</Text>
            <View style={styles.businessBadge}>
              <Ionicons name="business" size={14} color={themeColors.primary} />
              <Text style={[styles.businessName, { color: themeColors.primary }]}>
                {user?.business?.name || 'No Business Attached'}
              </Text>
            </View>
          </View>
        </View>

        {/* Dummy Navigations */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Preferences</Text>
          <View style={[styles.card, { backgroundColor: themeColors.background }]}>
            <MenuItem icon="person-outline" title="Edit Profile" themeColors={themeColors} />
            <MenuItem icon="settings-outline" title="App Settings" themeColors={themeColors} />
            <MenuItem icon="notifications-outline" title="Notifications" themeColors={themeColors} />
            <MenuItem icon="lock-closed-outline" title="Privacy & Security" themeColors={themeColors} isLast />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Support</Text>
          <View style={[styles.card, { backgroundColor: themeColors.background }]}>
            <MenuItem icon="help-circle-outline" title="Help Center" themeColors={themeColors} />
            <MenuItem icon="document-text-outline" title="Terms of Service" themeColors={themeColors} isLast />
          </View>
        </View>

      </ScrollView>

      {/* Logout Button */}
      <View style={[styles.footer, { backgroundColor: themeColors.background }]}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Reusable menu item component
function MenuItem({ icon, title, themeColors, isLast = false }: any) {
  return (
    <TouchableOpacity style={[styles.menuItem, !isLast && { borderBottomWidth: 1, borderBottomColor: themeColors.backgroundSelected }]}>
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon} size={22} color={themeColors.text} style={styles.menuIcon} />
        <Text style={[styles.menuItemText, { color: themeColors.text }]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 60, // Padding for status bar
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 8,
  },
  businessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 128, 82, 0.1)', // Primary color with low opacity
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  businessName: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 8,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.1)', // Red with low opacity
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  }
});
