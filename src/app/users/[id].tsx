import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import CommonHeader from '@/components/CommonHeader';
import { fetchUserDetails } from '@/api/user';

export default function UserDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadData(id as string);
    }
  }, [id]);

  const loadData = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchUserDetails(userId);
      const data = response?.data || response;
      const item = Array.isArray(data) ? data[0] : data;
      
      if (!item) {
        setError('User details not found.');
      } else {
        setUser(item);
      }
    } catch (err) {
      console.error('Failed to load user details:', err);
      setError('Failed to load user details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    if (email) Linking.openURL(`mailto:${email}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CommonHeader text="User Details" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY_COLOR} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CommonHeader text="User Details" />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
          <Text style={styles.errorText}>{error || 'Not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const fullName = [user.surname, user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  const initial = user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U';
  
  const isActive = user.status?.toLowerCase() === 'active';
  const statusColor = isActive ? '#4CAF50' : (user.status?.toLowerCase() === 'inactive' ? '#F44336' : Colors.SUBTITLE_COLOR);

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader text={fullName || 'User Details'} />
      <ScrollView style={styles.container}>
        
        {/* Profile Header */}
        <View style={styles.headerSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{fullName || 'Unknown User'}</Text>
          {user.username && <Text style={styles.username}>@{user.username}</Text>}
          
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15', marginTop: 12 }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {user.status ? user.status.toUpperCase() : 'UNKNOWN'}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, !user.contact_no && styles.actionButtonDisabled]} 
            disabled={!user.contact_no}
            onPress={() => handleCall(user.contact_no)}
          >
            <Ionicons name="call" size={20} color={user.contact_no ? Colors.PRIMARY_COLOR : Colors.SUBTITLE_COLOR} />
            <Text style={[styles.actionText, !user.contact_no && { color: Colors.SUBTITLE_COLOR }]}>Call</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity 
            style={[styles.actionButton, !user.email && styles.actionButtonDisabled]} 
            disabled={!user.email}
            onPress={() => handleEmail(user.email)}
          >
            <Ionicons name="mail" size={20} color={user.email ? Colors.PRIMARY_COLOR : Colors.SUBTITLE_COLOR} />
            <Text style={[styles.actionText, !user.email && { color: Colors.SUBTITLE_COLOR }]}>Email</Text>
          </TouchableOpacity>
        </View>

        {/* Basic Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={Colors.SUBTITLE_COLOR} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color={Colors.SUBTITLE_COLOR} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Contact Number</Text>
              <Text style={styles.infoValue}>{user.contact_no || 'N/A'}</Text>
            </View>
          </View>
          
          {user.address && (
             <View style={styles.infoRow}>
               <Ionicons name="location-outline" size={20} color={Colors.SUBTITLE_COLOR} />
               <View style={styles.infoContent}>
                 <Text style={styles.infoLabel}>Address</Text>
                 <Text style={styles.infoValue}>{user.address}</Text>
               </View>
             </View>
          )}
        </View>

        {/* Personal Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          
          <View style={styles.gridContainer}>
            <View style={styles.gridItem}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{user.gender || '-'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.infoLabel}>Marital Status</Text>
              <Text style={styles.infoValue}>{user.marital_status || '-'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.infoLabel}>Blood Group</Text>
              <Text style={styles.infoValue}>{user.blood_group || '-'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.infoLabel}>DOB</Text>
              <Text style={styles.infoValue}>{user.dob ? new Date(user.dob).toLocaleDateString() : '-'}</Text>
            </View>
          </View>
        </View>

        {/* System Settings */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>System Info</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.SUBTITLE_COLOR} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>User Type / Role</Text>
              <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>{user.user_type || 'User'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="log-in-outline" size={20} color={Colors.SUBTITLE_COLOR} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Allow Login</Text>
              <Text style={styles.infoValue}>{user.allow_login === 1 ? 'Yes' : 'No'}</Text>
            </View>
          </View>
          
          {user.is_cmmsn_agnt === 1 && (
             <View style={styles.infoRow}>
               <Ionicons name="pie-chart-outline" size={20} color={Colors.SUBTITLE_COLOR} />
               <View style={styles.infoContent}>
                 <Text style={styles.infoLabel}>Commission Agent</Text>
                 <Text style={styles.infoValue}>{user.cmmsn_percent}%</Text>
               </View>
             </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.PRIMARY_COLOR,
    paddingTop: 44,
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F4F9',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F4F9',
  },
  headerSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
    textAlign: 'center',
  },
  username: {
    fontSize: 15,
    color: Colors.SUBTITLE_COLOR,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionDivider: {
    width: 1,
    backgroundColor: '#EEEEEE',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.PRIMARY_COLOR,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.SUBTITLE_COLOR,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: '45%',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginTop: 12,
  }
});
