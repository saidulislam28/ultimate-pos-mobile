import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, RefreshControl, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import CommonHeader from '@/components/CommonHeader';
import { fetchBusinessLocations } from '@/api/business';

export default function BusinessLocationsScreen() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      const response = await fetchBusinessLocations();
      const data = response?.data || response;
      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load business locations:', err);
      setError('Failed to load business locations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const renderPaymentMethods = (methods: any[]) => {
    if (!methods || !Array.isArray(methods) || methods.length === 0) return null;
    return (
      <View style={styles.paymentMethodsContainer}>
        <Ionicons name="card-outline" size={16} color={Colors.SUBTITLE_COLOR} style={{ marginRight: 6 }} />
        <View style={styles.tagsContainer}>
          {methods.slice(0, 3).map((method: any, index: number) => (
            <View key={index} style={styles.tagBadge}>
              <Text style={styles.tagText}>{method.label || method.name}</Text>
            </View>
          ))}
          {methods.length > 3 && (
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>+{methods.length - 3}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const isActive = item.is_active === 1;
    const addressParts = [item.landmark, item.city, item.state, item.zip_code, item.country].filter(Boolean);
    const fullAddress = addressParts.join(', ');

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Ionicons name="business" size={24} color={Colors.PRIMARY_COLOR} />
            <Text style={styles.locationName}>{item.name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? '#E8F5E9' : '#FFEBEE' }]}>
            <Text style={[styles.statusText, { color: isActive ? '#4CAF50' : '#F44336' }]}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={18} color={Colors.SUBTITLE_COLOR} style={styles.infoIcon} />
          <Text style={styles.infoText}>{fullAddress || 'No Address Provided'}</Text>
        </View>

        {!!item.mobile && (
          <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`tel:${item.mobile}`)}>
            <Ionicons name="call-outline" size={18} color={Colors.SUBTITLE_COLOR} style={styles.infoIcon} />
            <Text style={[styles.infoText, { color: Colors.PRIMARY_COLOR }]}>{item.mobile}</Text>
          </TouchableOpacity>
        )}

        {!!item.email && (
          <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`mailto:${item.email}`)}>
            <Ionicons name="mail-outline" size={18} color={Colors.SUBTITLE_COLOR} style={styles.infoIcon} />
            <Text style={[styles.infoText, { color: Colors.PRIMARY_COLOR }]}>{item.email}</Text>
          </TouchableOpacity>
        )}

        {renderPaymentMethods(item.payment_methods)}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CommonHeader text="Business Locations" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY_COLOR} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader text="Business Locations" />
      
      <View style={styles.container}>
        {error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadData}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={locations}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.PRIMARY_COLOR} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="business-outline" size={48} color={Colors.SUBTITLE_COLOR} />
                <Text style={styles.emptyText}>No business locations found.</Text>
              </View>
            }
          />
        )}
      </View>
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
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    marginRight: 10,
    width: 20,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 15,
    color: '#1C1C1E',
    flex: 1,
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    gap: 6,
  },
  tagBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.PRIMARY_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.SUBTITLE_COLOR,
  }
});
