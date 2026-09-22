import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, useColorScheme, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/theme';
import DashboardWidget from '@/components/DashboardWidget';
import { fetchBusinessDetailsApi, fetchProfitLossReportApi } from '@/api/dashboard';
import { formatCurrency } from '@/utils/currencyFormatter';

export default function Home() {
  const { user } = useAuthStore();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const loadData = async () => {
    try {
      // Execute both requests in parallel
      const [businessRes, profitLossRes] = await Promise.all([
        fetchBusinessDetailsApi().catch(() => null),
        fetchProfitLossReportApi().catch(() => null),
      ]);

      setDashboardData({
        business: businessRes?.data || businessRes,
        profitLoss: profitLossRes?.data || profitLossRes,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const renderDashboardContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      );
    }

    // Defensive parsing of profit loss data
    const pl = dashboardData?.profitLoss || {};
    const businessData = dashboardData?.business || {};
    
    const totalSales = pl.total_sell || pl.total_sales || pl.sales || 0;
    const totalExpenses = pl.total_expense || pl.total_expenses || pl.expenses || 0;
    const netProfit = pl.net_profit || pl.profit || 0;
    
    // Currency config from business details API
    const currencyConfig = businessData.currency;
    
    // Location count from business details API
    const locationsCount = businessData.locations ? businessData.locations.length : 0;

    return (
      <View style={styles.widgetsGrid}>
        <DashboardWidget 
          title="Total Sales" 
          value={formatCurrency(totalSales, currencyConfig)} 
          icon="cash-outline" 
          color="#34C759" // Green
        />
        <DashboardWidget 
          title="Total Expenses" 
          value={formatCurrency(totalExpenses, currencyConfig)} 
          icon="receipt-outline" 
          color="#FF3B30" // Red
        />
        <DashboardWidget 
          title="Net Profit" 
          value={formatCurrency(netProfit, currencyConfig)} 
          icon="stats-chart-outline" 
          color={themeColors.primary} 
        />
        <DashboardWidget 
          title="Locations" 
          value={locationsCount.toString()} 
          icon="business-outline" 
          color="#5856D6" // Purple
        />
      </View>
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: themeColors.backgroundElement }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} />
      }
    >
      <View style={[styles.header, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.greeting, { color: themeColors.textSecondary }]}>Good morning,</Text>
        <Text style={[styles.name, { color: themeColors.text }]}>{user?.first_name || 'Admin'}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Overview</Text>
        {renderDashboardContent()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  scrollContent: {
    paddingBottom: 24,
  },
  centerContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    paddingTop: 60, // Top inset
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    marginBottom: 4,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 16,
  },
  widgetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  }
});
