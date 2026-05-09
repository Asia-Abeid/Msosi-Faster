import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Image, ActivityIndicator, RefreshControl,
  ScrollView, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, Spacing, Radius } from '../../constants/colors';
import { restaurantsApi, resolveImageUri } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useCart } from '../../store/CartContext';
import { useLanguage } from '../../store/LanguageContext';
import i18n from '../../constants/i18n';

const getCategories = () => [
  { id: 'all', label: i18n.t('home.categories.all'), icon: 'grid-outline' },
  { id: 'local', label: i18n.t('home.categories.local'), icon: 'leaf-outline' },
  { id: 'drinks', label: i18n.t('home.categories.drinks'), icon: 'cafe-outline' },
  { id: 'snacks', label: i18n.t('home.categories.snacks'), icon: 'pizza-outline' },
  { id: 'meat', label: i18n.t('home.categories.meat'), icon: 'flame-outline' },
  { id: 'fish', label: i18n.t('home.categories.fish'), icon: 'fish-outline' },
];

interface Restaurant {
  id: number;
  name: string;
  description: string;
  address: string;
  phone_number: string;
  image: string | null;
  is_active: boolean;
  created_at: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { totalItems, totalPrice } = useCart();
  useLanguage();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const fetchRestaurants = useCallback(async (q = '', p = 1, refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else if (p === 1) setLoading(true);
      const res = await restaurantsApi.list({ page: p, search: q });
      const data = res.data;
      setHasNext(!!data.next);
      setRestaurants(p === 1 ? data.results : (prev) => [...prev, ...data.results]);
      setPage(p);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchRestaurants(search, 1); }, [search]);
  useEffect(() => { fetchRestaurants('', 1); }, []);

