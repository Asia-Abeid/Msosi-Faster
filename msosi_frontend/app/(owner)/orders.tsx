import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../../constants/colors';
import { ordersApi } from '../../services/api';
import i18n from '../../constants/i18n';

const TABS = ['Vyote', 'Mpya', 'Preparing', 'Tayari', 'Zimekamilika'];

export default function AllOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Vyote');

  const fetchOrders = useCallback(async () => {
    try {
      const res = await ordersApi.getAllOrders();
      setOrders(res.data.results || res.data || []);
    } catch (e: any) {
      console.error(e);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
    } catch (e: any) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Maagizo Yote / All Orders</Text>
      </View>

      <View style={styles.tabs}>
        <FlatList
          data={TABS} horizontal showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.tab, activeTab === item && styles.tabActive]} 
              onPress={() => setActiveTab(item)}
            >
              <Text style={[styles.tabTxt, activeTab === item && styles.tabTxtActive]}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.tabContent}
        />
      </View>

      {loading ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} /> : (
        <FlatList
          data={filteredOrders}
          keyExtractor={it => String(it.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[Colors.primary]} />}
          renderItem={({ item }: { item: any }) => <OrderRow order={item} onStatusChange={(s: string) => updateStatus(item.id, s)} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTxt}>Hakuna maagizo hapa</Text></View>}
        />
      )}
    </SafeAreaView>
  );
}

function OrderRow({ order, onStatusChange }: any) {
  const getStatusColor = () => {
    switch(order.status) {
      case 'pending': case 'confirmed': return Colors.warning;
      case 'preparing': return '#2563EB';
      case 'ready': case 'on_the_way': return Colors.primary;
      case 'delivered': return Colors.success;
      case 'cancelled': return Colors.error;
      default: return Colors.gray;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.orderIdWrap}><Text style={styles.orderId}>#{order.id}</Text></View>
        <Text style={styles.custName}>{order.customer_detail?.username}</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor() + '15' }]}>
          <Text style={[styles.badgeTxt, { color: getStatusColor() }]}>{order.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.divider} />
      <Text style={styles.itemSummary}>{order.items?.map((it: any) => `${it.quantity}x ${it.menu_item_detail?.name}`).join(', ')}</Text>
      
      <View style={styles.footer}>
        <Text style={styles.time}>{new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        <View style={styles.actions}>
           {order.status === 'pending' || order.status === 'confirmed' ? (
            <TouchableOpacity style={styles.actionBtn} onPress={() => onStatusChange('preparing')}><Text style={styles.actionBtnTxt}>Prepare</Text></TouchableOpacity>
           ) : order.status === 'preparing' ? (
            <TouchableOpacity style={styles.actionBtn} onPress={() => onStatusChange('ready')}><Text style={styles.actionBtnTxt}>Ready</Text></TouchableOpacity>
           ) : order.status === 'ready' ? (
            <TouchableOpacity style={styles.actionBtn} onPress={() => onStatusChange('on_the_way')}><Text style={styles.actionBtnTxt}>Dispatch</Text></TouchableOpacity>
           ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutralLight },
  header: { padding: Spacing.lg, paddingBottom: 10 },
  title: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.tertiary },
  tabs: { marginVertical: 10 },
  tabContent: { paddingHorizontal: Spacing.lg, gap: 10 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.grayLight },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabTxt: { fontSize: 13, color: Colors.gray, fontWeight: '600' },
  tabTxtActive: { color: Colors.white },
  list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 120 },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 16, ...Shadow.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderIdWrap: { backgroundColor: Colors.grayLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  orderId: { fontSize: 12, fontWeight: '800', color: Colors.black },
  custName: { flex: 1, fontSize: FontSize.md, fontWeight: '700', color: Colors.black },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeTxt: { fontSize: 10, fontWeight: '800' },
  divider: { height: 1, backgroundColor: Colors.grayLight, marginVertical: 12 },
  itemSummary: { fontSize: FontSize.sm, color: Colors.gray, lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  time: { fontSize: 11, color: Colors.gray },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm },
  actionBtnTxt: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  empty: { paddingVertical: 80, alignItems: 'center' },
  emptyTxt: { color: Colors.gray, fontSize: FontSize.md },
});
