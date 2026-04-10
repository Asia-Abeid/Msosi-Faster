import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Switch, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../constants/colors';

import { useLanguage } from '../store/LanguageContext';
import i18n from '../constants/i18n';

export default function SettingsScreen() {
  const router = useRouter();
  const { locale, setLanguage } = useLanguage();
  const [notifsEnabled, setNotifsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const toggleLanguage = async () => {
    const nextLang = locale === 'sw' ? 'en' : 'sw';
    await setLanguage(nextLang);
  };

  const sections = [
    {
      title: i18n.t('settings.account'),
      items: [
        { icon: 'person-outline', label: i18n.t('settings.editProfile'), sub: i18n.t('settings.editProfileSub'), value: null },
        { icon: 'notifications-outline', label: i18n.t('settings.notifications'), sub: i18n.t('settings.notificationsSub'), value: notifsEnabled, toggle: setNotifsEnabled },
        { icon: 'location-outline', label: i18n.t('settings.location'), sub: i18n.t('settings.locationSub'), value: locationEnabled, toggle: setLocationEnabled },
      ]
    },
    {
      title: i18n.t('settings.language'),
      items: [
        { icon: 'globe-outline', label: i18n.t('settings.appLanguage'), sub: i18n.t('settings.appLanguageSub'), value: locale === 'sw', isLang: true },
      ]
    },
    {
      title: i18n.t('settings.support'),
      items: [
        { icon: 'shield-outline', label: i18n.t('settings.privacy'), sub: i18n.t('settings.privacySub'), value: null },
        { icon: 'lock-closed-outline', label: i18n.t('settings.password'), sub: i18n.t('settings.passwordSub'), value: null },
        { icon: 'trash-outline', label: i18n.t('settings.deleteAccount'), sub: i18n.t('settings.deleteAccountSub'), value: null, isDanger: true },
      ]
    }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.tertiary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{i18n.t('settings.title')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {sections.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionHeader}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item: any, i) => (
                <View key={i} style={[styles.itemRow, i === section.items.length - 1 && styles.noBorder]}>
                  <View style={styles.iconBox}>
                    <Ionicons name={item.icon as any} size={20} color={item.isDanger ? Colors.error : Colors.primary} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemLabel, item.isDanger && styles.dangerLabel]}>{item.label}</Text>
                    <Text style={styles.itemSub}>{item.sub}</Text>
                  </View>
                  
                  {item.toggle ? (
                    <Switch 
                      value={item.value || false} 
                       onValueChange={item.toggle}
                      trackColor={{ false: Colors.grayLight, true: Colors.primary + '50' }}
                      thumbColor={item.value ? Colors.primary : Colors.white}
                    />
                  ) : item.isLang ? (
                    <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
                      <Text style={styles.langTxt}>{locale === 'sw' ? 'Kiswahili' : 'English'}</Text>
                      <Ionicons name="swap-horizontal" size={14} color={Colors.primary} />
                    </TouchableOpacity>
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={Colors.grayLight} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.footer}>Msosi Fasta v1.0.0 (Build 20240331)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutralLight },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, backgroundColor: Colors.white, ...Shadow.sm },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.tertiary },
  scrollContent: { padding: Spacing.lg },
  section: { marginBottom: 25 },
  sectionHeader: { fontSize: 11, fontWeight: '900', color: Colors.gray, marginLeft: 5, marginBottom: 10, letterSpacing: 1 },
  sectionCard: { backgroundColor: Colors.white, borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: Colors.neutralLight },
  noBorder: { borderBottomWidth: 0 },
  iconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(194,82,11,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  itemInfo: { flex: 1 },
  itemLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.tertiary },
  dangerLabel: { color: Colors.error },
  itemSub: { fontSize: 11, color: Colors.gray, marginTop: 2 },
  langToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(194,82,11,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  langTxt: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  footer: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.gray, marginTop: 10, marginBottom: 40 },
});
