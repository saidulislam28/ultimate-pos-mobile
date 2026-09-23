import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import CommonHeader from '@/components/CommonHeader';
import { fetchSellReturnsApi } from '@/api/sell-return';
import { fetchBusinessLocations } from '@/api/business';
import { formatCurrency } from '@/utils/currencyFormatter';

export default function SellReturnsScreen() {
  const [returns, setReturns] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedLocationId, setSelectedLocationId] = useState<string | number>('');
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    loadData(1, selectedLocationId);
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

  const loadData = async (page: number, locationId: string | number) => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      setError(null);
      const response = await fetchSellReturnsApi(page, { location_id: locationId });
      
      const newReturns = response?.data || [];
      const meta = response?.meta || {};

      if (page === 1) {
        setReturns(newReturns);
      } else {
        setReturns(prev => [...prev, ...newReturns]);
      }

      setCurrentPage(meta.current_page || page);
      setLastPage(meta.last_page || 1);
    } catch (err) {
      console.error('Error fetching sell returns:', err);
      if (page === 1) setError('Failed to load sell returns');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(1, selectedLocationId);
  }, [selectedLocationId]);

  const handleLoadMore = () => {
    if (currentPage < lastPage && !loadingMore && !loading) {
      loadData(currentPage + 1, selectedLocationId);
    }
  };

  const getSelectedLocationName = () => {
    if (!selectedLocationId) return 'All Locations';
    const loc = locations.find(l => l.id === selectedLocationId);
    return loc ? loc.name : 'Unknown Location';
  };

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 24 }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.PRIMARY_COLOR} />
      </View>
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const parentInvoice = item.return_parent_sell?.invoice_no || 'Unknown';
    const totalReturn = item.final_total || 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.invoiceNo}>{item.invoice_no || `RET-${item.id}`}</Text>
            <Text style={styles.dateText}>
              {item.transaction_date ? new Date(item.transaction_date).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.payment_status?.toUpperCase() || 'UNKNOWN'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Returned from Sale:</Text>
          <Text style={styles.infoValue}>{parentInvoice}</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Return Total:</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalReturn)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader text="Sell Returns" />
      
      <View style={styles.container}>
        {/* Filter Bar */}
        <View style={styles.filterHeader}>
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
        </View>

        {/* Content */}
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.PRIMARY_COLOR} />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadData(1, selectedLocationId)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={returns}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.PRIMARY_COLOR} />}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="return-down-back-outline" size={64} color={Colors.SUBTITLE_COLOR} />
                <Text style={styles.emptyText}>No sell returns found.</Text>
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
              keyExtractor={item => item.id.toString()}
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
  invoiceNo: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.PRIMARY_COLOR,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: Colors.SUBTITLE_COLOR,
  },
  statusBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF9800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.SUBTITLE_COLOR,
  },
  infoValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoader: {
    paddingVertical: 16,
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
