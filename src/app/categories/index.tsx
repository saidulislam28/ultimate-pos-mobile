import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import CommonHeader from '@/components/CommonHeader';
import { fetchCategoriesApi } from '@/api/category';

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData(1);
  }, []);

  const loadData = async (page: number) => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      setError(null);
      const response = await fetchCategoriesApi('product', page);
      
      const newCategories = response?.data || response || [];
      const meta = response?.meta || {};

      if (page === 1) {
        setCategories(newCategories);
      } else {
        setCategories(prev => [...prev, ...newCategories]);
      }

      setCurrentPage(meta.current_page || page);
      setLastPage(meta.last_page || 1);
    } catch (err) {
      console.error('Error fetching categories:', err);
      if (page === 1) setError('Failed to load categories');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(1);
  }, []);

  const handleLoadMore = () => {
    if (currentPage < lastPage && !loadingMore && !loading) {
      loadData(currentPage + 1);
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

  const renderItem = ({ item }: { item: any }) => {
    const hasSubCategories = item.sub_categories && item.sub_categories.length > 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="grid-outline" size={24} color={Colors.PRIMARY_COLOR} />
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.categoryName}>{item.name}</Text>
              {item.short_code && (
                <Text style={styles.shortCode}>Code: {item.short_code}</Text>
              )}
            </View>
          </View>
          {item.category_type && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{item.category_type}</Text>
            </View>
          )}
        </View>

        {item.description && (
          <Text style={styles.descriptionText}>{item.description}</Text>
        )}

        {hasSubCategories && (
          <View style={styles.subCategoriesContainer}>
            <Text style={styles.subCategoriesLabel}>Sub-Categories:</Text>
            <View style={styles.subCategoriesWrapper}>
              {item.sub_categories.map((sub: any) => (
                <View key={sub.id} style={styles.subCategoryPill}>
                  <Text style={styles.subCategoryText}>{sub.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader text="Categories" />
      
      <View style={styles.container}>
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.PRIMARY_COLOR} />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
            <View style={styles.retryButton}>
              <Text style={styles.retryText} onPress={() => loadData(1)}>Retry</Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.PRIMARY_COLOR} />}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="grid-outline" size={64} color={Colors.SUBTITLE_COLOR} />
                <Text style={styles.emptyText}>No categories found.</Text>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 128, 82, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  shortCode: {
    fontSize: 13,
    color: Colors.SUBTITLE_COLOR,
  },
  typeBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#757575',
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontSize: 14,
    color: '#424242',
    marginTop: 12,
    fontStyle: 'italic',
  },
  subCategoriesContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  subCategoriesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.SUBTITLE_COLOR,
    marginBottom: 8,
  },
  subCategoriesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subCategoryPill: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  subCategoryText: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '500',
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
});
