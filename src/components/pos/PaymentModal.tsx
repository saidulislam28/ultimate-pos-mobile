import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { usePosStore } from '@/store/usePosStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export default function PaymentModal({ visible, onClose, onSubmit }: Props) {
  const { payment, setPayment, getGrandTotal } = usePosStore();
  const grandTotal = getGrandTotal();

  // If amount is not set or 0 when opened, default it to grand total
  React.useEffect(() => {
    if (visible && payment.amount === 0 && grandTotal > 0) {
      setPayment({ amount: grandTotal });
    }
  }, [visible, grandTotal]);

  const changeReturn = Math.max(0, payment.amount - grandTotal);

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: 'cash-outline' },
    { id: 'card', label: 'Card', icon: 'card-outline' },
    { id: 'bank_transfer', label: 'Bank', icon: 'business-outline' },
    { id: 'other', label: 'Other', icon: 'wallet-outline' }
  ] as const;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          
          <View style={styles.header}>
            <Text style={styles.title}>Payment Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            
            {/* Payment Methods */}
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.methodGrid}>
              {paymentMethods.map((m) => {
                const isSelected = payment.method === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.methodBtn, isSelected && styles.methodBtnActive]}
                    onPress={() => setPayment({ method: m.id })}
                  >
                    <Ionicons 
                      name={m.icon as any} 
                      size={20} 
                      color={isSelected ? '#fff' : Colors.PRIMARY_COLOR} 
                      style={{ marginBottom: 4 }} 
                    />
                    <Text style={[styles.methodText, isSelected && styles.methodTextActive]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Amount Tendered */}
            <View style={styles.amountSection}>
              <View style={styles.amountInputGroup}>
                <Text style={styles.label}>Amount Tendered</Text>
                <TextInput
                  style={styles.amountInput}
                  value={payment.amount ? payment.amount.toString() : ''}
                  keyboardType="numeric"
                  onChangeText={(val) => {
                    const num = parseFloat(val);
                    setPayment({ amount: isNaN(num) ? 0 : num });
                  }}
                  placeholder="0.00"
                />
              </View>

              <View style={styles.changeReturnGroup}>
                <Text style={styles.label}>Change Return</Text>
                <Text style={[styles.changeAmount, changeReturn > 0 && { color: '#4CAF50' }]}>
                  ${changeReturn.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Payable:</Text>
              <Text style={styles.summaryValue}>${grandTotal.toFixed(2)}</Text>
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, payment.amount < grandTotal && styles.submitBtnDisabled]} 
              disabled={payment.amount < grandTotal}
              onPress={() => {
                onClose();
                onSubmit();
              }}
            >
              <Text style={styles.submitBtnText}>Confirm Payment & Complete Sale</Text>
            </TouchableOpacity>
            
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '60%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  methodBtn: {
    width: '48%',
    backgroundColor: 'rgba(255, 128, 82, 0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  methodBtnActive: {
    backgroundColor: Colors.PRIMARY_COLOR,
    borderColor: Colors.PRIMARY_COLOR,
  },
  methodText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.PRIMARY_COLOR,
  },
  methodTextActive: {
    color: '#fff',
  },
  amountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  amountInputGroup: {
    flex: 1,
    marginRight: 12,
  },
  amountInput: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  changeReturnGroup: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    justifyContent: 'center',
  },
  changeAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.SUBTITLE_COLOR,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.PRIMARY_COLOR,
  },
  submitBtn: {
    backgroundColor: Colors.PRIMARY_COLOR,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#E0E0E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
