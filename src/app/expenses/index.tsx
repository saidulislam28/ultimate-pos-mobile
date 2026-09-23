import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import CommonHeader from '@/components/CommonHeader';
import { fetchExpensesApi, fetchExpenseCategoriesApi } from '@/api/expense';
import { fetchBusinessLocations } from '@/api/business';
import { formatCurrency } from '@/utils/currencyFormatter';

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedLocationId, setSelectedLocationId] = useState<string | number>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | number>('');
  
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFilterData();
  }, []);

  useEffect(() => {
    loadData(1, selectedLocationId, selectedCategoryId);
  }, [selectedLocationId, selectedCategoryId]);

  const loadFilterData = async () => {
    try {
      // Load locations
      const locResponse = await fetchBusinessLocations();
      const locData = locResponse?.data || locResponse || [];
      setLocations(Array.isArray(locData) ? locData : []);

      // Load categories and flatten them for the dropdown
      const catResponse = await fetchExpenseCategoriesApi();
      const catData = catResponse?.data || catResponse || [];
      const flatCategories: any[] = [];
      
      if (Array.isArray(catData)) {
        catData.forEach(cat => {
          flatCategories.push({ ...cat, isSubCategory: false });
          if (cat.sub_categories && Array.isArray(cat.sub_categories)) {
            cat.sub_categories.forEach((sub: any) => {
              flatCategories.push({ ...sub, isSubCategory: true });
            });
          }
        });
      }
      setCategories(flatCategories);
    } catch (err) {
      console.error('Failed to load filter data', err);
    }
  };

  const loadData = async (page: number, locationId: string | number, categoryId: string | number) => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      setError(null);
      const response = await fetchExpensesApi(page, { 
        location_id: locationId,
        expense_category_id: categoryId
      });
      
      const newExpenses = response?.data || [];
      const meta = response?.meta || {};

      if (page === 1) {
        setExpenses(newExpenses);
      } else {
        setExpenses(prev => [...prev, ...newExpenses]);
      }

      setCurrentPage(meta.current_page || page);
      setLastPage(meta.last_page || 1);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      if (page === 1) setError('Failed to load expenses');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(1, selectedLocationId, selectedCategoryId);
  }, [selectedLocationId, selectedCategoryId]);

  const handleLoadMore = () => {
    if (currentPage < lastPage && !loadingMore && !loading) {
      loadData(currentPage + 1, selectedLocationId, selectedCategoryId);
    }
  };

  const getSelectedLocationName = () => {
    if (!selectedLocationId) return 'All Locations';
    const loc = locations.find(l => l.id === selectedLocationId);
    return loc ? loc.name : 'Unknown';
  };

  const getSelectedCategoryName = () => {
    if (!selectedCategoryId) return 'All Categories';
    const cat = categories.find(c => c.id === selectedCategoryId);
    return cat ? cat.name : 'Unknown';
  };

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 24 }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.PRIMARY_COLOR} />
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return '#4CAF50';
      case 'due': return '#F44336';
      case 'partial': return '#FF9800';
      default: return Colors.SUBTITLE_COLOR;
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const totalExpense = item.final_total || 0;
    const dateStr = item.transaction_date ? new Date(item.transaction_date).toLocaleDateString() : 'N/A';
    
    // Attempt to format transaction for name nicely
    let transactionFor = 'Unknown';
    if (item.transaction_for) {
      const { first_name, last_name } = item.transaction_for;
      transactionFor = [first_name, last_name].filter(Boolean).join(' ');
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.invoiceNo}>{item.ref_no || `EXP-${item.id}`}</Text>
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.payment_status) + '15' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.payment_status) }]}>
              {item.payment_status?.toUpperCase() || 'UNKNOWN'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Expense For</Text>
            <View style={styles.iconTextRow}>
              <Ionicons name="person-outline" size={14} color={Colors.SUBTITLE_COLOR} />
              <Text style={styles.infoValue} numberOfLines={1}>{transactionFor}</Text>
            </View>
          </View>

          <View style={[styles.infoCol, { alignItems: 'flex-end' }]}>
            <Text style={styles.infoLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalExpense)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader text="Expenses" />
      
      <View style={styles.container}>
        {/* Filters Bar */}
        <View style={styles.filterHeader}>
          <TouchableOpacity 
            style={styles.filterDropdown} 
            onPress={() => setIsLocationModalVisible(true)}
          >
            <Text style={styles.filterDropdownText} numberOfLines={1}>
              {getSelectedLocationName()}
            </Text>
            <Ionicons name="location-outline" size={16} color={Colors.SUBTITLE_COLOR} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.filterDropdown} 
            onPress={() => setIsCategoryModalVisible(true)}
          >
            <Text style={styles.filterDropdownText} numberOfLines={1}>
              {getSelectedCategoryName()}
            </Text>
            <Ionicons name="pricetag-outline" size={16} color={Colors.SUBTITLE_COLOR} />
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
            <TouchableOpacity style={styles.retryButton} onPress={() => loadData(1, selectedLocationId, selectedCategoryId)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={expenses}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.PRIMARY_COLOR} />}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="wallet-outline" size={64} color={Colors.SUBTITLE_COLOR} />
                <Text style={styles.emptyText}>No expenses found.</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Location Filter Modal */}
      <Modal visible={isLocationModalVisible} transparent animationType="fade" onRequestClose={() => setIsLocationModalVisible(false)}>
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
                  onPress={() => { setSelectedLocationId(item.id); setIsLocationModalVisible(false); }}
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

      {/* Category Filter Modal */}
      <Modal visible={isCategoryModalVisible} transparent animationType="fade" onRequestClose={() => setIsCategoryModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsCategoryModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Category</Text>
              <TouchableOpacity onPress={() => setIsCategoryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>
            <FlatList 
              data={[{ id: '', name: 'All Categories' }, ...categories]}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.modalOption, item.isSubCategory && { paddingLeft: 32, backgroundColor: '#FAFAFA' }]} 
                  onPress={() => { setSelectedCategoryId(item.id); setIsCategoryModalVisible(false); }}
                >
                  <Text style={[styles.modalOptionText, selectedCategoryId === item.id && { color: Colors.PRIMARY_COLOR, fontWeight: 'bold' }]}>
                    {item.name}
                  </Text>
                  {selectedCategoryId === item.id && <Ionicons name="checkmark" size={20} color={Colors.PRIMARY_COLOR} />}
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
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
    zIndex: 10,
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
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginRight: 8,
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
    color: '#1C1C1E',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: Colors.SUBTITLE_COLOR,
  },
  statusBadge: {
    paddingHorizontal: 8,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  infoCol: {
    flex: 1,
  },
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.SUBTITLE_COLOR,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
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
    fontSize: 15,
    color: '#1C1C1E',
  },
});
