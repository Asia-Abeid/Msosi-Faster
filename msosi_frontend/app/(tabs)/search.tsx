import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Image, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../../constants/colors';
import { restaurantsApi, BASE_URL } from '../../services/api';
import i18n from '../../constants/i18n';

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>{i18n.t('search.title')}</Text>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={Colors.gray} />
        <TextInput
          style={styles.input}
          placeholder={i18n.t('search.placeholder')}
          placeholderTextColor={Colors.gray}
          value={query}
          onChangeText={(t) => { setQuery(t); doSearch(t); }}
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
            <Ionicons name="close-circle" size={20} color={Colors.gray} />
          </TouchableOpacity>
        )}
      </View>

      {!searched && (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={48} color={Colors.grayLight} />
          <Text style={styles.emptyTitle}>{i18n.t('search.placeholder')}</Text>
          <Text style={styles.emptyDesc}>{i18n.t('search.placeholder')}</Text>
        </View>
      )}

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      )}

      {!loading && searched && (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultCard}
              onPress={() => router.push(`/restaurant/${item.id}`)}
              activeOpacity={0.85}
            >
              {item.image
                ? <Image source={{ uri: `${BASE_URL.replace('/api', '')}${item.image}` }} style={styles.img} />
                : <View style={[styles.img, styles.imgPlaceholder]}><Ionicons name="restaurant-outline" size={28} color={Colors.grayLight} /></View>}
              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultAddr} numberOfLines={1}>{item.address}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="star" size={12} color={Colors.warning} />
                  <Text style={styles.metaTxt}>5.0</Text>
                  <Ionicons name="time-outline" size={12} color={Colors.gray} />
                  <Text style={styles.metaTxt}>30-45 min</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="alert-circle-outline" size={48} color={Colors.grayLight} />
              <Text style={styles.emptyTitle}>{i18n.t('search.noResults')}</Text>
              <Text style={styles.emptyDesc}>{i18n.t('search.noResultsDesc')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralLight },
  title: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.tertiary, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, marginBottom: Spacing.md },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: 14,
    ...Shadow.md, borderWidth: 2, borderColor: Colors.secondary,
  },
  input: { flex: 1, fontSize: FontSize.md, color: Colors.black },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  resultCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.sm,
    ...Shadow.sm,
  },
  img: { width: 70, height: 70, borderRadius: Radius.md, resizeMode: 'cover' },
  imgPlaceholder: { backgroundColor: Colors.neutral, alignItems: 'center', justifyContent: 'center' },
  resultInfo: { flex: 1, gap: 3 },
  resultName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.tertiary },
  resultAddr: { fontSize: FontSize.xs, color: Colors.gray },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaTxt: { fontSize: FontSize.xs, color: Colors.gray },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.tertiary },
  emptyDesc: { fontSize: FontSize.sm, color: Colors.gray, textAlign: 'center', paddingHorizontal: Spacing.xl },
});
