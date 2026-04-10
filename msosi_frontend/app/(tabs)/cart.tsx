import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../../constants/colors';
import { useCart, CartItem } from '../../store/CartContext';
import { useAuth } from '../../store/AuthContext';
import { ordersApi, BASE_URL } from '../../services/api';
import i18n from '../../constants/i18n';

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
          price: i.price.toString()
        }))
      };
      
      const res = await ordersApi.create(orderData);
      router.push(`/payment/${res.data.id}?total=${grandTotal}`);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'Failed to create order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Text style={styles.title}>{i18n.t('cart.title')}</Text>
        <View style={styles.empty}>
          <Ionicons name="cart-outline" size={64} color={Colors.grayLight} />
          <Text style={styles.emptyTitle}>{i18n.t('cart.emptyTitle')}</Text>
          <Text style={styles.emptyDesc}>{i18n.t('cart.emptyDesc')}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.shopBtn}>
            <LinearGradient colors={Colors.primaryGradient} style={styles.shopBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.shopBtnText}>{i18n.t('cart.browseFood')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{i18n.t('cart.title')}</Text>
        <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
          <Ionicons name="trash-outline" size={16} color={Colors.error} />
          <Text style={styles.clearTxt}>{i18n.t('cart.clearAll')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <CartItemRow item={item} onIncrement={() => incrementItem(item.id)} onDecrement={() => decrementItem(item.id)} onRemove={() => removeItem(item.id)} />}
        ListFooterComponent={
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>{i18n.t('cart.summary')}</Text>
            <Row label={i18n.t('cart.subtotal')} value={totalPrice} />
            <Row label={i18n.t('cart.delivery')} value={deliveryFee} />
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{i18n.t('cart.total')}</Text>
              <Text style={styles.totalValue}>TSh {grandTotal.toLocaleString()}</Text>
            </View>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Checkout Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleCheckout}
          disabled={submitting}
          activeOpacity={0.9}
        >
          <LinearGradient colors={Colors.primaryGradient} style={styles.checkoutBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {submitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="shield-checkmark-outline" size={18} color={Colors.white} />
                <Text style={styles.checkoutTxt}>{i18n.t('cart.proceed')}</Text>
                <Text style={styles.checkoutPrice}>TSh {grandTotal.toLocaleString()}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.secured}>{i18n.t('cart.secured')}</Text>
      </View>
    </SafeAreaView>
  );
}

function CartItemRow({ item, onIncrement, onDecrement, onRemove }: {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}) {
  const imgUri = item.image ? `${BASE_URL.replace('/api', '')}${item.image}` : null;
  return (
    <View style={itemStyles.card}>
      {imgUri
        ? <Image source={{ uri: imgUri }} style={itemStyles.img} />
        : <View style={[itemStyles.img, itemStyles.imgPlaceholder]}><Ionicons name="restaurant-outline" size={22} color={Colors.grayLight} /></View>}
      <View style={itemStyles.info}>
        <Text style={itemStyles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={itemStyles.rest}>{item.restaurantName}</Text>
        <Text style={itemStyles.price}>TSh {(item.price * item.quantity).toLocaleString()}</Text>
      </View>
      <View style={itemStyles.qtyRow}>
        <TouchableOpacity style={itemStyles.qtyBtn} onPress={onDecrement}>
          <Ionicons name="remove" size={16} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={itemStyles.qty}>{item.quantity}</Text>
        <TouchableOpacity style={[itemStyles.qtyBtn, { backgroundColor: Colors.primary }]} onPress={onIncrement}>
          <Ionicons name="add" size={16} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>TSh {value.toLocaleString()}</Text>
    </View>
  );
}

const itemStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.sm, gap: Spacing.sm, ...Shadow.sm },
  img: { width: 70, height: 70, borderRadius: Radius.md, resizeMode: 'cover' },
  imgPlaceholder: { backgroundColor: Colors.neutral, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 2 },
  name: { fontSize: FontSize.md, fontWeight: '700', color: Colors.tertiary },
  rest: { fontSize: FontSize.xs, color: Colors.gray },
  price: { fontSize: FontSize.md, fontWeight: '800', color: Colors.primary, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(194,82,11,0.1)', alignItems: 'center', justifyContent: 'center' },
  qty: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.tertiary, minWidth: 22, textAlign: 'center' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralLight },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.tertiary },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clearTxt: { fontSize: FontSize.sm, color: Colors.error, fontWeight: '600' },
  list: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: 180 },
  summary: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.sm, marginTop: Spacing.sm, ...Shadow.md },
  summaryTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.tertiary, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: FontSize.md, color: Colors.gray },
  summaryValue: { fontSize: FontSize.md, color: Colors.tertiary, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.grayLight },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.tertiary },
  totalValue: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.primary },
  footer: { position: 'absolute', bottom: 80, left: Spacing.lg, right: Spacing.lg, gap: 8 },
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: Spacing.lg, borderRadius: Radius.lg, gap: Spacing.sm, ...Shadow.lg },
  checkoutTxt: { flex: 1, color: Colors.white, fontSize: FontSize.md, fontWeight: '800' },
  checkoutPrice: { color: Colors.white, fontSize: FontSize.md, fontWeight: '900' },
  secured: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.gray, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: Spacing.xl },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.tertiary },
  emptyDesc: { fontSize: FontSize.sm, color: Colors.gray, textAlign: 'center' },
  shopBtn: { borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing.sm },
  shopBtnGrad: { paddingVertical: 16, paddingHorizontal: Spacing.xl, alignItems: 'center' },
  shopBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '800' },
});
