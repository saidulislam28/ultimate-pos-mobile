import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, TouchableOpacity, SafeAreaView, RefreshControl, Modal, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import CommonHeader from '@/components/CommonHeader';
import { fetchContactsApi, ContactFilters } from '@/api/contact';
import { formatCurrency } from '@/utils/currencyFormatter';
import { router } from 'expo-router';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [contactType, setContactType] = useState<'customer' | 'supplier' | ''>('');
  const [isTypeModalVisible, setIsTypeModalVisible] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Debounced Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadData(1, searchQuery, contactType);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, contactType]);

  const loadData = async (page: number, query: string, type: 'customer' | 'supplier' | '') => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      setError(null);
      const response = await fetchContactsApi(page, { name: query, type });
      
      const newContacts = response?.data || [];
      const meta = response?.meta || {};

      if (page === 1) {
        setContacts(newContacts);
      } else {
        setContacts(prev => [...prev, ...newContacts]);
      }

      setCurrentPage(meta.current_page || page);
      setLastPage(meta.last_page || 1);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      if (page === 1) setError('Failed to load contacts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(1, searchQuery, contactType);
  }, [searchQuery, contactType]);

  const handleLoadMore = () => {
    if (currentPage < lastPage && !loadingMore && !loading) {
      loadData(currentPage + 1, searchQuery, contactType);
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 24 }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.PRIMARY_COLOR} />
      </View>
    );
  };

  const getInitials = (name: string) => {
    if (!name) return 'C';
    return name.charAt(0).toUpperCase();
  };

  const handleCall = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const renderItem = ({ item }: { item: any }) => {
    const isSupplier = item.type === 'supplier';
    const displayName = isSupplier && item.supplier_business_name ? item.supplier_business_name : (item.name || 'Unknown Contact');
    const isActive = item.contact_status === 'active';

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push(`/contacts/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: isSupplier ? '#E3F2FD' : '#F3E5F5' }]}>
            {isSupplier ? (
              <Ionicons name="briefcase-outline" size={24} color="#2196F3" />
            ) : (
              <Ionicons name="person-outline" size={24} color="#9C27B0" />
            )}
          </View>
          
          <View style={styles.headerInfo}>
            <Text style={styles.contactName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.contactId}>{item.contact_id} • {isSupplier ? 'Supplier' : 'Customer'}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: isActive ? '#E8F5E9' : '#FFEBEE' }]}>
            <Text style={[styles.statusText, { color: isActive ? '#4CAF50' : '#F44336' }]}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="call-outline" size={16} color={Colors.SUBTITLE_COLOR} />
            {item.mobile ? (
              <TouchableOpacity onPress={() => handleCall(item.mobile)}>
                <Text style={[styles.detailText, { color: Colors.PRIMARY_COLOR }]}>{item.mobile}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.detailText}>No mobile</Text>
            )}
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="wallet-outline" size={16} color={Colors.SUBTITLE_COLOR} />
            <Text style={[styles.detailText, { fontWeight: '600' }]}>
              {formatCurrency(item.balance || 0)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader text="Contacts" />
      
      <View style={styles.container}>
        {/* Search & Filter Bar */}
        <View style={styles.searchHeader}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.SUBTITLE_COLOR} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts..."
              placeholderTextColor={Colors.SUBTITLE_COLOR}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearIcon}>
                <Ionicons name="close-circle" size={18} color={Colors.SUBTITLE_COLOR} />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.filterButton, contactType !== '' && styles.filterButtonActive]} 
            onPress={() => setIsTypeModalVisible(true)}
          >
            <Ionicons 
              name="filter" 
              size={20} 
              color={contactType !== '' ? '#fff' : Colors.PRIMARY_COLOR} 
            />
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
            <TouchableOpacity style={styles.retryButton} onPress={() => loadData(1, searchQuery, contactType)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.PRIMARY_COLOR} />}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color={Colors.SUBTITLE_COLOR} />
                <Text style={styles.emptyText}>No contacts found.</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Type Filter Modal */}
      <Modal
        visible={isTypeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTypeModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsTypeModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Type</Text>
              <TouchableOpacity onPress={() => setIsTypeModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={() => { setContactType(''); setIsTypeModalVisible(false); }}
            >
              <Text style={[styles.modalOptionText, contactType === '' && { color: Colors.PRIMARY_COLOR, fontWeight: 'bold' }]}>All Contacts</Text>
              {contactType === '' && <Ionicons name="checkmark" size={20} color={Colors.PRIMARY_COLOR} />}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={() => { setContactType('customer'); setIsTypeModalVisible(false); }}
            >
              <Text style={[styles.modalOptionText, contactType === 'customer' && { color: Colors.PRIMARY_COLOR, fontWeight: 'bold' }]}>Customers Only</Text>
              {contactType === 'customer' && <Ionicons name="checkmark" size={20} color={Colors.PRIMARY_COLOR} />}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, { borderBottomWidth: 0 }]} 
              onPress={() => { setContactType('supplier'); setIsTypeModalVisible(false); }}
            >
              <Text style={[styles.modalOptionText, contactType === 'supplier' && { color: Colors.PRIMARY_COLOR, fontWeight: 'bold' }]}>Suppliers Only</Text>
              {contactType === 'supplier' && <Ionicons name="checkmark" size={20} color={Colors.PRIMARY_COLOR} />}
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
  searchHeader: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    zIndex: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#1C1C1E',
  },
  clearIcon: {
    padding: 4,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 128, 82, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.PRIMARY_COLOR,
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
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  contactId: {
    fontSize: 13,
    color: Colors.SUBTITLE_COLOR,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginLeft: 6,
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