  const onRefresh = () => fetchRestaurants(search, 1, true);
  const onLoadMore = () => { if (hasNext) fetchRestaurants(search, page + 1); };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return i18n.t('home.morning');
    if (h < 17) return i18n.t('home.afternoon');
    return i18n.t('home.evening');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Hero Header */}
        <LinearGradient
          colors={['#FF6D00', '#C43C00']}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroDecor} />
          <View style={styles.heroRow}>
            <View style={styles.heroLeft}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{user?.username || i18n.t('common.guest')}</Text>
            </View>
            <TouchableOpacity style={styles.notifBtn}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>

          {/* Search bar inside hero */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder={i18n.t('home.searchPlaceholder')}
              placeholderTextColor="#BABABA"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="#CCC" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* Promo banner */}
        {!search && (
          <View style={styles.promoBannerWrap}>
            <LinearGradient
              colors={['#5D1D00', '#C43C00']}
              style={styles.promoBanner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.promoText}>
                <Text style={styles.promoTitle}>{i18n.t('home.welcomePromo')}</Text>
                <Text style={styles.promoDesc}>{i18n.t('home.promoDesc')}</Text>
              </View>
              <View style={styles.promoIconWrap}>
                <Ionicons name="restaurant-outline" size={32} color="#fff" />
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScroll}
          contentContainerStyle={styles.catContent}
        >
          {getCategories().map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catChip, selectedCategory === cat.id && styles.catChipActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Ionicons
                name={cat.icon as any}
                size={16}
                color={selectedCategory === cat.id ? '#fff' : Colors.primary}
              />
              <Text style={[styles.catText, selectedCategory === cat.id && styles.catTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Section title */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            {search ? i18n.t('home.resultsFor', { search }) : i18n.t('home.openNow')}
          </Text>
          <Text style={styles.sectionCount}>{i18n.t('home.restaurantsCount', { count: restaurants.length })}</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadTxt}>{i18n.t('home.loading')}</Text>
          </View>
        ) : (
          <FlatList
            data={restaurants}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <RestaurantCard restaurant={item} onPress={() => router.push(`/restaurant/${item.id}`)} />
            )}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={<EmptyState search={search} />}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Cart Bar */}
        {totalItems > 0 && (
          <TouchableOpacity
            style={styles.cartBarWrap}
            onPress={() => router.push('/(tabs)/cart')}
            activeOpacity={0.9}
          >
            <LinearGradient colors={['#FF6D00', '#C43C00']} style={styles.cartBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeTxt}>{totalItems}</Text>
              </View>
              <Text style={styles.cartBarTxt}>{i18n.t('home.viewMyCart')}</Text>
              <View style={styles.cartPrice}>
                <Text style={styles.cartPriceTxt}>TSh {totalPrice.toLocaleString()}</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

function RestaurantCard({ restaurant, onPress }: { restaurant: Restaurant; onPress: () => void }) {
  const imgUri = resolveImageUri(restaurant.image);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.cardImgWrap}>
        {imgUri
          ? <Image source={{ uri: imgUri }} style={styles.cardImg} />
          : (
            <View style={[styles.cardImg, styles.cardImgPlaceholder]}>
              <Ionicons name="restaurant-outline" size={36} color={Colors.primary} />
            </View>
          )}
        {!restaurant.is_active && (
          <View style={styles.closedBadge}>
            <Text style={styles.closedTxt}>{i18n.t('home.closed')}</Text>
          </View>
        )}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={11} color="#F59E0B" />
          <Text style={styles.ratingTxt}>5.0</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{restaurant.name}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{restaurant.description || i18n.t('home.defaultDesc')}</Text>
        <View style={styles.cardMeta}>
          <View style={styles.metaChip}>
            <Ionicons name="bicycle-outline" size={12} color="#10B981" />
            <Text style={[styles.metaTxt, { color: '#10B981' }]}>{i18n.t('home.freeDelivery')}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={12} color={Colors.primary} />
            <Text style={styles.metaTxt}>{i18n.t('home.deliveryTime')}</Text>
          </View>
          <TouchableOpacity onPress={onPress} style={styles.viewBtn}>
            <LinearGradient colors={['#FF6D00', '#C43C00']} style={styles.viewBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.viewBtnTxt}>{i18n.t('home.view')}</Text>
              <Ionicons name="arrow-forward" size={12} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
    <View style={styles.center}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="restaurant-outline" size={36} color={Colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{search ? i18n.t('home.noResults') : i18n.t('home.noRestaurants')}</Text>
      <Text style={styles.emptyDesc}>
        {search ? i18n.t('home.noResultsDesc', { search }) : i18n.t('home.noRestaurantsDesc')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },
  hero: { paddingTop: 12, paddingHorizontal: Spacing.lg, paddingBottom: 36, overflow: 'hidden' },
  heroDecor: {
    position: 'absolute', top: -80, right: -80,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  heroLeft: { gap: 2 },
  greeting: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  userName: { fontSize: FontSize.xl, fontWeight: '900', color: '#fff' },
  notifBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#F59E0B', borderWidth: 1.5, borderColor: Colors.secondary,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: Spacing.md, paddingVertical: 2,
  },
  searchInput: { flex: 1, fontSize: FontSize.md, color: '#1A1A1A', paddingVertical: 13 },
  promoBannerWrap: { paddingHorizontal: Spacing.lg, marginTop: Spacing.md },
  promoBanner: {
    borderRadius: 18, flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, overflow: 'hidden',
  },
  promoText: { flex: 1, gap: 2 },
  promoTitle: { fontSize: FontSize.md, fontWeight: '900', color: '#fff' },
  promoDesc: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.82)', lineHeight: 16 },
  promoIconWrap: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  catScroll: { marginTop: Spacing.md },
  catContent: { paddingHorizontal: Spacing.lg, gap: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: Radius.full,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#EFEFEF',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '700' },
  catTextActive: { color: '#fff' },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: 8,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '900', color: '#1A1A1A' },
  sectionCount: { fontSize: FontSize.sm, color: '#999', fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  loadTxt: { fontSize: FontSize.sm, color: '#888' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 180, gap: Spacing.md, paddingTop: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 14, elevation: 3,
  },
  cardImgWrap: { height: 175, position: 'relative' },
  cardImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardImgPlaceholder: { backgroundColor: '#FFF3EF', alignItems: 'center', justifyContent: 'center' },
  closedBadge: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  closedTxt: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  ratingBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  ratingTxt: { fontSize: FontSize.xs, fontWeight: '800', color: '#1A1A1A' },
  cardBody: { padding: Spacing.md, gap: 6 },
  cardName: { fontSize: FontSize.lg, fontWeight: '900', color: '#1A1A1A' },
  cardDesc: { fontSize: FontSize.sm, color: '#888', lineHeight: 18 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F6F6F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full,
  },
  metaTxt: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },
  viewBtn: { marginLeft: 'auto', borderRadius: Radius.full, overflow: 'hidden' },
  viewBtnGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingHorizontal: 12,
  },
  viewBtnTxt: { color: '#fff', fontSize: FontSize.xs, fontWeight: '800' },
  cartBarWrap: {
    position: 'absolute', bottom: 85, left: Spacing.lg, right: Spacing.lg,
    borderRadius: 16, overflow: 'hidden',
    shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  cartBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 14, gap: Spacing.sm,
  },
  cartBadge: {
    width: 28, height: 28, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeTxt: { color: '#fff', fontSize: FontSize.xs, fontWeight: '900' },
  cartBarTxt: { flex: 1, color: '#fff', fontSize: FontSize.sm, fontWeight: '800' },
  cartPrice: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cartPriceTxt: { color: '#fff', fontSize: FontSize.sm, fontWeight: '900' },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: 'rgba(196,60,0,0.08)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '800', color: '#1A1A1A' },
  emptyDesc: { fontSize: FontSize.sm, color: '#888', textAlign: 'center', lineHeight: 20, paddingHorizontal: Spacing.xl },
});

