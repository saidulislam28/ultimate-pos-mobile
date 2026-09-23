import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, useColorScheme, RefreshControl, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchSalesApi, SaleFilters } from '@/api/sell';
import { COLORS, Colors } from '@/constants/Colors';
import { formatCurrency } from '@/utils/currencyFormatter';

export default function SalesListScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const themeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const [filters, setFilters] = useState<SaleFilters>({});

  useEffect(() => {
    loadSales(1, filters);
  }, [filters]);

  const loadSales = async (page: number, currentFilters: SaleFilters = filters) => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const response = await fetchSalesApi(page, currentFilters);
      const newSales = response.data?.data || response.data || [];
      const meta = response.meta || response.data?.meta || {};

      if (page === 1) {
        setSales(newSales);
      } else {
        setSales(prev => [...prev, ...newSales]);
      }

      setCurrentPage(meta.current_page || page);
      setLastPage(meta.last_page || 1);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSales(1, filters);
  }, [filters]);

  const handleLoadMore = () => {
    if (currentPage < lastPage && !loadingMore && !loading) {
      loadSales(currentPage + 1, filters);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return '#4CAF50';
      case 'due': return '#F44336';
      case 'partial': return '#FF9800';
      default: return Colors.SUBTITLE_COLOR;
    }
  };

  const renderSaleItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.saleCard, { backgroundColor: themeColors.background, borderColor: (themeColors as any).backgroundElement || '#eee' }]}
      onPress={() => router.push(`/sell/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.invoiceNo, { color: Colors.PRIMARY_COLOR }]}>
          {item.invoice_no || `INV-${item.id}`}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.payment_status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.payment_status) }]}>
            {item.payment_status ? item.payment_status.toUpperCase() : 'UNKNOWN'}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color={Colors.SUBTITLE_COLOR} />
          <Text style={[styles.infoText, { color: themeColors.text }]}>
            {item.contact?.name || 'Walk-in Customer'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={Colors.SUBTITLE_COLOR} />
          <Text style={[styles.infoText, { color: Colors.SUBTITLE_COLOR }]}>
            {item.transaction_date ? new Date(item.transaction_date).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
      </View>

      <View style={[styles.cardFooter, { borderTopColor: '#F0F0F3' }]}>
        <Text style={[styles.totalLabel, { color: Colors.SUBTITLE_COLOR }]}>Total Amount</Text>
        <Text style={[styles.totalValue, { color: themeColors.text }]}>
          {formatCurrency(item.final_total || 0)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.PRIMARY_COLOR} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={48} color={Colors.SUBTITLE_COLOR} />
        <Text style={[styles.emptyText, { color: Colors.SUBTITLE_COLOR }]}>No sales found</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F0F0F3' }]}>
      <View style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: '#F0F0F3', flexDirection: 'row', justifyContent: 'space-between' }]}>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Sales History</Text>
        <TouchableOpacity onPress={() => router.push('/sell-return' as any)}>
          <Ionicons name="return-down-back-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY_COLOR} />
        </View>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSaleItem}
          contentContainerStyle={[
            styles.listContainer,
            sales.length === 0 && styles.emptyListContent,
          ]}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.PRIMARY_COLOR}
              colors={[Colors.PRIMARY_COLOR]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    alignItems: 'center',
    paddingTop: 50
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  saleCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  invoiceNo: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalLabel: {
    fontSize: 14,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
