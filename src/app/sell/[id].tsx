import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, SafeAreaView, useColorScheme } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { fetchSaleDetailsApi } from '@/api/sell';
import CommonHeader from '@/components/CommonHeader';
import { Colors } from '@/constants/Colors';
import { formatCurrency } from '@/utils/currencyFormatter';
import { Ionicons } from '@expo/vector-icons';

export default function SaleDetailsScreen() {
  const { id } = useLocalSearchParams();
  const scheme = useColorScheme();
  
  const [saleData, setSaleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadSaleDetails(id as string);
    }
  }, [id]);

  const loadSaleDetails = async (saleId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchSaleDetailsApi(saleId);
      
      let data = response?.data || response;
      if (Array.isArray(data)) {
        data = data[0]; // Extract from array if wrapped
      }
      
      if (!data) {
        setError('Sale not found');
      } else {
        setSaleData(data);
      }
    } catch (err: any) {
      console.error('Error fetching sale details:', err);
      setError('Failed to load sale details.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return '#4CAF50';
      case 'due': return '#F44336';
      case 'partial': return '#FF9800';
      default: return Colors.SUBTITLE_COLOR || '#8E8E93';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CommonHeader text="Sale Details" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY_COLOR} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !saleData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CommonHeader text="Sale Details" />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error || 'Sale not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const themeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader text={`Invoice ${saleData.invoice_no || ''}`} />
      
      <ScrollView style={[styles.container, { backgroundColor: '#F4F4F9' }]}>
        
        {/* Transaction Header */}
        <View style={styles.receiptHeader}>
          <Ionicons name="checkmark-circle" size={48} color={getStatusColor(saleData.payment_status)} />
          <Text style={styles.receiptTotal}>{formatCurrency(saleData.final_total || 0)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(saleData.payment_status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(saleData.payment_status) }]}>
              {saleData.payment_status ? saleData.payment_status.toUpperCase() : 'UNKNOWN'}
            </Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Invoice No:</Text>
            <Text style={styles.infoValue}>{saleData.invoice_no || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date:</Text>
            <Text style={styles.infoValue}>
              {saleData.transaction_date ? new Date(saleData.transaction_date).toLocaleString() : 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Customer:</Text>
            <Text style={styles.infoValue}>
              {saleData.contact?.name || (saleData.contact_id ? `Customer ID: ${saleData.contact_id}` : 'Walk-in Customer')}
            </Text>
          </View>
        </View>

        {/* Products Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({saleData.sell_lines?.length || 0})</Text>
          {saleData.sell_lines && saleData.sell_lines.length > 0 ? (
            saleData.sell_lines.map((line: any, index: number) => {
              const productName = line.product?.name || 'Unknown Product';
              const variationName = line.variations?.name && line.variations.name !== 'DUMMY' ? ` - ${line.variations.name}` : '';
              const quantity = Number(line.quantity) || 0;
              const unitPrice = Number(line.unit_price_inc_tax) || 0;
              const lineTotal = quantity * unitPrice;

              return (
                <View key={index} style={styles.productItem}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{productName}{variationName}</Text>
                    <Text style={styles.productDetails}>{quantity} x {formatCurrency(unitPrice)}</Text>
                  </View>
                  <Text style={styles.productTotal}>{formatCurrency(lineTotal)}</Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.infoValue}>No products found.</Text>
          )}
        </View>

        {/* Amounts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Subtotal</Text>
            <Text style={styles.amountValue}>{formatCurrency(saleData.total_before_tax || 0)}</Text>
          </View>
          
          {Number(saleData.discount_amount) > 0 && (
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>
                Discount ({saleData.discount_type === 'percentage' ? '%' : 'Fixed'})
              </Text>
              <Text style={[styles.amountValue, { color: '#F44336' }]}>
                -{formatCurrency(saleData.discount_amount || 0)}
              </Text>
            </View>
          )}

          {Number(saleData.tax_amount) > 0 && (
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Tax</Text>
              <Text style={styles.amountValue}>{formatCurrency(saleData.tax_amount || 0)}</Text>
            </View>
          )}

          {Number(saleData.shipping_charges) > 0 && (
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Shipping</Text>
              <Text style={styles.amountValue}>{formatCurrency(saleData.shipping_charges || 0)}</Text>
            </View>
          )}

          <View style={styles.divider} />
          
          <View style={styles.finalTotalRow}>
            <Text style={styles.finalTotalLabel}>Final Total</Text>
            <Text style={styles.finalTotalValue}>{formatCurrency(saleData.final_total || 0)}</Text>
          </View>
        </View>

        {/* Payment History */}
        {saleData.payment_lines && saleData.payment_lines.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payments Made</Text>
            {saleData.payment_lines.map((payment: any, index: number) => (
              <View key={index} style={styles.paymentItem}>
                <View style={styles.paymentInfo}>
                  <Ionicons name="card" size={20} color={Colors.SUBTITLE_COLOR} style={{ marginRight: 8 }} />
                  <Text style={styles.paymentMethod}>
                    {(payment.method || 'Unknown').toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.paymentAmount}>{formatCurrency(payment.amount || 0)}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Extra spacing at the bottom */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.PRIMARY_COLOR, // For the safe area top behind header
    paddingTop: 44
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff' // Fallback
  },
  container: {
    flex: 1,
  },
  receiptHeader: {
    backgroundColor: '#fff',
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 16,
  },
  receiptTotal: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 12,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: Colors.SUBTITLE_COLOR,
  },
  infoValue: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productInfo: {
    flex: 1,
    paddingRight: 16,
  },
  productName: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
    marginBottom: 4,
  },
  productDetails: {
    fontSize: 14,
    color: Colors.SUBTITLE_COLOR,
  },
  productTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 15,
    color: Colors.SUBTITLE_COLOR,
  },
  amountValue: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  finalTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  finalTotalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.PRIMARY_COLOR,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethod: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
  }
});
