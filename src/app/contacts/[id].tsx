import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import CommonHeader from '@/components/CommonHeader';
import { fetchContactDetails } from '@/api/contact';
import { formatCurrency } from '@/utils/currencyFormatter';

export default function ContactDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadData(id as string);
    }
  }, [id]);

  const loadData = async (contactId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchContactDetails(contactId);
      const data = response?.data || response;
      const item = Array.isArray(data) ? data[0] : data;
      
      if (!item) {
        setError('Contact details not found.');
      } else {
        setContact(item);
      }
    } catch (err) {
      console.error('Failed to load contact details:', err);
      setError('Failed to load contact details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CommonHeader text="Contact Details" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY_COLOR} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !contact) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CommonHeader text="Contact Details" />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
          <Text style={styles.errorText}>{error || 'Not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isSupplier = contact.type === 'supplier';
  const displayName = isSupplier && contact.supplier_business_name ? contact.supplier_business_name : (contact.name?.trim() || 'Unknown Contact');
  const isActive = contact.contact_status === 'active';
  
  const addressParts = [contact.address_line_1, contact.address_line_2, contact.city, contact.state, contact.zip_code, contact.country].filter(Boolean);
  const fullAddress = addressParts.join(', ');

  const StatBox = ({ title, value, type = 'neutral' }: { title: string, value: number | string, type?: 'positive' | 'negative' | 'neutral' }) => {
    let color = '#1C1C1E';
    if (type === 'positive') color = '#4CAF50';
    if (type === 'negative') color = '#F44336';

    return (
      <View style={styles.statBox}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={[styles.statValue, { color }]}>{formatCurrency(Number(value) || 0)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader text={contact.contact_id || 'Contact Details'} />
      <ScrollView style={styles.container}>
        
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={[styles.avatar, { backgroundColor: isSupplier ? '#E3F2FD' : '#F3E5F5' }]}>
            {isSupplier ? (
              <Ionicons name="briefcase-outline" size={40} color="#2196F3" />
            ) : (
              <Ionicons name="person-outline" size={40} color="#9C27B0" />
            )}
          </View>
          <Text style={styles.title}>{displayName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? '#E8F5E9' : '#FFEBEE' }]}>
            <Text style={[styles.statusText, { color: isActive ? '#4CAF50' : '#F44336' }]}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* Contact Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          {!!contact.mobile && (
            <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`tel:${contact.mobile}`)}>
              <Ionicons name="call-outline" size={20} color={Colors.PRIMARY_COLOR} style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>Mobile</Text>
                <Text style={[styles.infoText, { color: Colors.PRIMARY_COLOR }]}>{contact.mobile}</Text>
              </View>
            </TouchableOpacity>
          )}

          {!!contact.alternate_number && (
            <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`tel:${contact.alternate_number}`)}>
              <Ionicons name="call-outline" size={20} color={Colors.SUBTITLE_COLOR} style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>Alternate Number</Text>
                <Text style={styles.infoText}>{contact.alternate_number}</Text>
              </View>
            </TouchableOpacity>
          )}
          
          {!!contact.email && (
            <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`mailto:${contact.email}`)}>
              <Ionicons name="mail-outline" size={20} color={Colors.PRIMARY_COLOR} style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={[styles.infoText, { color: Colors.PRIMARY_COLOR }]}>{contact.email}</Text>
              </View>
            </TouchableOpacity>
          )}

          {!!fullAddress && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={Colors.SUBTITLE_COLOR} style={styles.infoIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoText}>{fullAddress}</Text>
              </View>
            </View>
          )}

          {!!contact.tax_number && (
            <View style={styles.infoRow}>
              <Ionicons name="document-text-outline" size={20} color={Colors.SUBTITLE_COLOR} style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>Tax Number</Text>
                <Text style={styles.infoText}>{contact.tax_number}</Text>
              </View>
            </View>
          )}
          
          {!contact.mobile && !contact.email && !fullAddress && !contact.tax_number && (
            <Text style={styles.emptyText}>No contact information available.</Text>
          )}
        </View>

        {/* Financial Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Financial Summary</Text>
          
          {/* Due Balances (Most Important) */}
          <View style={styles.statsGrid}>
            {(contact.type === 'customer' || contact.type === 'both' || !contact.type) && (
              <StatBox 
                title="Sell Due" 
                value={contact.sell_due || 0} 
                type={Number(contact.sell_due) > 0 ? 'negative' : 'neutral'} 
              />
            )}
            {(contact.type === 'supplier' || contact.type === 'both') && (
              <StatBox 
                title="Purchase Due" 
                value={contact.purchase_due || 0} 
                type={Number(contact.purchase_due) > 0 ? 'negative' : 'neutral'} 
              />
            )}
          </View>

          {/* Historical Totals */}
          <View style={styles.statsGrid}>
            {(contact.type === 'customer' || contact.type === 'both' || !contact.type) && (
              <StatBox 
                title="Total Invoice" 
                value={contact.total_invoice || 0} 
              />
            )}
            {(contact.type === 'supplier' || contact.type === 'both') && (
              <StatBox 
                title="Total Purchase" 
                value={contact.total_purchase || 0} 
              />
            )}
          </View>
          
          {/* Opening Balance */}
          <View style={styles.statsGrid}>
             <StatBox 
                title="Opening Balance" 
                value={contact.opening_balance || 0} 
             />
             <StatBox 
                title="Total Balance" 
                value={contact.balance || 0} 
                type={Number(contact.balance) > 0 ? 'negative' : 'neutral'}
             />
          </View>
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
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'capitalize',
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.SUBTITLE_COLOR,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.SUBTITLE_COLOR,
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  statTitle: {
    fontSize: 12,
    color: Colors.SUBTITLE_COLOR,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginTop: 12,
  }
});
