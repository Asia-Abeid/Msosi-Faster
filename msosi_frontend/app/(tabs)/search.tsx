import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Image, ActivityIndicator, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius } from '../../constants/colors';
import { restaurantsApi, BASE_URL } from '../../services/api';

const RECENT_KEYWORDS = ['Burger', 'Pizza', 'Nyama', 'Samaki', 'Vinywaji', 'Pilau'];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const res = await restaurantsApi.list({ search: q });
      setResults(res.data.results);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  const clearSearch = () => { setQuery(''); setResults([]); setSearched(false); };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F6" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tafuta</Text>
          <Text style={styles.headerSub}>Pata mkahawa au chakula unachotaka</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={Colors.primary} />
          <TextInput
            style={styles.input}
            placeholder="Tafuta mkahawa, chakula..."
            placeholderTextColor="#BABABA"
            value={query}
            onChangeText={(t) => { setQuery(t); doSearch(t); }}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color="#BBB" />
            </TouchableOpacity>
          )}
        </View>

        {/* Idle state: recent keywords */}
        {!searched && (
          <View style={styles.idle}>
            <Text style={styles.idleTitle}>Maneno ya Kawaida</Text>
            <View style={styles.keywordsRow}>
              {RECENT_KEYWORDS.map((kw) => (
                <TouchableOpacity
                  key={kw}
                  style={styles.keywordChip}
                  onPress={() => { setQuery(kw); doSearch(kw); }}
                >
                  <Ionicons name="time-outline" size={13} color={Colors.primary} />
                  <Text style={styles.keywordTxt}>{kw}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.loadingTxt}>Inatafuta...</Text>
          </View>
        )}

        {!loading && searched && (
          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Text style={styles.resultsHeader}>
                {results.length > 0 ? `${results.length} matokeo kwa "${query}"` : ''}
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultCard}
                onPress={() => router.push(`/restaurant/${item.id}`)}
                activeOpacity={0.85}
              >
                {item.image
                  ? <Image source={{ uri: `${BASE_URL.replace('/api', '')}${item.image}` }} style={styles.img} />
                  : (
                    <View style={styles.imgPlaceholder}>
                      <Ionicons name="restaurant-outline" size={24} color={Colors.primary} />
                    </View>
                  )}
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{item.name}</Text>
                  <Text style={styles.resultAddr} numberOfLines={1}>{item.address}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.metaTxt}>5.0</Text>
                    <View style={styles.dot} />
                    <Ionicons name="time-outline" size={12} color="#999" />
                    <Text style={styles.metaTxt}>30–45 min</Text>
                    <View style={styles.dot} />
                    <Text style={styles.freeTxt}>Delivery Bure</Text>
                  </View>
                </View>
                <View style={styles.arrowWrap}>
                  <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.center}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="search-outline" size={32} color={Colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>Hakuna Matokeo</Text>
                <Text style={styles.emptyDesc}>Hakuna mkahawa wa "{query}". Jaribu neno lingine.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#1A1A1A' },
  headerSub: { fontSize: FontSize.sm, color: '#888', marginTop: 2 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', marginHorizontal: Spacing.lg,
    borderRadius: 16, paddingHorizontal: Spacing.md, paddingVertical: 5,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
    borderWidth: 1.5, borderColor: '#EFEFEF',
  },
  input: { flex: 1, fontSize: FontSize.md, color: '#1A1A1A', paddingVertical: 12 },
  idle: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },
  idleTitle: { fontSize: FontSize.sm, fontWeight: '800', color: '#555', marginBottom: 14, letterSpacing: 0.5 },
  keywordsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keywordChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: '#EFEFEF',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  keywordTxt: { fontSize: FontSize.sm, color: '#444', fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  loadingTxt: { fontSize: FontSize.sm, color: '#888', marginTop: 8 },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.sm, paddingBottom: 100 },
  resultsHeader: { fontSize: FontSize.sm, color: '#888', fontWeight: '600', marginBottom: 6 },
  resultCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: '#fff', borderRadius: 16, padding: Spacing.sm,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  img: { width: 70, height: 70, borderRadius: 12, resizeMode: 'cover' },
  imgPlaceholder: {
    width: 70, height: 70, borderRadius: 12,
    backgroundColor: 'rgba(196,60,0,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  resultInfo: { flex: 1, gap: 3 },
  resultName: { fontSize: FontSize.md, fontWeight: '800', color: '#1A1A1A' },
  resultAddr: { fontSize: FontSize.xs, color: '#888' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaTxt: { fontSize: FontSize.xs, color: '#999' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#CCC' },
  freeTxt: { fontSize: FontSize.xs, color: '#10B981', fontWeight: '700' },
  arrowWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(196,60,0,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: 'rgba(196,60,0,0.08)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '800', color: '#1A1A1A' },
  emptyDesc: { fontSize: FontSize.sm, color: '#888', textAlign: 'center', lineHeight: 20 },
});
