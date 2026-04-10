import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../../constants/colors';
import { ordersApi, paymentsApi, restaurantsApi } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import i18n from '../../constants/i18n';

export default function OwnerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [incomingOrders, setIncomingOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ todayOrders: 0, todaySales: 0, rating: 4.8 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, earningsRes] = await Promise.all([
        ordersApi.getIncomingOrders(),
        paymentsApi.getEarnings()
      ]);
      setIncomingOrders(ordersRes.data.results || ordersRes.data || []);
      setStats({
        todayOrders: earningsRes?.data?.order_count || 0,
        todaySales: earningsRes?.data?.total_earned_today || 0,
        rating: 4.8
      });
    } catch (e: any) {
      console.error(e);
      setIncomingOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 20000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await ordersApi.updateStatus(id, status);
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Karibu, {user?.username}</Text>
          <Text style={styles.subtitle}>Eneo lako la usimamizi / Owner Dashboard</Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Orders Leo" value={stats.todayOrders} icon="receipt-outline" />
          <StatCard label="Sales Leo" value={`TSh ${stats.todaySales.toLocaleString()}`} icon="wallet-outline" />
          <StatCard label="Rating" value={stats.rating} icon="star" color={Colors.warning} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maagizo Mapya / Incoming Orders ({incomingOrders.length})</Text>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
          ) : incomingOrders.length > 0 ? (
            incomingOrders.map((item) => (
              <OrderCard 
                key={item.id} 
                order={item} 
                onAccept={() => updateStatus(item.id, 'preparing')}
                onReady={() => updateStatus(item.id, 'ready')}
              />
            ))
          ) : (
            <View style={styles.empty}>
              <Ionicons name="cafe-outline" size={48} color={Colors.grayLight} />
              <Text style={styles.emptyText}>Hakuna maagizo mapya kwa sasa</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(owner)/menu')}>
        <Ionicons name="add" size={32} color={Colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: color ? `${color}15` : `${Colors.primary}15` }]}>
        <Ionicons name={icon} size={20} color={color || Colors.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function OrderCard({ order, onAccept, onReady }: any) {
  const getStatusColor = () => {
    switch(order.status) {
      case 'pending': return Colors.warning;
      case 'confirmed': return Colors.primary;
      case 'preparing': return '#2563EB';
      case 'ready': return Colors.success;
      default: return Colors.gray;
    }
  };

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.customerName}>{order.customer_detail?.username}</Text>
          <Text style={styles.orderTime}>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '15' }]}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>{order.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.itemList}>
        {order.items?.map((it: any, idx: number) => (
          <Text key={idx} style={styles.itemText}>{it.quantity}x {it.menu_item_detail?.name}</Text>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.totalLabel}>Total: <Text style={styles.totalValue}>TSh {order.total_price?.toLocaleString()}</Text></Text>
        <View style={styles.actions}>
          {order.status === 'pending' || order.status === 'confirmed' ? (
            <TouchableOpacity style={styles.btnAccept} onPress={onAccept}>
              <Text style={styles.btnText}>Pokea / Accept</Text>
            </TouchableOpacity>
          ) : order.status === 'preparing' ? (
            <TouchableOpacity style={styles.btnReady} onPress={onReady}>
              <Text style={styles.btnText}>Tayari / Ready</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutralLight },
  header: { padding: Spacing.lg, paddingBottom: 10 },
  greeting: { fontSize: 24, fontWeight: '900', color: Colors.tertiary },
  subtitle: { fontSize: FontSize.sm, color: Colors.gray, marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.md, marginTop: Spacing.md },
  statCard: { flex: 1, backgroundColor: Colors.white, padding: Spacing.md, borderRadius: Radius.lg, ...Shadow.sm, gap: 4 },
  statIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontSize: FontSize.md, fontWeight: '800', color: Colors.black },
  statLabel: { fontSize: 10, color: Colors.gray, fontWeight: '600', textTransform: 'uppercase' },
  section: { padding: Spacing.lg, gap: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.black, marginBottom: Spacing.xs },
  orderCard: { backgroundColor: Colors.white, padding: Spacing.md, borderRadius: Radius.lg, ...Shadow.sm, marginBottom: Spacing.md },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.black },
  orderTime: { fontSize: 12, color: Colors.gray },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '800' },
  divider: { height: 1, backgroundColor: Colors.grayLight, marginVertical: 12 },
  itemList: { gap: 6 },
  itemText: { fontSize: FontSize.sm, color: Colors.tertiary, fontWeight: '500' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  totalLabel: { fontSize: 12, color: Colors.gray },
  totalValue: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  actions: { flexDirection: 'row', gap: 8 },
  btnAccept: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.sm },
  btnReady: { backgroundColor: Colors.success, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.sm },
  btnText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { color: Colors.gray, fontSize: FontSize.sm },
  fab: { position: 'absolute', bottom: 90, right: Spacing.lg, width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadow.lg },
});
