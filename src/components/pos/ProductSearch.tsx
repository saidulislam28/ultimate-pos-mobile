import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { fetchProductsApi } from '@/api/product';
import { usePosStore, CartItem } from '@/store/usePosStore';

export default function ProductSearch() {
  const { addToCart } = usePosStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const delayDebounceFn = setTimeout(() => {
        searchProducts(searchQuery);
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setResults([]);
    }
  }, [searchQuery]);

  const searchProducts = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetchProductsApi(1, query);
      const data = response?.data || response || [];
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Product search failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (product: any) => {
    // Determine the variation to add. Usually, if there's only one variation, we add it directly.
    // In many POS systems, variations are handled. We'll pick the first variation for now.
    const variation = product.product_variations?.[0]?.variations?.[0];
    const variationId = variation?.id || 1; // Default fallback if data is weird
    const unitPrice = parseFloat(variation?.default_sell_price || '0');

    // Setup CartItem structure
    const cartItem: CartItem = {
      product_id: product.id,
      variation_id: variationId,
      name: product.name,
      quantity: 1,
      unit_price: unitPrice,
      discount_type: 'fixed',
      discount_amount: 0,
      enable_stock: product.enable_stock === 1,
      qty_available: parseFloat(product.total_qty_available || '0'),
    };

    addToCart(cartItem);
    setSearchQuery('');
    setResults([]);
    setIsFocused(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Search Product</Text>
      
      <View style={[styles.searchBox, isFocused && styles.searchBoxFocused]}>
        <Ionicons name="search" size={20} color={Colors.SUBTITLE_COLOR} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Enter product name or SKU..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay closing to allow taps to register
            setTimeout(() => setIsFocused(false), 200);
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {loading && <ActivityIndicator size="small" color={Colors.PRIMARY_COLOR} style={styles.loader} />}
      </View>

      {/* Autocomplete Results Dropdown */}
      {isFocused && (searchQuery.length > 2) && (
        <View style={styles.resultsContainer}>
          {results.length > 0 ? (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id.toString()}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 200 }}
              renderItem={({ item }) => {
                const qty = parseFloat(item.total_qty_available || '0');
                const outOfStock = item.enable_stock === 1 && qty <= 0;
                
                return (
                  <TouchableOpacity 
                    style={[styles.resultItem, outOfStock && styles.resultItemDisabled]} 
                    onPress={() => handleSelectProduct(item)}
                    disabled={outOfStock}
                  >
                    <View style={styles.resultItemHeader}>
                      <Text style={[styles.resultName, outOfStock && styles.textDisabled]}>{item.name}</Text>
                      {item.enable_stock === 1 && (
                        <View style={[styles.stockBadge, outOfStock ? styles.outOfStockBadge : styles.inStockBadge]}>
                          <Text style={[styles.stockText, outOfStock ? styles.outOfStockText : styles.inStockText]}>
                            {outOfStock ? 'Out of Stock' : `Qty: ${qty}`}
                          </Text>
                        </View>
                      )}
                    </View>
                    {item.sku && <Text style={[styles.resultSku, outOfStock && styles.textDisabled]}>SKU: {item.sku}</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          ) : !loading ? (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No products found.</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchBoxFocused: {
    borderColor: Colors.PRIMARY_COLOR,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  loader: {
    marginLeft: 8,
  },
  resultsContainer: {
    position: 'absolute',
    top: 76,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 100,
  },
  resultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  resultItemDisabled: {
    backgroundColor: '#FAFAFA',
  },
  resultItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
    marginRight: 8,
  },
  textDisabled: {
    color: '#9E9E9E',
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inStockBadge: {
    backgroundColor: '#E8F5E9',
  },
  outOfStockBadge: {
    backgroundColor: '#FFEBEE',
  },
  stockText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  inStockText: {
    color: '#2E7D32',
  },
  outOfStockText: {
    color: '#C62828',
  },
  resultSku: {
    fontSize: 13,
    color: Colors.SUBTITLE_COLOR,
    marginTop: 4,
  },
  noResults: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    color: Colors.SUBTITLE_COLOR,
    fontStyle: 'italic',
  }
});
