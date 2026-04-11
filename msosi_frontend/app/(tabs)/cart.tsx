import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, Spacing, Radius } from '../../constants/colors';
import { useCart, CartItem } from '../../store/CartContext';
import { useAuth } from '../../store/AuthContext';
import { ordersApi, BASE_URL } from '../../services/api';

export default function CartScreen() {
  const router = useRouter();
  const { items, totalPrice, totalItems, incrementItem, decrementItem, removeItem, clearCart } = useCart();
  const [submitting, setSubmitting] = React.useState(false);
  const { user } = useAuth();

  const deliveryFee = totalPrice > 0 ? 3000 : 0;
  const grandTotal = totalPrice + deliveryFee;

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      const orderData = {
        delivery_address: user?.address || 'Customer Address',
        total_price: grandTotal.toString(),
        items: items.map(i => ({
          menu_item: i.menuItemId,
          quantity: i.quantity,
          price: i.price.toString(),
        })),
      };
      const res = await ordersApi.create(orderData);
      router.push(`/payment/${res.data.id}?total=${grandTotal}`);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Hitilafu', 'Imeshindwa kuunda oda. Tafadhali jaribu tena.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F6F6F6" />
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.headerSimple}>
            <Text style={styles.headerTitle}>Kikapu Changu</Text>
          </View>
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="cart-outline" size={44} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Kikapu Chako ni Tupu</Text>
            <Text style={styles.emptyDesc}>Ongeza chakula kutoka kwa mikahawa inayopendeza ili uendelee.</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)')} activeOpacity={0.85} style={styles.shopBtnWrap}>
              <LinearGradient colors={['#FF6D00', '#C43C00']} style={styles.shopBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="restaurant-outline" size={18} color="#fff" />
                <Text style={styles.shopBtnTxt}>Tazama Mikahawa</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F6" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Kikapu Changu</Text>
            <Text style={styles.headerSub}>{totalItems} bidhaa · Chakula {items[0]?.restaurantName}</Text>
          </View>
          <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={16} color={Colors.error} />
            <Text style={styles.clearTxt}>Futa Yote</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <CartItemRow
              item={item}
              onIncrement={() => incrementItem(item.id)}
              onDecrement={() => decrementItem(item.id)}
              onRemove={() => removeItem(item.id)}
            />
          )}
          ListFooterComponent={
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Muhtasari wa Oda</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Jumla ya Chakula</Text>
                <Text style={styles.summaryValue}>TSh {totalPrice.toLocaleString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="bicycle-outline" size={14} color="#888" />
                  <Text style={styles.summaryLabel}>Ada ya Usafirishaji</Text>
                </View>
                <Text style={styles.summaryValue}>TSh {deliveryFee.toLocaleString()}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Jumla Yote</Text>
                <Text style={styles.totalValue}>TSh {grandTotal.toLocaleString()}</Text>
              </View>
            </View>
          }
        />

        {/* Fixed checkout footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleCheckout} disabled={submitting} activeOpacity={0.88} style={styles.checkoutWrap}>
            <LinearGradient colors={['#FF6D00', '#C43C00']} style={styles.checkoutBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
                  <Text style={styles.checkoutTxt}>Lipia Sasa</Text>
                  <View style={styles.pricePill}>
                    <Text style={styles.pricePillTxt}>TSh {grandTotal.toLocaleString()}</Text>
                  </View>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <View style={styles.securedRow}>
            <Ionicons name="lock-closed-outline" size={12} color="#999" />
            <Text style={styles.securedTxt}>Malipo salama yanasindwa</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function CartItemRow({ item, onIncrement, onDecrement, onRemove }: {
  item: CartItem; onIncrement: () => void; onDecrement: () => void; onRemove: () => void;
}) {
  const imgUri = item.image ? `${BASE_URL.replace('/api', '')}${item.image}` : null;
  return (
    <View style={itemStyles.card}>
      {imgUri
        ? <Image source={{ uri: imgUri }} style={itemStyles.img} />
        : (
          <View style={itemStyles.imgPlaceholder}>
            <Ionicons name="fast-food-outline" size={22} color={Colors.primary} />
          </View>
        )}
      <View style={itemStyles.info}>
        <Text style={itemStyles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={itemStyles.rest} numberOfLines={1}>{item.restaurantName}</Text>
        <Text style={itemStyles.price}>TSh {(item.price).toLocaleString()} × {item.quantity}</Text>
      </View>
      <View style={itemStyles.controls}>
        <TouchableOpacity style={itemStyles.qtyBtn} onPress={onDecrement}>
          <Ionicons name="remove" size={14} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={itemStyles.qty}>{item.quantity}</Text>
        <TouchableOpacity style={[itemStyles.qtyBtn, itemStyles.qtyBtnFilled]} onPress={onIncrement}>
          <Ionicons name="add" size={14} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const itemStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#fff', borderRadius: 16, padding: Spacing.sm,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  img: { width: 72, height: 72, borderRadius: 12, resizeMode: 'cover' },
  imgPlaceholder: {
    width: 72, height: 72, borderRadius: 12,
    backgroundColor: 'rgba(196,60,0,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1, gap: 3 },
  name: { fontSize: FontSize.md, fontWeight: '800', color: '#1A1A1A' },
  rest: { fontSize: FontSize.xs, color: '#888' },
  price: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary, marginTop: 2 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: 'rgba(196,60,0,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnFilled: { backgroundColor: Colors.primary },
  qty: { fontSize: FontSize.md, fontWeight: '900', color: '#1A1A1A', minWidth: 20, textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },
  headerSimple: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#1A1A1A' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  headerSub: { fontSize: FontSize.xs, color: '#888', marginTop: 2 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clearTxt: { fontSize: FontSize.sm, color: Colors.error, fontWeight: '700' },
  list: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: 220 },
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 20,
    padding: Spacing.lg, gap: 12, marginTop: Spacing.sm,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  summaryTitle: { fontSize: FontSize.lg, fontWeight: '900', color: '#1A1A1A', marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: FontSize.md, color: '#888' },
  summaryValue: { fontSize: FontSize.md, color: '#444', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F0F0F0' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: FontSize.lg, fontWeight: '900', color: '#1A1A1A' },
  totalValue: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.primary },
  footer: {
    position: 'absolute', bottom: 80, left: Spacing.lg, right: Spacing.lg, gap: 8,
  },
  checkoutWrap: { borderRadius: 16, overflow: 'hidden', shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  checkoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 17, paddingHorizontal: Spacing.lg, gap: 10,
  },
  checkoutTxt: { flex: 1, color: '#fff', fontSize: FontSize.md, fontWeight: '800' },
  pricePill: {
    backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12,
    paddingVertical: 5, borderRadius: Radius.full,
  },
  pricePillTxt: { color: '#fff', fontSize: FontSize.sm, fontWeight: '900' },
  securedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  securedTxt: { fontSize: FontSize.xs, color: '#999', fontWeight: '500' },
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: Spacing.xl,
  },
  emptyIconWrap: {
    width: 90, height: 90, borderRadius: 24,
    backgroundColor: 'rgba(196,60,0,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '900', color: '#1A1A1A' },
  emptyDesc: { fontSize: FontSize.md, color: '#888', textAlign: 'center', lineHeight: 22 },
  shopBtnWrap: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  shopBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 15, paddingHorizontal: 28 },
  shopBtnTxt: { color: '#fff', fontSize: FontSize.md, fontWeight: '800' },
});
