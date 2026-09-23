import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import CommonHeader from '@/components/CommonHeader';
import { usePosStore } from '@/store/usePosStore';
import { submitSaleApi, SalePayload } from '@/api/sell';
import { fetchBusinessLocations } from '@/api/business';

// Components
import CustomerSelector from '@/components/pos/CustomerSelector';
import ProductSearch from '@/components/pos/ProductSearch';
import CartItemRow from '@/components/pos/CartItemRow';
import PaymentModal from '@/components/pos/PaymentModal';

export default function PosScreen() {
  const store = usePosStore();
  const [locations, setLocations] = useState<any[]>([]);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadLocations();
    // Cleanup on unmount
    return () => store.clearCart();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await fetchBusinessLocations();
      const locData = response?.data || response || [];
      setLocations(Array.isArray(locData) ? locData : []);
      
      // Auto-select first location if none is selected
      if (!store.location_id && locData.length > 0) {
        store.setLocation(locData[0].id);
      }
    } catch (err) {
      console.error('Failed to load locations', err);
    }
  };

  const getSelectedLocationName = () => {
    if (!store.location_id) return 'Select Location';
    const loc = locations.find(l => l.id === store.location_id);
    return loc ? loc.name : 'Unknown Location';
  };

  const validateSale = () => {
    if (!store.location_id) {
      Alert.alert('Validation Error', 'Please select a location first.');
      return false;
    }
    if (!store.contact_id) {
      Alert.alert('Validation Error', 'Please select a customer.');
      return false;
    }
    if (store.cart.length === 0) {
      Alert.alert('Validation Error', 'Cart is empty. Please add some products.');
      return false;
    }
    return true;
  };

  const handleCheckout = () => {
    if (!validateSale()) return;

    if (store.status === 'draft') {
      // Drafts don't need payment, submit immediately
      submitSale();
    } else {
      // Final sales need payment info
      setIsPaymentModalVisible(true);
    }
  };

  const submitSale = async () => {
    setIsSubmitting(true);
    try {
      const payload: SalePayload = {
        location_id: store.location_id!,
        contact_id: store.contact_id!,
        status: store.status,
        products: store.cart.map(item => ({
          product_id: item.product_id,
          variation_id: item.variation_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          // You might need to map discount properties here based on your backend specific requirements
          // discount_type: item.discount_type,
          // discount_amount: item.discount_amount,
        })),
        payments: store.status === 'final' ? [{
          amount: store.payment.amount,
          method: store.payment.method,
          note: store.payment.note
        }] : [],
        // Additional global fields for shipping, global discount etc would map here based on payload spec
      };

      await submitSaleApi(payload);
      
      Alert.alert('Success', 'Sale completed successfully!', [
        { text: 'OK', onPress: () => {
          store.clearCart();
          router.replace('/sell');
        }}
      ]);
    } catch (error: any) {
      console.error('Sale submission failed', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit sale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader text="Point of Sale" />
      
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          
          {/* Header Controls */}
          <View style={styles.headerControls}>
            <TouchableOpacity style={styles.locationSelector} onPress={() => setIsLocationModalVisible(true)}>
              <Ionicons name="location" size={18} color={Colors.PRIMARY_COLOR} />
              <Text style={styles.locationText} numberOfLines={1}>
                {getSelectedLocationName()}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.SUBTITLE_COLOR} />
            </TouchableOpacity>

            <View style={styles.statusToggle}>
              <TouchableOpacity 
                style={[styles.statusBtn, store.status === 'draft' && styles.statusBtnActive]}
                onPress={() => store.setStatus('draft')}
              >
                <Text style={[styles.statusText, store.status === 'draft' && styles.statusTextActive]}>Draft</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.statusBtn, store.status === 'final' && styles.statusBtnActive]}
                onPress={() => store.setStatus('final')}
              >
                <Text style={[styles.statusText, store.status === 'final' && styles.statusTextActive]}>Final</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <CustomerSelector />
            <ProductSearch />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cart Items ({store.cart.length})</Text>
            {store.cart.length === 0 ? (
              <View style={styles.emptyCart}>
                <Ionicons name="cart-outline" size={48} color="#E0E0E0" />
                <Text style={styles.emptyCartText}>Cart is empty</Text>
              </View>
            ) : (
              store.cart.map((item, index) => (
                <CartItemRow key={`${item.variation_id}-${index}`} item={item} index={index} />
              ))
            )}
          </View>

          {/* Cart Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${store.getSubTotal().toFixed(2)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping Charges</Text>
              <View style={styles.inlineInputWrapper}>
                <Text style={styles.currencyPrefix}>$</Text>
                <TextInput 
                  style={styles.inlineInput}
                  value={store.shipping_charges ? store.shipping_charges.toString() : ''}
                  keyboardType="numeric"
                  placeholder="0.00"
                  onChangeText={(val) => {
                    const num = parseFloat(val);
                    store.setShippingCharges(isNaN(num) ? 0 : num);
                  }}
                />
              </View>
            </View>

            {/* Global Discount could go here too */}
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>${store.getGrandTotal().toFixed(2)}</Text>
            </View>
          </View>

          <View style={{ height: 100 }} /> {/* Padding for bottom button */}
        </ScrollView>

        {/* Sticky Checkout Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={[styles.checkoutBtn, store.cart.length === 0 && styles.checkoutBtnDisabled]}
            disabled={store.cart.length === 0 || isSubmitting}
            onPress={handleCheckout}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.checkoutBtnText}>
                  {store.status === 'draft' ? 'Save as Draft' : 'Complete Sale'}
                </Text>
                <Text style={styles.checkoutTotalText}>
                  ${store.getGrandTotal().toFixed(2)}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

      {/* Payment Modal */}
      <PaymentModal 
        visible={isPaymentModalVisible} 
        onClose={() => setIsPaymentModalVisible(false)}
        onSubmit={submitSale}
      />

      {/* Location Modal (reused pattern from earlier pages) */}
      <Modal visible={isLocationModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsLocationModalVisible(false)}>
          <View style={styles.locationModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location</Text>
            </View>
            <FlatList 
              data={locations}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalOption} 
                  onPress={() => { 
                    store.setLocation(item.id); 
                    setIsLocationModalVisible(false); 
                  }}
                >
                  <Text style={[styles.modalOptionText, store.location_id === item.id && { color: Colors.PRIMARY_COLOR, fontWeight: 'bold' }]}>
                    {item.name}
                  </Text>
                  {store.location_id === item.id && <Ionicons name="checkmark" size={20} color={Colors.PRIMARY_COLOR} />}
                </TouchableOpacity>
              )}
            />
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
  scrollView: {
    flex: 1,
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 128, 82, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginRight: 12,
  },
  locationText: {
    flex: 1,
    marginLeft: 6,
    marginRight: 6,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.PRIMARY_COLOR,
  },
  statusToggle: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
  },
  statusBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.SUBTITLE_COLOR,
  },
  statusTextActive: {
    color: '#1C1C1E',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  emptyCart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  emptyCartText: {
    marginTop: 12,
    fontSize: 15,
    color: Colors.SUBTITLE_COLOR,
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.SUBTITLE_COLOR,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  inlineInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    paddingHorizontal: 8,
    width: 100,
  },
  currencyPrefix: {
    color: Colors.SUBTITLE_COLOR,
    fontWeight: '600',
  },
  inlineInput: {
    flex: 1,
    height: 36,
    textAlign: 'right',
    paddingHorizontal: 4,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.PRIMARY_COLOR,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 32, // safe area spacing
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  checkoutBtn: {
    backgroundColor: Colors.PRIMARY_COLOR,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  checkoutBtnDisabled: {
    backgroundColor: '#E0E0E0',
  },
  checkoutBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  checkoutTotalText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  locationModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'center',
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
