import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, StatusBar, Dimensions, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

const { height } = Dimensions.get('window');

interface RoleCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  features: string[];
  accentColor: string;
  bgColor: string;
  onPress: () => void;
  anim: Animated.Value;
}

function RoleCard({ icon, title, description, features, accentColor, bgColor, onPress, anim }: RoleCardProps) {
  return (
    <Animated.View style={{ transform: [{ scale: anim }] }}>
      <TouchableOpacity style={[styles.card, { borderColor: accentColor + '30' }]} onPress={onPress} activeOpacity={0.88}>
        <View style={[styles.cardIconWrap, { backgroundColor: bgColor }]}>
          <Ionicons name={icon} size={30} color={accentColor} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDesc}>{description}</Text>
          <View style={styles.featureList}>
            {features.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={14} color={accentColor} />
                <Text style={styles.featureTxt}>{f}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={[styles.cardArrow, { backgroundColor: accentColor }]}>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RoleSelectScreen() {
  const router = useRouter();
  const customerAnim = useRef(new Animated.Value(1)).current;
  const ownerAnim = useRef(new Animated.Value(1)).current;

  const press = (anim: Animated.Value, route: string) => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 0.96, duration: 90, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 90, useNativeDriver: true }),
    ]).start(() => router.push(route as any));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F6" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.headerBadge}>
          <LinearGradient colors={['#FF6D00', '#C43C00']} style={styles.headerBadgeGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.headerBadgeText}>🍽️ MSOSI FASTA</Text>
          </LinearGradient>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Unaingia kama nani?</Text>
        <Text style={styles.subtitle}>Chagua aina yako ya akaunti ili tuendelee</Text>

        <View style={styles.cards}>
          <RoleCard
            anim={customerAnim}
            icon="fast-food-outline"
            title="Mteja"
            description="Agiza chakula kutoka mikahawa mbalimbali karibu nawe."
            features={['Agiza chakula haraka', 'Fuatilia oda yako', 'Malipo salama']}
            accentColor={Colors.primary}
            bgColor="rgba(196,60,0,0.08)"
            onPress={() => press(customerAnim, '/(auth)/register?role=customer')}
          />

          <RoleCard
            anim={ownerAnim}
            icon="restaurant-outline"
            title="Mmiliki wa Mkahawa"
            description="Simamia mkahawa wako, menyu, na mapato yako."
            features={['Ongeza menyu yako', 'Simamiwa oda', 'Angalia mapato']}
            accentColor={Colors.secondary}
            bgColor="rgba(255,109,0,0.08)"
            onPress={() => press(ownerAnim, '/(auth)/register?role=owner')}
          />
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.footerLink}>
          <Text style={styles.footerTxt}>
            Una akaunti tayari?{'  '}
            <Text style={styles.footerBold}>Ingia Sasa</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  headerBadge: { borderRadius: Radius.full, overflow: 'hidden' },
  headerBadgeGrad: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full },
  headerBadgeText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '800', letterSpacing: 0.5 },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 50 },
  title: { fontSize: 30, fontWeight: '900', color: '#1A1A1A', marginBottom: 8, marginTop: Spacing.md },
  subtitle: { fontSize: FontSize.md, color: '#777', lineHeight: 22, marginBottom: Spacing.xl },
  cards: { gap: Spacing.md },
  card: {
    backgroundColor: '#fff', borderRadius: 20,
    padding: Spacing.lg, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    borderWidth: 1.5,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 14, elevation: 3,
  },
  cardIconWrap: {
    width: 58, height: 58, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { fontSize: FontSize.lg, fontWeight: '800', color: '#1A1A1A' },
  cardDesc: { fontSize: FontSize.sm, color: '#777', lineHeight: 20, marginBottom: 6 },
  featureList: { gap: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureTxt: { fontSize: FontSize.xs, color: '#555', fontWeight: '500' },
  cardArrow: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
  footerLink: { alignItems: 'center', marginTop: Spacing.xl, paddingVertical: Spacing.sm },
  footerTxt: { fontSize: FontSize.md, color: '#888' },
  footerBold: { color: Colors.primary, fontWeight: '800' },
});
