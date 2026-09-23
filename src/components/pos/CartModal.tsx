import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator, Alert, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@/store/cartStore';
import { Colors } from '@/constants/theme';
import { formatCurrency } from '@/utils/currencyFormatter';
import { submitSaleApi } from '@/api/sell';

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CartModal({ visible, onClose }: CartModalProps) {
  const scheme = useColorScheme();
  const themeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  
  const { cartItems, cartTotal, updateQuantity, removeItem, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    setIsSubmitting(true);
    try {
      // Default dummy values based on POS typical setup.
      // A full implementation might ask the user for a contact/location
      const payload = {
        location_id: 1, 
        contact_id: 1, 
        products: cartItems.map(item => ({
          product_id: item.id,
          variation_id: item.variation_id || '',
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        payments: [{
          amount: cartTotal,
          method: 'cash', // Default to cash
        }]
      };

      await submitSaleApi(payload);
      Alert.alert("Success", "Sale completed successfully!");
      clearCart();
      onClose();
    } catch (error) {
      console.error("Sale submission error:", error);
      Alert.alert("Error", "Failed to complete the sale.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCartItem = ({ item }: { item: any }) => (
    <View style={[styles.cartItem, { borderBottomColor: themeColors.backgroundElement }]}>
      <View style={styles.itemDetails}>
        <Text style={[styles.itemName, { color: themeColors.text }]} numberOfLines={1}>
          {item.name || item.product_name}
        </Text>
        <Text style={[styles.itemPrice, { color: themeColors.textSecondary }]}>
          {formatCurrency(item.unit_price)}
        </Text>
      </View>
      
      <View style={styles.quantityControl}>
        <TouchableOpacity 
          style={[styles.qtyButton, { backgroundColor: themeColors.backgroundElement }]} 
          onPress={() => updateQuantity(item.cartItemId, -1)}
        >
          <Ionicons name="remove" size={18} color={themeColors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.qtyText, { color: themeColors.text }]}>{item.quantity}</Text>
        
        <TouchableOpacity 
          style={[styles.qtyButton, { backgroundColor: themeColors.backgroundElement }]} 
          onPress={() => updateQuantity(item.cartItemId, 1)}
        >
          <Ionicons name="add" size={18} color={themeColors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: themeColors.background }]}>
          
          <View style={[styles.header, { borderBottomColor: themeColors.backgroundElement }]}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>Current Order</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          {cartItems.length === 0 ? (
            <View style={styles.emptyCart}>
              <Ionicons name="cart-outline" size={64} color={themeColors.textSecondary} />
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>Cart is empty</Text>
            </View>
          ) : (
            <FlatList
              data={cartItems}
              renderItem={renderCartItem}
              keyExtractor={item => item.cartItemId}
              contentContainerStyle={styles.listContent}
            />
          )}

          <View style={[styles.footer, { borderTopColor: themeColors.backgroundElement }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: themeColors.text }]}>Total:</Text>
              <Text style={[styles.summaryValue, { color: themeColors.primary }]}>
                {formatCurrency(cartTotal)}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.clearBtn, { borderColor: themeColors.primary }]}
                onPress={() => {
                  Alert.alert("Clear Cart", "Are you sure you want to remove all items?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Clear", onPress: clearCart, style: "destructive" }
                  ]);
                }}
                disabled={cartItems.length === 0 || isSubmitting}
              >
                <Text style={[styles.clearBtnText, { color: themeColors.primary }]}>Clear</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.checkoutBtn, 
                  { backgroundColor: cartItems.length === 0 ? themeColors.textSecondary : themeColors.primary }
                ]}
                onPress={handleCheckout}
                disabled={cartItems.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.checkoutBtnText}>Checkout</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 5,
  },
  listContent: {
    padding: 15,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemDetails: {
    flex: 1,
    paddingRight: 15,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  emptyCart: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    marginTop: 15,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  clearBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkoutBtn: {
    flex: 2,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
