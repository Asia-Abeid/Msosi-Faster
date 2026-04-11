import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, Spacing, Radius } from '../../constants/colors';
import { ordersApi } from '../../services/api';

const TABS = [
  { id: 'Vyote', label: 'Zote', icon: 'list-outline' },
  { id: 'Mpya', label: 'Mpya', icon: 'time-outline' },
  { id: 'Preparing', label: 'Inaandaliwa', icon: 'flame-outline' },
  { id: 'Tayari', label: 'Tayari', icon: 'bag-check-outline' },
  { id: 'Zimekamilika', label: 'Historia', icon: 'checkmark-done-outline' },
];

const STATUS_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  pending:    { color: '#F59E0B', bg: '#FFF7E6', label: 'Inasubiri' },
  confirmed:  { color: '#3B82F6', bg: '#EFF6FF', label: 'Imethibitishwa' },
  preparing:  { color: '#8B5CF6', bg: '#F5F3FF', label: 'Inaandaliwa' },
  on_the_way: { color: '#F97316', bg: '#FFF7ED', label: 'Njiani' },
  delivered:  { color: '#10B981', bg: '#ECFDF5', label: 'Imefikia' },
  cancelled:  { color: '#EF4444', bg: '#FEF2F2', label: 'Imekataliwa' },
  ready:      { color: '#10B981', bg: '#ECFDF5', label: 'Tayari' },
};

export default function AllOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Vyote');

  const fetchOrders = useCallback(async () => {
    try {
      const res = await ordersApi.getAllOrders();
      setOrders(res.data.results || res.data || []);
    } catch { setOrders([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];
    return orders.filter(it => {
      if (activeTab === 'Vyote') return true;
      if (activeTab === 'Mpya') return it?.status === 'pending' || it?.status === 'confirmed';
      if (activeTab === 'Preparing') return it?.status === 'preparing';
      if (activeTab === 'Tayari') return it?.status === 'ready' || it?.status === 'on_the_way';
      if (activeTab === 'Zimekamilika') return it?.status === 'delivered' || it?.status === 'cancelled';
      return true;
    });
  }, [orders, activeTab]);

  const updateStatus = async (id: number, status: string) => {
    try {
      await ordersApi.updateStatus(id, status);
      fetchOrders();
    } catch { Alert.alert('Hitilafu', 'Imeshindwa kubadilisha hali ya oda.'); }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F6" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Maagizo Yote</Text>
            <Text style={styles.headerSub}>{orders.length} oda zimepatikana</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => { setRefreshing(true); fetchOrders(); }}>
            <Ionicons name="refresh-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons name={tab.icon as any} size={14} color={activeTab === tab.id ? '#fff' : Colors.primary} />
              <Text style={[styles.tabTxt, activeTab === tab.id && styles.tabTxtActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadTxt}>Inapakia oda...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={it => String(it.id)}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[Colors.primary]} tintColor={Colors.primary} />
            }
            renderItem={({ item }) => <OrderRow order={item} onStatusChange={(s: string) => updateStatus(item.id, s)} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="receipt-outline" size={32} color={Colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>Hakuna Oda</Text>
                <Text style={styles.emptyDesc}>Hakuna oda katika kichujio hiki</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function OrderRow({ order, onStatusChange }: any) {
  const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending;

  return (
    <View style={styles.card}>
      {/* Card header */}
      <View style={styles.cardHeader}>
        <View style={styles.customerInfo}>
          <View style={styles.customerAvatar}>
            <Text style={styles.avatarTxt}>{order.customer_detail?.username?.[0]?.toUpperCase() || 'M'}</Text>
          </View>
          <View>
            <Text style={styles.customerName}>{order.customer_detail?.username || 'Mteja'}</Text>
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={11} color="#AAA" />
              <Text style={styles.orderTime}>
                {new Date(order.created_at).toLocaleDateString()} · {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusTxt, { color: sc.color }]}>{sc.label}</Text>
        </View>
      </View>

      {/* Order ID chip */}
      <View style={styles.orderIdRow}>
        <View style={styles.orderIdChip}>
          <Text style={styles.orderIdTxt}>ODA #{order.id}</Text>
        </View>
        <Text style={styles.itemCount}>{order.items?.length || 0} bidhaa</Text>
      </View>

      {/* Items */}
      <View style={styles.divider} />
      <Text style={styles.itemSummary} numberOfLines={2}>
        {order.items?.map((it: any) => `${it.quantity}× ${it.menu_item_detail?.name || 'Chakula'}`).join(' · ') || '—'}
      </Text>
      <View style={styles.divider} />

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.totalLabel}>Jumla ya Oda</Text>
          <Text style={styles.totalValue}>TSh {Number(order.total_price).toLocaleString()}</Text>
        </View>
        <View style={styles.actions}>
          {(order.status === 'pending' || order.status === 'confirmed') && (
            <TouchableOpacity style={styles.btnPrimary} onPress={() => onStatusChange('preparing')}>
              <Ionicons name="flame-outline" size={13} color="#fff" />
              <Text style={styles.btnTxt}>Andaa</Text>
            </TouchableOpacity>
          )}
          {order.status === 'preparing' && (
            <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: '#10B981' }]} onPress={() => onStatusChange('ready')}>
              <Ionicons name="bag-check-outline" size={13} color="#fff" />
              <Text style={styles.btnTxt}>Tayari</Text>
            </TouchableOpacity>
          )}
          {order.status === 'ready' && (
            <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: '#3B82F6' }]} onPress={() => onStatusChange('on_the_way')}>
              <Ionicons name="bicycle-outline" size={13} color="#fff" />
              <Text style={styles.btnTxt}>Tuma</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#1A1A1A' },
  headerSub: { fontSize: FontSize.sm, color: '#888', marginTop: 2 },
  refreshBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(196,60,0,0.08)', alignItems: 'center', justifyContent: 'center' },
  tabScroll: { maxHeight: 52 },
  tabContent: { paddingHorizontal: Spacing.lg, gap: 8, paddingBottom: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.full, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#EFEFEF' },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabTxt: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '700' },
  tabTxtActive: { color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadTxt: { color: '#888', fontSize: FontSize.sm },
  list: { paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingBottom: 120, paddingTop: Spacing.sm },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: Spacing.md, gap: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  customerAvatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(196,60,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: FontSize.md, fontWeight: '900', color: Colors.primary },
  customerName: { fontSize: FontSize.md, fontWeight: '800', color: '#1A1A1A' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  orderTime: { fontSize: FontSize.xs, color: '#AAA' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  statusTxt: { fontSize: FontSize.xs, fontWeight: '800' },
  orderIdRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderIdChip: { backgroundColor: '#F0F0F0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  orderIdTxt: { fontSize: FontSize.xs, fontWeight: '900', color: '#555' },
  itemCount: { fontSize: FontSize.xs, color: '#888', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F0F0F0' },
  itemSummary: { fontSize: FontSize.sm, color: '#555', lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: FontSize.xs, color: '#888', fontWeight: '600' },
  totalValue: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.primary },
  actions: { flexDirection: 'row', gap: 8 },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  btnTxt: { color: '#fff', fontSize: FontSize.sm, fontWeight: '800' },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 20, backgroundColor: 'rgba(196,60,0,0.08)', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '800', color: '#1A1A1A' },
  emptyDesc: { fontSize: FontSize.sm, color: '#888', textAlign: 'center' },
});
