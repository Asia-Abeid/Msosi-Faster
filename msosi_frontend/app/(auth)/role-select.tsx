import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius } from '../../constants/colors';
import i18n from '../../constants/i18n';

export default function RoleSelectScreen() {
  const router = useRouter();
  const customerAnim = useRef(new Animated.Value(1)).current;
  const ownerAnim = useRef(new Animated.Value(1)).current;

  const press = (anim: Animated.Value, route: string) => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(() => router.push(route as any));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{i18n.t('roleSelect.title')}</Text>
        <Text style={styles.subtitle}>{i18n.t('roleSelect.subtitle')}</Text>
      </View>

      <View style={styles.cardsRow}>
        <Animated.View style={{ transform: [{ scale: customerAnim }], flex: 1 }}>
          <TouchableOpacity style={styles.card} onPress={() => press(customerAnim, '/(auth)/register?role=customer')} activeOpacity={0.9}>
            <View style={styles.cardHeader}>
              <View style={styles.iconWrapper}>
                <Ionicons name="fast-food-outline" size={24} color={Colors.primary} />
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.grayLight} />
            </View>
            <View>
              <Text style={styles.cardTitle}>{i18n.t('roleSelect.customer.title')}</Text>
              <Text style={styles.cardDesc}>{i18n.t('roleSelect.customer.desc')}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: ownerAnim }], flex: 1 }}>
          <TouchableOpacity style={styles.card} onPress={() => press(ownerAnim, '/(auth)/register?role=owner')} activeOpacity={0.9}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255,109,0,0.1)' }]}>
                <Ionicons name="restaurant-outline" size={24} color={Colors.secondary} />
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.grayLight} />
            </View>
            <View>
              <Text style={styles.cardTitle}>{i18n.t('roleSelect.owner.title')}</Text>
              <Text style={styles.cardDesc}>{i18n.t('roleSelect.owner.desc')}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.footerLink}>
        <Text style={styles.loginLink}>{i18n.t('roleSelect.alreadyHaveAccount')} <Text style={styles.loginLinkBold}>{i18n.t('common.signIn')}</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral, paddingHorizontal: Spacing.lg, paddingTop: 100, paddingBottom: 50 },
  header: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '700', color: Colors.black, letterSpacing: -0.5 },
  subtitle: { fontSize: FontSize.md, color: Colors.gray, marginTop: 8 },
  cardsRow: { flex: 1, gap: Spacing.lg, justifyContent: 'center' },
  card: { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.neutralLight, justifyContent: 'space-between', minHeight: 180, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  iconWrapper: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(196,60,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.black, marginBottom: 6 },
  cardDesc: { fontSize: FontSize.sm, color: Colors.gray, lineHeight: 20 },
  footerLink: { alignItems: 'center', marginTop: 20 },
  loginLink: { color: Colors.gray, fontSize: FontSize.md },
  loginLinkBold: { color: Colors.black, fontWeight: '700' },
});
