import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import CommonHeader from '@/components/CommonHeader';
import { fetchPaymentAccountsApi } from '@/api/payment-accounts';
import { fetchBusinessLocations } from '@/api/business';

export default function PaymentAccountsScreen() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedLocationId, setSelectedLocationId] = useState<string | number>('');
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    loadData(selectedLocationId);
  }, [selectedLocationId]);

  const loadLocations = async () => {
    try {
      const response = await fetchBusinessLocations();
      const locData = response?.data || response || [];
      setLocations(Array.isArray(locData) ? locData : []);
    } catch (err) {
      console.error('Failed to load locations', err);
    }
  };

  const loadData = async (locationId: string | number) => {
    setLoading(true);
    try {
      setError(null);
      const response = await fetchPaymentAccountsApi(locationId);
      const newAccounts = response?.data || response || [];
      setAccounts(Array.isArray(newAccounts) ? newAccounts : []);
    } catch (err) {
      console.error('Error fetching payment accounts:', err);
      setError('Failed to load payment accounts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(selectedLocationId);
  }, [selectedLocationId]);

  const getSelectedLocationName = () => {
    if (!selectedLocationId) return 'All Locations';
    const loc = locations.find(l => l.id === selectedLocationId);
    return loc ? loc.name : 'Unknown Location';
  };

  const renderItem = ({ item }: { item: any }) => {
    const isClosed = item.is_closed === 1;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="card-outline" size={24} color={Colors.PRIMARY_COLOR} />
            </View>
            <View>
              <Text style={styles.accountName}>{item.name}</Text>
              <Text style={styles.accountNumber}>{item.account_number || 'No Account Number'}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isClosed ? '#F5F5F5' : '#E8F5E9' }]}>
            <Text style={[styles.statusText, { color: isClosed ? '#757575' : '#4CAF50' }]}>
              {isClosed ? 'CLOSED' : 'ACTIVE'}
            </Text>
          </View>
        </View>
        
        {item.note && (
          <View style={styles.noteContainer}>
            <Text style={styles.noteLabel}>Note:</Text>
            <Text style={styles.noteText}>{item.note}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader text="Payment Accounts" />
      
      <View style={styles.container}>
        {/* Filter Bar */}
        {/* <View style={styles.filterHeader}>
          <Text style={styles.filterLabel}>Location:</Text>
          <TouchableOpacity 
            style={styles.filterDropdown} 
            onPress={() => setIsLocationModalVisible(true)}
          >
            <Text style={styles.filterDropdownText} numberOfLines={1}>
              {getSelectedLocationName()}
            </Text>
            <Ionicons name="chevron-down" size={16} color={Colors.SUBTITLE_COLOR} />
          </TouchableOpacity>
        </View> */}

        {/* Content */}
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.PRIMARY_COLOR} />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadData(selectedLocationId)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={accounts}
            keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.PRIMARY_COLOR} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="card-outline" size={64} color={Colors.SUBTITLE_COLOR} />
                <Text style={styles.emptyText}>No payment accounts found.</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Location Filter Modal */}
      <Modal
        visible={isLocationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLocationModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsLocationModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Location</Text>
              <TouchableOpacity onPress={() => setIsLocationModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>
            
            <FlatList 
              data={[{ id: '', name: 'All Locations' }, ...locations]}
              keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalOption} 
                  onPress={() => { 
                    setSelectedLocationId(item.id); 
                    setIsLocationModalVisible(false); 
                  }}
                >
                  <Text style={[styles.modalOptionText, selectedLocationId === item.id && { color: Colors.PRIMARY_COLOR, fontWeight: 'bold' }]}>
                    {item.name}
                  </Text>
                  {selectedLocationId === item.id && <Ionicons name="checkmark" size={20} color={Colors.PRIMARY_COLOR} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

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
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 10,
  },
  filterLabel: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
    marginRight: 12,
  },
  filterDropdown: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  filterDropdownText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 128, 82, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 14,
    color: Colors.SUBTITLE_COLOR,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  noteContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  noteLabel: {
    fontSize: 12,
    color: Colors.SUBTITLE_COLOR,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.SUBTITLE_COLOR,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
});
