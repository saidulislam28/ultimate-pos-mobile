import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, useColorScheme, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { formatCurrency, CurrencyData } from '@/utils/currencyFormatter';

export interface Product {
  id: number | string;
  name?: string;
  product_name?: string; // fallback
  sku?: string;
  image_url?: string;
  image?: string; // fallback
  sell_price_inc_tax?: number | string;
  price?: number | string; // fallback
  stock?: number;
  product_variations?: any[];
  [key: string]: any; // Allow other properties dynamically
}

interface ProductCardProps {
  product: Product;
  currencyConfig?: CurrencyData;
  viewMode?: 'grid' | 'list';
  onPress?: (product: Product) => void;
}

export default function ProductCard({ product, currencyConfig, viewMode = 'grid', onPress }: ProductCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const [imageError, setImageError] = useState(false);

  // Defensive mappings
  const name = product.name || product.product_name || 'Unknown Product';
  const sku = product.sku || 'No SKU';
  const imageUrl = product.image_url || product.image;
  
  // Price mapping - assuming Laravel POS defaults
  const rawPrice = product.sell_price_inc_tax || product.price || 
                  (product.product_variations?.[0]?.variations?.[0]?.sell_price_inc_tax) || 0;
  
  const formattedPrice = formatCurrency(rawPrice, currencyConfig);

  const isList = viewMode === 'list';

  // Fallback placeholder image URL
  const placeholderUrl = 'https://placehold.co/400x400/png?text=No+Image';
  const finalImageUrl = (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http') && !imageError) 
    ? imageUrl 
    : placeholderUrl;

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        isList && styles.containerList,
        { backgroundColor: themeColors.background, borderColor: themeColors.backgroundSelected }
      ]} 
      onPress={() => onPress && onPress(product)}
      activeOpacity={0.7}
    >
      <View style={[styles.imageContainer, isList && styles.imageContainerList]}>
        <Image 
          source={{ uri: finalImageUrl }} 
          style={styles.image} 
          resizeMode="cover" 
          onError={() => setImageError(true)}
        />
      </View>
      
      <View style={[styles.detailsContainer, isList && styles.detailsContainerList]}>
        <View style={isList && styles.listTextWrapper}>
          <Text style={[styles.name, isList && styles.nameList, { color: themeColors.text }]} numberOfLines={isList ? 1 : 2}>
            {name}
          </Text>
          <Text style={[styles.sku, isList && styles.skuList, { color: themeColors.textSecondary }]}>
            SKU: {sku}
          </Text>
        </View>
        
        <View style={[styles.bottomRow, isList && styles.bottomRowList]}>
          <Text style={[styles.price, isList && styles.priceList, { color: themeColors.primary }]}>
            {formattedPrice}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 6,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  containerList: {
    flexDirection: 'row',
    height: 90,
  },
  imageContainer: {
    height: 120,
    width: '100%',
    backgroundColor: '#f5f5f5',
  },
  imageContainerList: {
    height: '100%',
    width: 90,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  placeholderImage: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    padding: 12,
  },
  detailsContainerList: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listTextWrapper: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  nameList: {
    fontSize: 16,
    marginBottom: 2,
  },
  sku: {
    fontSize: 12,
    marginBottom: 8,
  },
  skuList: {
    marginBottom: 0,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  bottomRowList: {
    marginTop: 0,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  priceList: {
    fontSize: 18,
  }
});
