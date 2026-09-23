import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import CommonHeader from '@/components/CommonHeader';
import { fetchCashRegistersApi } from '@/api/cash-register';
import { formatCurrency } from '@/utils/currencyFormatter';

export default function CashRegistersScreen() {
  const [registers, setRegisters] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState<string>(''); // '', 'open', 'close'
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData(1, statusFilter);
  }, [statusFilter]);

  const loadData = async (page: number, status: string) => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      setError(null);
      const response = await fetchCashRegistersApi(page, status);
      
      const newRegisters = response?.data || [];
      const meta = response?.meta || {};

      if (page === 1) {
        setRegisters(newRegisters);
      } else {
        setRegisters(prev => [...prev, ...newRegisters]);
      }

      setCurrentPage(meta.current_page || page);
      setLastPage(meta.last_page || 1);
    } catch (err) {
      console.error('Error fetching cash registers:', err);
      if (page === 1) setError('Failed to load cash registers');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(1, statusFilter);
  }, [statusFilter]);

  const handleLoadMore = () => {
    if (currentPage < lastPage && !loadingMore && !loading) {
      loadData(currentPage + 1, statusFilter);
    }
  };

  const getStatusLabel = () => {
    if (statusFilter === 'open') return 'Open Registers';
    if (statusFilter === 'close') return 'Closed Registers';
    return 'All Status';
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
    // API sometimes returns empty string for closed instead of 'close'
    const isOpen = item.status === 'open';
    const initialTransaction = item.cash_register_transactions?.find((t: any) => t.transaction_type === 'initial');
    const initialAmount = initialTransaction ? Number(initialTransaction.amount) : 0;
    const closingAmount = Number(item.closing_amount) || 0;
    
    const openedAt = item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A';
    const closedAt = item.closed_at ? new Date(item.closed_at).toLocaleString() : '-';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Ionicons name="cash-outline" size={20} color={Colors.PRIMARY_COLOR} />
            <Text style={styles.registerId}>Register #{item.id}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isOpen ? '#E8F5E9' : '#F5F5F5' }]}>
            <Text style={[styles.statusText, { color: isOpen ? '#4CAF50' : '#757575' }]}>
              {isOpen ? 'OPEN' : 'CLOSED'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.timeRow}>
          <View style={styles.timeCol}>
            <Text style={styles.timeLabel}>Opened At</Text>
            <Text style={styles.timeValue}>{openedAt}</Text>
          </View>
          <View style={styles.timeCol}>
            <Text style={styles.timeLabel}>Closed At</Text>
            <Text style={styles.timeValue}>{closedAt}</Text>
          </View>
        </View>

        <View style={styles.amountsContainer}>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Initial Amount</Text>
            <Text style={styles.amountValue}>{formatCurrency(initialAmount)}</Text>
          </View>
          <View style={styles.amountDivider} />
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Closing Amount</Text>
            <Text style={styles.amountValue}>{formatCurrency(closingAmount)}</Text>
          </View>
        </View>

      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader text="Cash Registers" />
      
      <View style={styles.container}>
        {/* Filter Bar */}
        <View style={styles.filterHeader}>
          <Text style={styles.filterLabel}>Status:</Text>
          <TouchableOpacity 
            style={styles.filterDropdown} 
            onPress={() => setIsStatusModalVisible(true)}
          >
            <Text style={styles.filterDropdownText}>{getStatusLabel()}</Text>
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
            <TouchableOpacity style={styles.retryButton} onPress={() => loadData(1, statusFilter)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={registers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.PRIMARY_COLOR} />}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="cash-outline" size={64} color={Colors.SUBTITLE_COLOR} />
                <Text style={styles.emptyText}>No cash registers found.</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Status Filter Modal */}
      <Modal visible={isStatusModalVisible} transparent animationType="fade" onRequestClose={() => setIsStatusModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsStatusModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Status</Text>
              <TouchableOpacity onPress={() => setIsStatusModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.modalOption} onPress={() => { setStatusFilter(''); setIsStatusModalVisible(false); }}>
              <Text style={[styles.modalOptionText, statusFilter === '' && { color: Colors.PRIMARY_COLOR, fontWeight: 'bold' }]}>All Status</Text>
              {statusFilter === '' && <Ionicons name="checkmark" size={20} color={Colors.PRIMARY_COLOR} />}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalOption} onPress={() => { setStatusFilter('open'); setIsStatusModalVisible(false); }}>
              <Text style={[styles.modalOptionText, statusFilter === 'open' && { color: Colors.PRIMARY_COLOR, fontWeight: 'bold' }]}>Open Registers</Text>
              {statusFilter === 'open' && <Ionicons name="checkmark" size={20} color={Colors.PRIMARY_COLOR} />}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalOption, { borderBottomWidth: 0 }]} onPress={() => { setStatusFilter('close'); setIsStatusModalVisible(false); }}>
              <Text style={[styles.modalOptionText, statusFilter === 'close' && { color: Colors.PRIMARY_COLOR, fontWeight: 'bold' }]}>Closed Registers</Text>
              {statusFilter === 'close' && <Ionicons name="checkmark" size={20} color={Colors.PRIMARY_COLOR} />}
            </TouchableOpacity>
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
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeCol: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: Colors.SUBTITLE_COLOR,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  amountsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  amountBox: {
    flex: 1,
    alignItems: 'center',
  },
  amountDivider: {
    width: 1,
    backgroundColor: '#EEEEEE',
    marginHorizontal: 12,
  },
  amountLabel: {
    fontSize: 12,
    color: Colors.SUBTITLE_COLOR,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
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
