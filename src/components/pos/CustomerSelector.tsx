import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { usePosStore } from '@/store/usePosStore';
import { fetchContactsApi } from '@/api/contact';

export default function CustomerSelector() {
  const { contact_id, setCustomer } = usePosStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string | null>(null);

  // Load initial customers
  useEffect(() => {
    if (modalVisible && customers.length === 0) {
      loadCustomers('');
    }
  }, [modalVisible]);

  const loadCustomers = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetchContactsApi(1, { type: 'customer', name: query });
      const data = response?.data || response || [];
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load customers', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    // In a real app, use a debounce here.
    loadCustomers(text);
  };

  const selectCustomer = (customer: any) => {
    setCustomer(customer.id);
    setSelectedCustomerName(customer.name);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Customer *</Text>
      <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)}>
        <Text style={[styles.selectorText, !selectedCustomerName && { color: Colors.SUBTITLE_COLOR }]}>
          {selectedCustomerName || 'Select a Customer'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={Colors.SUBTITLE_COLOR} />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Customer</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.SUBTITLE_COLOR} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search customers..."
              value={searchQuery}
              onChangeText={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.PRIMARY_COLOR} style={{ marginTop: 24 }} />
          ) : (
            <FlatList
              data={customers}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.customerItem} onPress={() => selectCustomer(item)}>
                  <View style={styles.customerAvatar}>
                    <Text style={styles.avatarText}>{item.name ? item.name.charAt(0).toUpperCase() : 'C'}</Text>
                  </View>
                  <View>
                    <Text style={styles.customerName}>{item.name}</Text>
                    {item.contact_id && <Text style={styles.customerCode}>{item.contact_id}</Text>}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No customers found.</Text>
              }
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 14,
  },
  selectorText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F4F4F9',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  closeBtn: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  customerCode: {
    fontSize: 13,
    color: Colors.SUBTITLE_COLOR,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
    color: Colors.SUBTITLE_COLOR,
  },
});
