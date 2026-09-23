import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import CommonHeader from '@/components/CommonHeader';
import { fetchCashRegisterDetails } from '@/api/cash-register';
import { formatCurrency } from '@/utils/currencyFormatter';

export default function CashRegisterDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [register, setRegister] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadData(id as string);
    }
  }, [id]);

  const loadData = async (registerId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchCashRegisterDetails(registerId);
      const data = response?.data || response;
      const item = Array.isArray(data) ? data[0] : data;
      
      if (!item) {
        setError('Cash register details not found.');
      } else {
        setRegister(item);
      }
    } catch (err) {
      console.error('Failed to load cash register details:', err);
      setError('Failed to load cash register details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CommonHeader text="Register Details" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY_COLOR} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !register) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CommonHeader text="Register Details" />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
          <Text style={styles.errorText}>{error || 'Not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOpen = register.status === 'open';
  const initialTransaction = register.cash_register_transactions?.find((t: any) => t.transaction_type === 'initial');
  const initialAmount = initialTransaction ? Number(initialTransaction.amount) : 0;
  const closingAmount = Number(register.closing_amount) || 0;
  
  const openedAt = register.created_at ? new Date(register.created_at).toLocaleString() : 'N/A';
  const closedAt = register.closed_at ? new Date(register.closed_at).toLocaleString() : '-';

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader text={`Register #${register.id}`} />
      <ScrollView style={styles.container}>
        
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="cash" size={40} color={Colors.PRIMARY_COLOR} />
          </View>
          <Text style={styles.title}>Register #{register.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: isOpen ? '#E8F5E9' : '#F5F5F5' }]}>
            <Text style={[styles.statusText, { color: isOpen ? '#4CAF50' : '#757575' }]}>
              {isOpen ? 'OPEN' : 'CLOSED'}
            </Text>
          </View>
        </View>

        {/* Timestamps */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeCol}>
              <Text style={styles.timeLabel}>Opened At</Text>
              <Text style={styles.timeValue}>{openedAt}</Text>
            </View>
            <View style={styles.timeCol}>
              <Text style={styles.timeLabel}>Closed At</Text>
              <Text style={styles.timeValue}>{closedAt}</Text>
            </View>
          </View>
          {!!register.closing_note && (
             <View style={styles.noteContainer}>
                <Text style={styles.timeLabel}>Closing Note:</Text>
                <Text style={styles.timeValue}>{register.closing_note}</Text>
             </View>
          )}
        </View>

        {/* Financial Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.amountsContainer}>
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Initial Amount</Text>
              <Text style={styles.amountValue}>{formatCurrency(initialAmount)}</Text>
            </View>
            <View style={styles.amountDivider} />
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Closing Amount</Text>
              <Text style={styles.amountValue}>{formatCurrency(closingAmount)}</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
             <View style={styles.statItem}>
               <Text style={styles.statLabel}>Card Slips</Text>
               <Text style={styles.statValue}>{register.total_card_slips || 0}</Text>
             </View>
             <View style={styles.statItem}>
               <Text style={styles.statLabel}>Cheques</Text>
               <Text style={styles.statValue}>{register.total_cheques || 0}</Text>
             </View>
          </View>
        </View>

        {/* Transactions List */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          {register.cash_register_transactions && register.cash_register_transactions.length > 0 ? (
            register.cash_register_transactions.map((tx: any, index: number) => {
               const isCredit = tx.type === 'credit';
               return (
                 <View key={tx.id} style={[styles.transactionItem, index > 0 && styles.transactionBorder]}>
                    <View style={styles.txIconContainer}>
                      <Ionicons 
                        name={isCredit ? "arrow-down-circle-outline" : "arrow-up-circle-outline"} 
                        size={24} 
                        color={isCredit ? "#4CAF50" : "#F44336"} 
                      />
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txType}>{tx.transaction_type ? tx.transaction_type.toUpperCase() : 'UNKNOWN'}</Text>
                      <Text style={styles.txMethod}>via {tx.pay_method}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: isCredit ? "#4CAF50" : "#F44336" }]}>
                      {isCredit ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                    </Text>
                 </View>
               );
            })
          ) : (
            <Text style={styles.emptyText}>No transactions recorded.</Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F4F9',
  },
  headerSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 128, 82, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeCol: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: Colors.SUBTITLE_COLOR,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  noteContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  amountsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 16,
  },
  amountBox: {
    flex: 1,
    alignItems: 'center',
  },
  amountDivider: {
    width: 1,
    backgroundColor: '#EEEEEE',
    marginHorizontal: 16,
  },
  amountLabel: {
    fontSize: 13,
    color: Colors.SUBTITLE_COLOR,
    marginBottom: 6,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.SUBTITLE_COLOR,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  transactionBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  txIconContainer: {
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  txMethod: {
    fontSize: 13,
    color: Colors.SUBTITLE_COLOR,
    textTransform: 'capitalize',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.SUBTITLE_COLOR,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginTop: 12,
  }
});
