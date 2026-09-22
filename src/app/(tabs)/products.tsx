import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, useColorScheme, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchProductsApi, ProductFilters } from '@/api/product';
import ProductCard, { Product } from '@/components/ProductCard';
import ProductFilterDrawer from '@/components/ProductFilterDrawer';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

export default function ProductsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const { user } = useAuthStore();
  
  // Note: For a real app, you might want to fetch business details globally 
  // so currencyConfig is available everywhere. For now, we fallback to default formatCurrency behavior.

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter state
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({});

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadProducts(1, searchQuery, filters);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, filters]);

  const loadProducts = async (page: number, query: string, currentFilters: ProductFilters = filters) => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const response = await fetchProductsApi(page, query, currentFilters);
      
      // Defensively parse Laravel pagination (usually data.data or just data)
      const newProducts = response.data?.data || response.data || [];
      const meta = response.meta || response.data?.meta || {};
      
      if (page === 1) {
        setProducts(newProducts);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }

      setCurrentPage(meta.current_page || page);
      setLastPage(meta.last_page || 1);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts(1, searchQuery, filters);
  }, [searchQuery, filters]);

  const handleLoadMore = () => {
    if (currentPage < lastPage && !loadingMore && !loading) {
      loadProducts(currentPage + 1, searchQuery, filters);
    }
  };

  const handleApplyFilters = (newFilters: ProductFilters) => {
    setFilters(newFilters);
    // The useEffect will automatically trigger loadProducts when `filters` changes
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={themeColors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cube-outline" size={48} color={themeColors.textSecondary} />
        <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>No products found.</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.backgroundElement }]}>
      <View style={[styles.header, { backgroundColor: themeColors.background }]}>
        <View style={styles.headerRow}>
          <View style={[styles.searchContainer, { backgroundColor: themeColors.backgroundElement }]}>
            <Ionicons name="search" size={20} color={themeColors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Search products..."
              placeholderTextColor={themeColors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <Ionicons 
                name="close-circle" 
                size={20} 
                color={themeColors.textSecondary} 
                onPress={() => setSearchQuery('')} 
                style={styles.clearIcon}
              />
            )}
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="barcode-outline" size={22} color={themeColors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.iconButton, 
                (filters.brand_id || filters.category_id) && { backgroundColor: themeColors.primary }
              ]} 
              onPress={() => setIsFilterVisible(true)}
            >
              <Ionicons 
                name="options-outline" 
                size={22} 
                color={(filters.brand_id || filters.category_id) ? '#fff' : themeColors.primary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
            >
              <Ionicons name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'} size={22} color={themeColors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ProductFilterDrawer 
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        currentFilters={filters}
        onApplyFilters={handleApplyFilters}
      />

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          key={viewMode}
          data={products}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item }) => (
            <View style={viewMode === 'grid' ? styles.cardWrapperGrid : styles.cardWrapperList}>
              <ProductCard product={item} viewMode={viewMode} />
            </View>
          )}
          numColumns={viewMode === 'grid' ? 2 : 1}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          columnWrapperStyle={viewMode === 'grid' ? styles.columnWrapper : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 60, // Top inset spacing
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 8,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  clearIcon: {
    padding: 4,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 128, 82, 0.1)', // Light primary color for background
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 8,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  cardWrapperGrid: {
    flex: 0.5,
  },
  cardWrapperList: {
    flex: 1,
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
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
  }
});
