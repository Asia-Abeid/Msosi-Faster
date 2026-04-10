import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, FlatList, TouchableOpacity,
  ActivityIndicator, ScrollView, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../../constants/colors';
import { restaurantsApi, BASE_URL } from '../../services/api';
import { useCart } from '../../store/CartContext';
import i18n from '../../constants/i18n';

const { width } = Dimensions.get('window');

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string;
  image: string | null;
  is_available: boolean;
}

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem, getItemQuantity, totalItems, totalPrice } = useCart();

  const [restaurant, setRestaurant] = useState<any>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resDetail, resMenu] = await Promise.all([
          restaurantsApi.detail(Number(id)),
          restaurantsApi.menu(Number(id)),
        ]);
        setRestaurant(resDetail.data);
        setMenu(resMenu.data.results || resMenu.data);
      } catch (error) {
        console.error('Error fetching restaurant details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const bannerUri = restaurant?.image ? `${BASE_URL.replace('/api', '')}${restaurant.image}` : null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner Image */}
        <View style={styles.bannerContainer}>
          {bannerUri ? (
            <Image source={{ uri: bannerUri }} style={styles.banner} />
          ) : (
            <View style={[styles.banner, styles.bannerPlaceholder]}>
              <Ionicons name="restaurant-outline" size={64} color={Colors.grayLight} />
            </View>
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent']}
            style={styles.headerOverlay}
          />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Restaurant Info */}
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{restaurant?.name}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color={Colors.white} />
              <Text style={styles.ratingText}>5.0</Text>
            </View>
          </View>
          <Text style={styles.address}>{restaurant?.address}</Text>
          <Text style={styles.description}>{restaurant?.description || i18n.t('restaurant.welcome')}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={Colors.primary} />
              <Text style={styles.metaValue}>30-45 min</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="bicycle-outline" size={16} color={Colors.primary} />
              <Text style={styles.metaValue}>TSh 3,000</Text>
            </View>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>{i18n.t('restaurant.menu')}</Text>
          {menu.map((item) => (
            <MenuCard
              key={item.id}
              item={item}
              restaurantId={Number(id)}
              restaurantName={restaurant?.name}
              quantity={getItemQuantity(item.id)}
              onAdd={() => addItem({
                menuItemId: item.id,
                restaurantId: Number(id),
                restaurantName: restaurant?.name,
                name: item.name,
                price: Number(item.price),
                image: item.image || undefined,
              })}
              onPress={() => router.push(`/food/${item.id}`)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Floating Cart Bar */}
      {totalItems > 0 && (
        <TouchableOpacity 
          style={styles.cartBar} 
          onPress={() => router.push('/(tabs)/cart')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={Colors.primaryGradient}
            style={styles.cartBarContent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
            <Text style={styles.cartBarText}>{i18n.t('cart.viewCart')}</Text>
            <Text style={styles.cartBarTotal}>TSh {totalPrice.toLocaleString()}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

function MenuCard({ item, restaurantId, restaurantName, quantity, onAdd, onPress }: any) {
  const imgUri = item.image ? `${BASE_URL.replace('/api', '')}${item.image}` : null;
  return (
    <TouchableOpacity style={styles.menuCard} onPress={onPress}>
      <View style={styles.menuInfo}>
        <Text style={styles.menuName}>{item.name}</Text>
        <Text style={styles.menuDesc} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.menuPrice}>TSh {Number(item.price).toLocaleString()}</Text>
      </View>
      <View style={styles.menuAction}>
        {imgUri ? (
          <Image source={{ uri: imgUri }} style={styles.menuImg} />
        ) : (
          <View style={[styles.menuImg, styles.menuImgPlaceholder]}>
            <Ionicons name="fast-food-outline" size={24} color={Colors.grayLight} />
          </View>
        )}
        <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
          <LinearGradient
            colors={Colors.primaryGradient}
            style={styles.addBtnGrad}
          >
            <Ionicons name={quantity > 0 ? "add" : "add"} size={20} color={Colors.white} />
          </LinearGradient>
          {quantity > 0 && (
            <View style={styles.itemQtyBadge}>
              <Text style={styles.itemQtyText}>{quantity}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  bannerContainer: { width: width, height: 250, position: 'relative' },
  banner: { width: '100%', height: '100%', resizeMode: 'cover' },
  bannerPlaceholder: { backgroundColor: Colors.neutral, justifyContent: 'center', alignItems: 'center' },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 80 },
  backBtn: { position: 'absolute', top: 50, left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  infoContainer: { padding: Spacing.lg, backgroundColor: Colors.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  name: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.tertiary },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.warning, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  ratingText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: '700', marginLeft: 4 },
  address: { fontSize: FontSize.sm, color: Colors.gray, marginBottom: 10 },
  description: { fontSize: FontSize.md, color: Colors.gray, lineHeight: 22, marginBottom: 15 },
  metaRow: { flexDirection: 'row', gap: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaValue: { fontSize: FontSize.sm, color: Colors.tertiary, fontWeight: '600' },
  menuSection: { padding: Spacing.lg },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.tertiary, marginBottom: 20 },
  menuCard: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.grayLight },
  menuInfo: { flex: 1, paddingRight: 15 },
  menuName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.tertiary, marginBottom: 5 },
  menuDesc: { fontSize: FontSize.sm, color: Colors.gray, marginBottom: 8 },
  menuPrice: { fontSize: FontSize.md, fontWeight: '800', color: Colors.primary },
  menuAction: { alignItems: 'center' },
  menuImg: { width: 90, height: 90, borderRadius: Radius.md, marginBottom: -15 },
  menuImgPlaceholder: { backgroundColor: Colors.neutral, justifyContent: 'center', alignItems: 'center' },
  addBtn: { width: 36, height: 36, borderRadius: 18, ...Shadow.md },
  addBtnGrad: { width: '100%', height: '100%', borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  itemQtyBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: Colors.tertiary, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.white },
  itemQtyText: { color: Colors.white, fontSize: 10, fontWeight: '900' },
  cartBar: { position: 'absolute', bottom: 30, left: 20, right: 20, borderRadius: Radius.lg, ...Shadow.lg },
  cartBarContent: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: Radius.lg },
  cartBadge: { backgroundColor: Colors.white, width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cartBadgeText: { color: Colors.primary, fontWeight: '900', fontSize: 12 },
  cartBarText: { flex: 1, color: Colors.white, fontWeight: '700', fontSize: 15 },
  cartBarTotal: { color: Colors.white, fontWeight: '900', fontSize: 16 },
});
