import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import CommonHeader from '@/components/CommonHeader';
import { fetchBusinessLocation } from '@/api/business';

export default function BusinessLocationDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadData(id as string);
    }
  }, [id]);

  const loadData = async (locationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchBusinessLocation(locationId);
      const data = response?.data || response;
      // In Laravel API, if data is an array, we extract the first item
      const item = Array.isArray(data) ? data[0] : data;
      
      if (!item) {
        setError('Location details not found.');
      } else {
        setLocation(item);
      }
    } catch (err) {
      console.error('Failed to load business location details:', err);
      setError('Failed to load business location details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CommonHeader text="Location Details" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY_COLOR} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !location) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CommonHeader text="Location Details" />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
          <Text style={styles.errorText}>{error || 'Not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isActive = location.is_active === 1;
  const addressParts = [location.landmark, location.city, location.state, location.zip_code, location.country].filter(Boolean);
  const fullAddress = addressParts.join(', ');

  const openMap = () => {
    if (fullAddress) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
      Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader text={location.name || 'Location Details'} />
      <ScrollView style={styles.container}>
        
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="business" size={40} color={Colors.PRIMARY_COLOR} />
          </View>
          <Text style={styles.title}>{location.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? '#E8F5E9' : '#FFEBEE' }]}>
            <Text style={[styles.statusText, { color: isActive ? '#4CAF50' : '#F44336' }]}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* Address Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Address</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={Colors.SUBTITLE_COLOR} />
            <Text style={styles.infoText}>{fullAddress || 'No Address Provided'}</Text>
          </View>
          {!!fullAddress && (
            <TouchableOpacity style={styles.actionButton} onPress={openMap}>
              <Ionicons name="navigate-outline" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>View on Map</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Contact Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          {!!location.mobile && (
            <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`tel:${location.mobile}`)}>
              <Ionicons name="call-outline" size={20} color={Colors.PRIMARY_COLOR} />
              <Text style={[styles.infoText, { color: Colors.PRIMARY_COLOR }]}>{location.mobile}</Text>
            </TouchableOpacity>
          )}
          
          {!!location.alternate_number && (
            <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`tel:${location.alternate_number}`)}>
              <Ionicons name="call-outline" size={20} color={Colors.SUBTITLE_COLOR} />
              <Text style={styles.infoText}>{location.alternate_number}</Text>
            </TouchableOpacity>
          )}
          
          {!!location.email && (
            <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`mailto:${location.email}`)}>
              <Ionicons name="mail-outline" size={20} color={Colors.PRIMARY_COLOR} />
              <Text style={[styles.infoText, { color: Colors.PRIMARY_COLOR }]}>{location.email}</Text>
            </TouchableOpacity>
          )}

          {!!location.website && (
            <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(location.website)}>
              <Ionicons name="globe-outline" size={20} color={Colors.PRIMARY_COLOR} />
              <Text style={[styles.infoText, { color: Colors.PRIMARY_COLOR }]}>{location.website}</Text>
            </TouchableOpacity>
          )}
          
          {!location.mobile && !location.email && !location.website && (
            <Text style={styles.emptyText}>No contact information available.</Text>
          )}
        </View>

        {/* Payment Methods */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          {location.payment_methods && Array.isArray(location.payment_methods) && location.payment_methods.length > 0 ? (
            <View style={styles.tagsContainer}>
              {location.payment_methods.map((method: any, index: number) => (
                <View key={index} style={styles.tagBadge}>
                  <Ionicons name="card-outline" size={14} color="#666" style={{ marginRight: 4 }} />
                  <Text style={styles.tagText}>{method.label || method.name}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No payment methods defined.</Text>
          )}
        </View>

        {/* POS / Printer Configuration */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>POS Configuration</Text>
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Print Receipt on Invoice:</Text>
            <Text style={styles.configValue}>{location.print_receipt_on_invoice === 1 ? 'Yes' : 'No'}</Text>
          </View>
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Receipt Printer Type:</Text>
            <Text style={styles.configValue}>{location.receipt_printer_type ? location.receipt_printer_type.toUpperCase() : 'N/A'}</Text>
          </View>
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
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 128, 82, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#1C1C1E',
    marginLeft: 12,
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.SUBTITLE_COLOR,
    fontStyle: 'italic',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.PRIMARY_COLOR,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  configLabel: {
    fontSize: 15,
    color: Colors.SUBTITLE_COLOR,
  },
  configValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginTop: 12,
  }
});
