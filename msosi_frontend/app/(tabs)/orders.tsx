import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, Spacing, Radius } from '../../constants/colors';
import { ordersApi } from '../../services/api';

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending:    { label: 'Inasubiri',   color: '#F59E0B', bg: '#FFF7E6', icon: 'time-outline' },
  confirmed:  { label: 'Imethibitishwa', color: '#3B82F6', bg: '#EFF6FF', icon: 'checkmark-circle-outline' },
  preparing:  { label: 'Inaandaliwa', color: '#8B5CF6', bg: '#F5F3FF', icon: 'flame-outline' },
  on_the_way: { label: 'Njiani',      color: '#F97316', bg: '#FFF7ED', icon: 'bicycle-outline' },
  delivered:  { label: 'Imefikia',    color: '#10B981', bg: '#ECFDF5', icon: 'checkmark-done-outline' },
  cancelled:  { label: 'Imekataliwa', color: '#EF4444', bg: '#FEF2F2', icon: 'close-circle-outline' },
  ready:      { label: 'Tayari',      color: '#10B981', bg: '#ECFDF5', icon: 'bag-check-outline' },
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F6" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Oda Zangu</Text>
            <Text style={styles.headerSub}>Fuatilia hali ya oda zako</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchOrders(true)}>
            <Ionicons name="refresh-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadTxt}>Inapakia oda...</Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchOrders(true)}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
            renderItem={({ item }) => {
              const meta = STATUS_META[item.status] || STATUS_META.pending;
              const date = new Date(item.created_at);
              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => router.push(`/order/${item.id}`)}
                  activeOpacity={0.85}
                >
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.orderIdWrap}>
                      <Text style={styles.orderIdLabel}>ODA</Text>
                      <Text style={styles.orderId}>#{item.id}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                      <Ionicons name={meta.icon as any} size={13} color={meta.color} />
                      <Text style={[styles.statusTxt, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                  </View>

                  {/* Items preview */}
                  <View style={styles.itemsPreview}>
                    <Ionicons name="fast-food-outline" size={14} color="#888" />
                    <Text style={styles.itemsText} numberOfLines={1}>
                      {item.items?.map((it: any) => `${it.quantity}× ${it.menu_item_detail?.name || 'Chakula'}`).join(', ') || 'Vitu vya oda'}
                    </Text>
                  </View>

                  {/* Address */}
                  <View style={styles.addressRow}>
                    <Ionicons name="location-outline" size={13} color="#888" />
                    <Text style={styles.addressTxt} numberOfLines={1}>{item.delivery_address}</Text>
                  </View>

                  {/* Footer */}
                  <View style={styles.cardFooter}>
                    <View style={styles.dateRow}>
                      <Ionicons name="calendar-outline" size={12} color="#AAA" />
                      <Text style={styles.dateTxt}>
                        {date.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <Text style={styles.totalTxt}>TSh {Number(item.total_price).toLocaleString()}</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                  </View>

                  {/* Status timeline bar */}
                  <View style={styles.progressBar}>
                    <View style={[
                      styles.progressFill,
                      {
                        width: item.status === 'pending' ? '20%'
                          : item.status === 'confirmed' ? '40%'
                          : item.status === 'preparing' ? '60%'
                          : item.status === 'ready' || item.status === 'on_the_way' ? '80%'
                          : item.status === 'delivered' ? '100%'
                          : '10%',
                        backgroundColor: meta.color,
                      }
                    ]} />
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="receipt-outline" size={36} color={Colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>Hakuna Oda Bado</Text>
                <Text style={styles.emptyDesc}>Oda zako zitaonekana hapa baada ya kuagiza chakula.</Text>
                <TouchableOpacity
                  style={styles.shopBtn}
                  onPress={() => router.push('/(tabs)')}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['#FF6D00', '#C43C00']} style={styles.shopBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name="restaurant-outline" size={16} color="#fff" />
                    <Text style={styles.shopBtnTxt}>Agiza Chakula</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#1A1A1A' },
  headerSub: { fontSize: FontSize.sm, color: '#888', marginTop: 2 },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(196,60,0,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadTxt: { color: '#888', fontSize: FontSize.sm },
  list: { paddingHorizontal: Spacing.lg, paddingTop: 4, gap: Spacing.md, paddingBottom: 120 },
  card: {
    backgroundColor: '#fff', borderRadius: 20,
    padding: Spacing.md, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderIdWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderIdLabel: { fontSize: 9, fontWeight: '800', color: '#AAA', letterSpacing: 1 },
  orderId: { fontSize: FontSize.lg, fontWeight: '900', color: '#1A1A1A' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full,
  },
  statusTxt: { fontSize: FontSize.xs, fontWeight: '800' },
  itemsPreview: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemsText: { flex: 1, fontSize: FontSize.sm, color: '#555', fontWeight: '500' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addressTxt: { flex: 1, fontSize: FontSize.xs, color: '#888' },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 10,
  },
  dateRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateTxt: { fontSize: FontSize.xs, color: '#AAA' },
  totalTxt: { fontSize: FontSize.md, fontWeight: '900', color: Colors.primary },
  progressBar: {
    height: 3, backgroundColor: '#F0F0F0', borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 14, paddingHorizontal: Spacing.xl },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: 'rgba(196,60,0,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '900', color: '#1A1A1A' },
  emptyDesc: { fontSize: FontSize.md, color: '#888', textAlign: 'center', lineHeight: 22 },
  shopBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  shopBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 24 },
  shopBtnTxt: { color: '#fff', fontSize: FontSize.md, fontWeight: '800' },
});
