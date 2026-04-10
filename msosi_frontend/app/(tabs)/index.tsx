import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Image, ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../../constants/colors';
import { restaurantsApi, BASE_URL } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useCart } from '../../store/CartContext';
import i18n from '../../constants/i18n';

const CATEGORIES = ['Vyote', 'Local', 'Vinywaji', 'Vitafunio', 'Nyama', 'Samaki'];

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

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Vyote');
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
    if (h < 12) return { text: i18n.t('home.morning'), icon: 'sunny-outline' };
    if (h < 17) return { text: i18n.t('home.afternoon'), icon: 'partly-sunny-outline' };
    return { text: i18n.t('home.evening'), icon: 'moon-outline' };
  };

  const { text: greetingText, icon: greetingIcon } = getGreeting();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={Colors.primaryGradient} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name={greetingIcon as any} size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.greeting}>{greetingText}</Text>
          </View>
          <Text style={styles.userName}>{user?.username || i18n.t('common.guest')}</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tafuta mkahawa au chakula..."
            placeholderTextColor={Colors.gray}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catContent}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>
        {search ? i18n.t('home.resultsFor', { search }) : i18n.t('home.nearby')}
      </Text>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadTxt}>Inapakia...</Text>
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <RestaurantCard restaurant={item} onPress={() => router.push(`/restaurant/${item.id}`)} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={<EmptyState search={search} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Cart Bar */}
      {totalItems > 0 && (
        <TouchableOpacity style={styles.cartBar} onPress={() => router.push('/(tabs)/cart')} activeOpacity={0.9}>
          <LinearGradient colors={Colors.primaryGradient} style={styles.cartBarGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
            <Text style={styles.cartBarText}>Angalia Kikapu / View Cart</Text>
            <Text style={styles.cartBarPrice}>TSh {totalPrice.toLocaleString()} →</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

function RestaurantCard({ restaurant, onPress }: { restaurant: Restaurant; onPress: () => void }) {
  const imgUri = restaurant.image ? `${BASE_URL.replace('/api', '')}${restaurant.image}` : null;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.cardImgWrap}>
        {imgUri
          ? <Image source={{ uri: imgUri }} style={styles.cardImg} />
          : <View style={[styles.cardImg, styles.cardImgPlaceholder]}><Ionicons name="restaurant-outline" size={36} color={Colors.grayLight} /></View>}
        {!restaurant.is_active && (
          <View style={styles.closedBadge}><Text style={styles.closedText}>Imefungwa</Text></View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{restaurant.name}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{restaurant.description || 'Karibu kula kwetu!'}</Text>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color={Colors.gray} />
            <Text style={styles.metaTxt} numberOfLines={1}>{restaurant.address}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={13} color={Colors.warning} />
            <Text style={styles.metaTxt}>5.0</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.timeChip}>
            <Ionicons name="time-outline" size={12} color={Colors.primary} />
            <Text style={styles.timeTxt}>30-45 min</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={onPress}>
            <LinearGradient colors={Colors.primaryGradient} style={styles.addBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="arrow-forward" size={16} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="restaurant-outline" size={48} color={Colors.grayLight} />
      <Text style={styles.emptyTitle}>{search ? 'Hakuna matokeo' : 'Hakuna mikahawa'}</Text>
      <Text style={styles.emptyDesc}>
        {search ? `Hakuna mkahawa wa "${search}"` : 'Mikahawa itaonekana hapa'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralLight },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  userName: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.white },
  notifBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  searchWrap: { paddingHorizontal: Spacing.lg, marginTop: Spacing.md },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: 13, gap: 10, ...Shadow.sm },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.black },
  catScroll: { marginTop: Spacing.md },
  catContent: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  catChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.grayLight },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { fontSize: FontSize.sm, color: Colors.gray, fontWeight: '600' },
  catTextActive: { color: Colors.white },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.tertiary, paddingHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.sm },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 160, gap: Spacing.md },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadTxt: { color: Colors.gray, fontSize: FontSize.sm },
  card: { backgroundColor: Colors.white, borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.md },
  cardImgWrap: { height: 180, position: 'relative' },
  cardImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardImgPlaceholder: { backgroundColor: Colors.neutral, alignItems: 'center', justifyContent: 'center' },
  closedBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  closedText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: '700' },
  cardBody: { padding: Spacing.md, gap: 6 },
  cardName: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.tertiary },
  cardDesc: { fontSize: FontSize.sm, color: Colors.gray, lineHeight: 18 },
  cardMeta: { flexDirection: 'row', gap: Spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  metaTxt: { fontSize: FontSize.xs, color: Colors.gray, flex: 1 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(194,82,11,0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  timeTxt: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },
  addBtn: { borderRadius: Radius.full, overflow: 'hidden' },
  addBtnGrad: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cartBar: { position: 'absolute', bottom: 85, left: Spacing.lg, right: Spacing.lg, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.lg },
  cartBarGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 14, gap: Spacing.sm },
  cartBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: '900' },
  cartBarText: { flex: 1, color: Colors.white, fontSize: FontSize.sm, fontWeight: '700' },
  cartBarPrice: { color: Colors.white, fontSize: FontSize.sm, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.tertiary },
  emptyDesc: { fontSize: FontSize.sm, color: Colors.gray, textAlign: 'center' },
});
