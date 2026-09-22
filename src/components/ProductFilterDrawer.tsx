import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { fetchCategoriesApi, fetchBrandsApi, ProductFilters } from '@/api/product';

interface FilterItem {
  id: string | number;
  name: string;
}

interface ProductFilterDrawerProps {
  visible: boolean;
  onClose: () => void;
  currentFilters: ProductFilters;
  onApplyFilters: (filters: ProductFilters) => void;
}

export default function ProductFilterDrawer({ visible, onClose, currentFilters, onApplyFilters }: ProductFilterDrawerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  const [categories, setCategories] = useState<FilterItem[]>([]);
  const [brands, setBrands] = useState<FilterItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Accordion state
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true);
  const [isBrandsExpanded, setIsBrandsExpanded] = useState(true);

  // Local selection state (comma-separated strings)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    currentFilters.category_id ? currentFilters.category_id.split(',') : []
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    currentFilters.brand_id ? currentFilters.brand_id.split(',') : []
  );

  useEffect(() => {
    if (visible) {
      loadFilters();
      // Sync local state with current active filters when drawer opens
      setSelectedCategories(currentFilters.category_id ? currentFilters.category_id.split(',') : []);
      setSelectedBrands(currentFilters.brand_id ? currentFilters.brand_id.split(',') : []);
    }
  }, [visible, currentFilters]);

  const loadFilters = async () => {
    if (categories.length > 0 && brands.length > 0) return; // Already loaded

    setLoading(true);
    try {
      const [catsRes, brandsRes] = await Promise.all([
        fetchCategoriesApi().catch(() => null),
        fetchBrandsApi().catch(() => null),
      ]);

      const parsedCats = catsRes?.data?.data || catsRes?.data || [];
      const parsedBrands = brandsRes?.data?.data || brandsRes?.data || [];
      
      setCategories(parsedCats);
      setBrands(parsedBrands);
    } catch (error) {
      console.error('Failed to load filters', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (id: string | number) => {
    const idStr = id.toString();
    setSelectedCategories(prev => 
      prev.includes(idStr) ? prev.filter(i => i !== idStr) : [...prev, idStr]
    );
  };

  const toggleBrand = (id: string | number) => {
    const idStr = id.toString();
    setSelectedBrands(prev => 
      prev.includes(idStr) ? prev.filter(i => i !== idStr) : [...prev, idStr]
    );
  };

  const handleApply = () => {
    onApplyFilters({
      category_id: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
      brand_id: selectedBrands.length > 0 ? selectedBrands.join(',') : undefined,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
  };

  const renderFilterItem = (item: FilterItem, isSelected: boolean, onToggle: (id: string | number) => void) => (
    <TouchableOpacity 
      key={item.id} 
      style={[styles.filterItem, { borderBottomColor: themeColors.backgroundSelected }]} 
      onPress={() => onToggle(item.id)}
    >
      <Text style={[styles.filterText, { color: themeColors.text }]}>{item.name}</Text>
      <View style={[
        styles.checkbox, 
        { borderColor: themeColors.textSecondary },
        isSelected && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
      ]}>
        {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayBackground} onPress={onClose} activeOpacity={1} />
        
        <View style={[styles.drawer, { backgroundColor: themeColors.background }]}>
          <SafeAreaView style={styles.safeArea}>
            <View style={[styles.header, { borderBottomColor: themeColors.backgroundElement }]}>
              <Text style={[styles.headerTitle, { color: themeColors.text }]}>Filters</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={themeColors.primary} />
              </View>
            ) : (
              <ScrollView style={styles.content}>
                
                {/* Categories Accordion */}
                <View style={styles.accordionGroup}>
                  <TouchableOpacity 
                    style={[styles.accordionHeader, { backgroundColor: themeColors.backgroundElement }]} 
                    onPress={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                  >
                    <Text style={[styles.accordionTitle, { color: themeColors.text }]}>Categories</Text>
                    <Ionicons name={isCategoriesExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={themeColors.textSecondary} />
                  </TouchableOpacity>
                  
                  {isCategoriesExpanded && (
                    <View style={styles.accordionContent}>
                      {categories.map(cat => 
                        renderFilterItem(cat, selectedCategories.includes(cat.id.toString()), toggleCategory)
                      )}
                      {categories.length === 0 && (
                        <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>No categories found</Text>
                      )}
                    </View>
                  )}
                </View>

                {/* Brands Accordion */}
                <View style={styles.accordionGroup}>
                  <TouchableOpacity 
                    style={[styles.accordionHeader, { backgroundColor: themeColors.backgroundElement }]} 
                    onPress={() => setIsBrandsExpanded(!isBrandsExpanded)}
                  >
                    <Text style={[styles.accordionTitle, { color: themeColors.text }]}>Brands</Text>
                    <Ionicons name={isBrandsExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={themeColors.textSecondary} />
                  </TouchableOpacity>
                  
                  {isBrandsExpanded && (
                    <View style={styles.accordionContent}>
                      {brands.map(brand => 
                        renderFilterItem(brand, selectedBrands.includes(brand.id.toString()), toggleBrand)
                      )}
                      {brands.length === 0 && (
                        <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>No brands found</Text>
                      )}
                    </View>
                  )}
                </View>
                
              </ScrollView>
            )}

            <View style={[styles.footer, { borderTopColor: themeColors.backgroundElement }]}>
              <TouchableOpacity style={[styles.button, styles.resetButton, { borderColor: themeColors.primary }]} onPress={handleReset}>
                <Text style={[styles.buttonText, { color: themeColors.primary }]}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.applyButton, { backgroundColor: themeColors.primary }]} onPress={handleApply}>
                <Text style={[styles.buttonText, { color: '#fff' }]}>Apply</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    width: '80%',
    maxWidth: 350,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  accordionGroup: {
    marginBottom: 8,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  accordionContent: {
    paddingHorizontal: 16,
  },
  filterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterText: {
    fontSize: 15,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    padding: 16,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  applyButton: {
    
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});
