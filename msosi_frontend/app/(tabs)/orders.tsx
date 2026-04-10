import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../../constants/colors';
import { ordersApi } from '../../services/api';
import i18n from '../../constants/i18n';

const STATUS_META: Record<string, { labelKey: string; color: string; icon: string }> = {
  pending:    { labelKey: 'orders.status.pending',     color: Colors.warning,   icon: 'time-outline' },
  confirmed:  { labelKey: 'orders.status.pending', color: Colors.success,   icon: 'checkmark-circle-outline' },
  preparing:  { labelKey: 'orders.status.ready',      color: Colors.secondary, icon: 'flame-outline' },
  on_the_way: { labelKey: 'orders.status.pending',        color: Colors.primary,   icon: 'bicycle-outline' },
  delivered:  { labelKey: 'orders.status.delivered',      color: Colors.success,   icon: 'home-outline' },
  cancelled:  { labelKey: 'orders.status.cancelled',      color: Colors.error,     icon: 'close-circle-outline' },
};

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      const res = await ordersApi.list();
      setOrders(res.data.results || res.data);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Text style={styles.title}>{i18n.t('orders.title')}</Text>
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>{i18n.t('orders.title')}</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(true)} colors={[Colors.primary]} />}
        renderItem={({ item }) => {
          const meta = STATUS_META[item.status] || STATUS_META.pending;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/order/${item.id}`)}
              activeOpacity={0.85}
            >
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.orderId}>Agizo #{item.id}</Text>
                  <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString('sw-TZ')}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: meta.color + '20', borderColor: meta.color }]}>
                  <Ionicons name={meta.icon as any} size={12} color={meta.color} />
                  <Text style={[styles.statusText, { color: meta.color }]}>{i18n.t(meta.labelKey)}</Text>
                </View>
              </View>

              <View style={styles.cardMid}>
                <Ionicons name="location-outline" size={14} color={Colors.gray} />
                <Text style={styles.address} numberOfLines={1}>{item.delivery_address}</Text>
              </View>

              <View style={styles.cardBottom}>
                <Text style={styles.itemCount}>{item.items?.length ?? 0} vitu / items</Text>
                <Text style={styles.total}>TSh {Number(item.total_price).toLocaleString()}</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.gray} />
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={56} color={Colors.grayLight} />
            <Text style={styles.emptyTitle}>{i18n.t('orders.empty')}</Text>
            <Text style={styles.emptyDesc}>{i18n.t('orders.emptyDesc')}</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralLight },
  title: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.tertiary, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, marginBottom: Spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 100 },
  card: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.md, gap: Spacing.sm, ...Shadow.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: FontSize.md, fontWeight: '800', color: Colors.tertiary },
  orderDate: { fontSize: FontSize.xs, color: Colors.gray, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1 },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },
  cardMid: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  address: { fontSize: FontSize.sm, color: Colors.gray, flex: 1 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingTop: 4, borderTopWidth: 1, borderTopColor: Colors.grayLight },
  itemCount: { flex: 1, fontSize: FontSize.sm, color: Colors.gray },
  total: { fontSize: FontSize.md, fontWeight: '800', color: Colors.primary },
  empty: { flex: 1, alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.tertiary },
  emptyDesc: { fontSize: FontSize.sm, color: Colors.gray, textAlign: 'center' },
});
