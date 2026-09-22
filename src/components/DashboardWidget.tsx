import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

interface DashboardWidgetProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string; // Optional custom color, defaults to primary
}

export default function DashboardWidget({ title, value, icon, color }: DashboardWidgetProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const iconColor = color || themeColors.primary;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <Text style={[styles.title, { color: themeColors.textSecondary }]}>{title}</Text>
      </View>
      <View style={styles.body}>
        <Text style={[styles.value, { color: themeColors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 10,
    marginRight: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  body: {
    marginTop: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: 'bold',
  },
});
