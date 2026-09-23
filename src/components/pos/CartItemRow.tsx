import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { usePosStore, CartItem } from '@/store/usePosStore';

interface Props {
  item: CartItem;
  index: number;
}

export default function CartItemRow({ item, index }: Props) {
  const { updateCartItemQty, removeFromCart, updateCartItemDiscount } = usePosStore();

  const handleIncrement = () => {
    if (item.enable_stock && item.qty_available !== undefined) {
      if (item.quantity >= item.qty_available) {
        return; // Cannot increment past stock
      }
    }
    updateCartItemQty(index, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateCartItemQty(index, item.quantity - 1);
    }
  };

  const calculateLineTotal = () => {
    let total = item.unit_price * item.quantity;
    if (item.discount_type === 'fixed') {
      total -= (item.discount_amount * item.quantity);
    } else if (item.discount_type === 'percentage') {
      total -= (total * (item.discount_amount / 100));
    }
    return Math.max(0, total).toFixed(2);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.price}>${Number(item.unit_price).toFixed(2)} / unit</Text>
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={() => removeFromCart(index)}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.quantityControl}>
          <TouchableOpacity style={styles.qtyButton} onPress={handleDecrement}>
            <Ionicons name="remove" size={16} color={Colors.PRIMARY_COLOR} />
          </TouchableOpacity>
          <TextInput
            style={styles.qtyInput}
            value={item.quantity.toString()}
            keyboardType="numeric"
            onChangeText={(text) => {
              const val = parseFloat(text);
              if (!isNaN(val)) updateCartItemQty(index, val);
            }}
          />
          <TouchableOpacity style={styles.qtyButton} onPress={handleIncrement}>
            <Ionicons name="add" size={16} color={Colors.PRIMARY_COLOR} />
          </TouchableOpacity>
        </View>

        <Text style={styles.lineTotal}>${calculateLineTotal()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoContainer: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  price: {
    fontSize: 13,
    color: Colors.SUBTITLE_COLOR,
  },
  deleteButton: {
    padding: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 12,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  qtyButton: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  qtyInput: {
    width: 40,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  lineTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
});
