import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, Spacing, Radius } from '../../constants/colors';
import { ordersApi, paymentsApi } from '../../services/api';
import { useAuth } from '../../store/AuthContext';

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  pending:    { color: '#F59E0B', bg: '#FFF7E6' },
  confirmed:  { color: '#3B82F6', bg: '#EFF6FF' },
  preparing:  { color: '#8B5CF6', bg: '#F5F3FF' },
  on_the_way: { color: '#F97316', bg: '#FFF7ED' },
  delivered:  { color: '#10B981', bg: '#ECFDF5' },
  cancelled:  { color: '#EF4444', bg: '#FEF2F2' },
  ready:      { color: '#10B981', bg: '#ECFDF5' },
};

export default function OwnerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [incomingOrders, setIncomingOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ todayOrders: 0, todaySales: 0, weekSales: 0, rating: 4.8 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, earningsRes] = await Promise.all([
        ordersApi.getIncomingOrders(),
        paymentsApi.getEarnings(),
      ]);
      setIncomingOrders(ordersRes.data.results || ordersRes.data || []);
      setStats({
        todayOrders: earningsRes?.data?.order_count || 0,
        todaySales: earningsRes?.data?.total_earned_today || 0,
        weekSales: earningsRes?.data?.total_earned_this_week || 0,
        rating: 4.8,
      });
    } catch (e: any) {
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

  const updateStatus = async (id: number, status: string) => {
    try {
      await ordersApi.updateStatus(id, status);
      fetchData();
    } catch {
      Alert.alert('Hitilafu', 'Imeshindwa kubadilisha hali ya oda.');
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Habari za Asubuhi ☀️';
    if (h < 17) return 'Habari za Mchana 🌤️';
    return 'Habari za Jioni 🌙';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[Colors.primary]} tintColor={Colors.primary} />
          }
        >
          {/* Header */}
          <LinearGradient colors={['#FF6D00', '#C43C00']} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.heroDecor} />
            <View style={styles.heroRow}>
              <View>
                <Text style={styles.heroGreeting}>{getGreeting()}</Text>
                <Text style={styles.heroName}>{user?.username} 👨‍🍳</Text>
                <Text style={styles.heroSub}>Dashboard ya Mmiliki</Text>
              </View>
              <TouchableOpacity style={styles.notifBtn}>
                <Ionicons name="notifications-outline" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Stats row inside hero */}
            <View style={styles.statsRow}>
              <StatChip icon="receipt-outline" label="Oda Leo" value={String(stats.todayOrders)} />
              <View style={styles.statsDivider} />
              <StatChip icon="wallet-outline" label="Mapato Leo" value={`TSh ${stats.todaySales.toLocaleString()}`} />
              <View style={styles.statsDivider} />
              <StatChip icon="star" label="Rating" value={String(stats.rating)} iconColor="#F59E0B" />
            </View>
          </LinearGradient>

          {/* Weekly earnings card */}
          <View style={styles.weekCard}>
            <LinearGradient colors={['#5D1D00', '#C43C00']} style={styles.weekGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <View style={styles.weekLeft}>
                <Text style={styles.weekLabel}>💰 Mapato ya Wiki Hii</Text>
                <Text style={styles.weekValue}>TSh {stats.weekSales.toLocaleString()}</Text>
              </View>
              <TouchableOpacity style={styles.weekBtn} onPress={() => router.push('/(owner)/earnings')}>
                <Text style={styles.weekBtnTxt}>Tazama</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Quick actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vitendo vya Haraka</Text>
            <View style={styles.quickActions}>
              <QuickAction icon="restaurant-outline" label="Menyu" color={Colors.primary} onPress={() => router.push('/(owner)/menu')} />
              <QuickAction icon="time-outline" label="Oda Zote" color="#3B82F6" onPress={() => router.push('/(owner)/orders')} />
              <QuickAction icon="pie-chart-outline" label="Mapato" color="#8B5CF6" onPress={() => router.push('/(owner)/earnings')} />
              <QuickAction icon="person-outline" label="Profaili" color="#10B981" onPress={() => router.push('/(owner)/profile')} />
            </View>
          </View>

          {/* Incoming orders */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Maagizo Mapya</Text>
              {incomingOrders.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countTxt}>{incomingOrders.length}</Text>
                </View>
              )}
            </View>

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
              <View style={styles.emptyOrders}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="cafe-outline" size={32} color={Colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>Hakuna Maagizo Mapya</Text>
                <Text style={styles.emptyDesc}>Maagizo mapya yataonekana hapa moja kwa moja</Text>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/(owner)/menu')} activeOpacity={0.88}>
          <LinearGradient colors={['#FF6D00', '#C43C00']} style={styles.fabGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="add" size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

function StatChip({ icon, label, value, iconColor }: any) {
  return (
    <View style={styles.statChip}>
      <Ionicons name={icon} size={16} color={iconColor || 'rgba(255,255,255,0.9)'} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }: any) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.quickIconWrap, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function OrderCard({ order, onAccept, onReady }: any) {
  const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
  const statusLabels: Record<string, string> = {
    pending: 'Inasubiri', confirmed: 'Imethibitishwa',
    preparing: 'Inaandaliwa', ready: 'Tayari',
    on_the_way: 'Njiani', delivered: 'Imefikia', cancelled: 'Imekataliwa',
  };

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.customerInfo}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerAvatarTxt}>{order.customer_detail?.username?.[0]?.toUpperCase() || 'M'}</Text>
          </View>
          <View>
            <Text style={styles.customerName}>{order.customer_detail?.username || 'Mteja'}</Text>
            <Text style={styles.orderTime}>
              {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
        <View style={[styles.orderStatusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.orderStatusTxt, { color: sc.color }]}>{statusLabels[order.status] || order.status}</Text>
        </View>
      </View>

      <View style={styles.orderDivider} />

      <View style={styles.orderItems}>
        {order.items?.map((it: any, idx: number) => (
          <View key={idx} style={styles.orderItemRow}>
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyTxt}>{it.quantity}</Text>
            </View>
            <Text style={styles.itemName}>{it.menu_item_detail?.name || 'Chakula'}</Text>
            <Text style={styles.itemPrice}>TSh {(it.price * it.quantity).toLocaleString()}</Text>
          </View>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <View>
          <Text style={styles.totalLabel}>Jumla</Text>
          <Text style={styles.totalValue}>TSh {Number(order.total_price).toLocaleString()}</Text>
        </View>
        <View style={styles.orderActions}>
          {(order.status === 'pending' || order.status === 'confirmed') && (
            <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.85}>
              <Ionicons name="checkmark" size={14} color="#fff" />
              <Text style={styles.actionBtnTxt}>Pokea</Text>
            </TouchableOpacity>
          )}
          {order.status === 'preparing' && (
            <TouchableOpacity style={styles.readyBtn} onPress={onReady} activeOpacity={0.85}>
              <Ionicons name="bag-check-outline" size={14} color="#fff" />
              <Text style={styles.actionBtnTxt}>Tayari</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },
  hero: { paddingTop: 12, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, overflow: 'hidden' },
  heroDecor: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)' },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  heroGreeting: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)' },
  heroName: { fontSize: FontSize.xl, fontWeight: '900', color: '#fff', marginTop: 2 },
  heroSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  notifBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: Spacing.md },
  statChip: { flex: 1, alignItems: 'center', gap: 3 },
  statsDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  statValue: { fontSize: FontSize.md, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' },
  weekCard: { marginHorizontal: Spacing.lg, marginTop: Spacing.md, borderRadius: 18, overflow: 'hidden' },
  weekGrad: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  weekLeft: { flex: 1, gap: 3 },
  weekLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)' },
  weekValue: { fontSize: FontSize.lg, fontWeight: '900', color: '#fff' },
  weekBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full },
  weekBtnTxt: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  section: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: Spacing.md },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '900', color: '#1A1A1A' },
  countBadge: { backgroundColor: Colors.primary, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  countTxt: { color: '#fff', fontSize: 11, fontWeight: '900' },
  quickActions: { flexDirection: 'row', gap: Spacing.sm },
  quickAction: { flex: 1, alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 16, padding: Spacing.md, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  quickIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: FontSize.xs, fontWeight: '700', color: '#444' },
  emptyOrders: { alignItems: 'center', paddingVertical: 50, gap: 10 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 20, backgroundColor: 'rgba(196,60,0,0.08)', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: FontSize.md, fontWeight: '800', color: '#1A1A1A' },
  emptyDesc: { fontSize: FontSize.sm, color: '#888', textAlign: 'center' },
  orderCard: { backgroundColor: '#fff', borderRadius: 18, padding: Spacing.md, gap: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  customerAvatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(196,60,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  customerAvatarTxt: { fontSize: FontSize.md, fontWeight: '900', color: Colors.primary },
  customerName: { fontSize: FontSize.md, fontWeight: '800', color: '#1A1A1A' },
  orderTime: { fontSize: FontSize.xs, color: '#888', marginTop: 1 },
  orderStatusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  orderStatusTxt: { fontSize: FontSize.xs, fontWeight: '800' },
  orderDivider: { height: 1, backgroundColor: '#F0F0F0' },
  orderItems: { gap: 8 },
  orderItemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBadge: { width: 24, height: 24, borderRadius: 8, backgroundColor: 'rgba(196,60,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  qtyTxt: { fontSize: FontSize.xs, fontWeight: '900', color: Colors.primary },
  itemName: { flex: 1, fontSize: FontSize.sm, color: '#333', fontWeight: '600' },
  itemPrice: { fontSize: FontSize.sm, color: '#888', fontWeight: '600' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 },
  totalLabel: { fontSize: FontSize.xs, color: '#888', fontWeight: '600' },
  totalValue: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.primary },
  orderActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  readyBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#10B981', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  actionBtnTxt: { color: '#fff', fontSize: FontSize.sm, fontWeight: '800' },
  fab: { position: 'absolute', bottom: 92, right: Spacing.lg, width: 60, height: 60, borderRadius: 18, overflow: 'hidden', shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  fabGrad: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
});
