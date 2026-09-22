import React from 'react';
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
  onPress?: (product: Product) => void;
}

export default function ProductCard({ product, currencyConfig, onPress }: ProductCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  // Defensive mappings
  const name = product.name || product.product_name || 'Unknown Product';
  const sku = product.sku || 'No SKU';
  const imageUrl = product.image_url || product.image;
  
  // Price mapping - assuming Laravel POS defaults
  const rawPrice = product.sell_price_inc_tax || product.price || 
                  (product.product_variations?.[0]?.variations?.[0]?.sell_price_inc_tax) || 0;
  
  const formattedPrice = formatCurrency(rawPrice, currencyConfig);

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: themeColors.background, borderColor: themeColors.backgroundSelected }]} 
      onPress={() => onPress && onPress(product)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http') ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: themeColors.backgroundElement }]}>
            <Ionicons name="cube-outline" size={32} color={themeColors.textSecondary} />
          </View>
        )}
      </View>
      
      <View style={styles.detailsContainer}>
        <Text style={[styles.name, { color: themeColors.text }]} numberOfLines={2}>
          {name}
        </Text>
        <Text style={[styles.sku, { color: themeColors.textSecondary }]}>
          SKU: {sku}
        </Text>
        
        <View style={styles.bottomRow}>
          <Text style={[styles.price, { color: themeColors.primary }]}>
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
  imageContainer: {
    height: 120,
    width: '100%',
    backgroundColor: '#f5f5f5',
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
  name: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  sku: {
    fontSize: 12,
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
