import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../../constants/colors';
import { useAuth } from '../../store/AuthContext';
import { BASE_URL, resolveImageUri } from '../../services/api';

import i18n from '../../constants/i18n';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(i18n.t('common.logout'), i18n.t('common.logoutConfirm'), [
      { text: i18n.t('common.no'), style: 'cancel' },
      {
        text: i18n.t('common.yes'), style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logout();
          setLoggingOut(false);
        },
      },
    ]);
  };

  const avatarUri = user?.profile_picture 
    ? resolveImageUri(user.profile_picture)
    : null;

  const menuItems = user?.is_restaurant_owner ? [
    { icon: 'business-outline',       label: i18n.t('profile.owner.restaurantInfo'), onPress: () => {} },
    { icon: 'card-outline',           label: i18n.t('profile.owner.payoutSettings'), onPress: () => router.push('/(owner)/earnings') },
    { icon: 'settings-outline',       label: i18n.t('settings.title'),           onPress: () => router.push('/settings') },
    { icon: 'help-circle-outline',    label: i18n.t('profile.help'),         onPress: () => {} },
    { icon: 'information-circle-outline', label: i18n.t('profile.about'),    onPress: () => {} },
  ] : [
    { icon: 'receipt-outline',       label: i18n.t('profile.myOrders'),      onPress: () => router.push('/(tabs)/orders') },
    { icon: 'location-outline',       label: i18n.t('profile.myAddresses'),    onPress: () => {} },
    { icon: 'card-outline',           label: i18n.t('profile.paymentMethods'), onPress: () => {} },
    { icon: 'star-outline',           label: i18n.t('profile.myReviews'),    onPress: () => {} },
    { icon: 'settings-outline',       label: i18n.t('settings.title'),           onPress: () => router.push('/settings') },
    { icon: 'help-circle-outline',    label: i18n.t('profile.help'),         onPress: () => {} },
    { icon: 'information-circle-outline', label: i18n.t('profile.about'),    onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile Card */}
        <LinearGradient colors={Colors.primaryGradient} style={styles.profileCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.decorCircle} />
          <View style={styles.avatarRow}>
            {avatarUri
              ? <Image source={{ uri: avatarUri }} style={styles.avatar} />
              : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase() ?? '?'}</Text>
                </View>
              )}
            <TouchableOpacity style={styles.editBtn}>
              <Ionicons name="camera-outline" size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{user?.username ?? i18n.t('common.guest')}</Text>
          <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
          {user?.phone_number && (
            <View style={styles.phoneBadge}>
              <Ionicons name="call-outline" size={12} color={Colors.white} />
              <Text style={styles.phoneTxt}>{user.phone_number}</Text>
            </View>
          )}
          <View style={styles.roleBadge}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons 
                name={user?.is_restaurant_owner ? 'restaurant-outline' : 'person-outline'} 
                size={14} 
                color={Colors.white} 
              />
              <Text style={styles.roleTxt}>
                {user?.is_restaurant_owner ? i18n.t('register.owner') : i18n.t('register.customer')}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: i18n.t('profile.stats.orders'), value: '12' },
            { label: i18n.t('profile.stats.reviews'), value: '8' },
            { label: i18n.t('profile.stats.points'), value: '240' },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} onPress={item.onPress} activeOpacity={0.75}>
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.grayLight} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} disabled={loggingOut} activeOpacity={0.85}>
          {loggingOut
            ? <ActivityIndicator color={Colors.error} />
            : (
              <>
                <Ionicons name="log-out-outline" size={20} color={Colors.error} />
                <Text style={styles.logoutTxt}>{i18n.t('common.logout')}</Text>
              </>
            )}
        </TouchableOpacity>

        <Text style={styles.version}>Msosi Fasta v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralLight },
  scroll: { paddingBottom: 100 },
  profileCard: { padding: Spacing.xl, alignItems: 'center', gap: 8, overflow: 'hidden', marginBottom: Spacing.md },
  decorCircle: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)' },
  avatarRow: { position: 'relative', marginBottom: 4 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: Colors.white },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.white },
  avatarText: { fontSize: 36, fontWeight: '900', color: Colors.white },
  editBtn: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.tertiary, alignItems: 'center', justifyContent: 'center' },
  profileName: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.white },
  profileEmail: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)' },
  phoneBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full },
  phoneTxt: { fontSize: FontSize.sm, color: Colors.white, fontWeight: '600' },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: Radius.full },
  roleTxt: { color: Colors.white, fontSize: FontSize.sm, fontWeight: '700' },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.white, marginHorizontal: Spacing.lg, borderRadius: Radius.xl, padding: Spacing.md, ...Shadow.md, marginBottom: Spacing.md },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.gray, textAlign: 'center', lineHeight: 14 },
  menuSection: { backgroundColor: Colors.white, marginHorizontal: Spacing.lg, borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.sm, marginBottom: Spacing.md },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.neutralLight },
  menuIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(194,82,11,0.08)', alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: FontSize.md, color: Colors.tertiary, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginHorizontal: Spacing.lg, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.error, ...Shadow.sm, marginBottom: Spacing.md },
  logoutTxt: { color: Colors.error, fontSize: FontSize.md, fontWeight: '700' },
  version: { textAlign: 'center', color: Colors.gray, fontSize: FontSize.xs },
});
