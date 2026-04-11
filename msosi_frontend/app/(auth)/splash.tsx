import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions,
  TouchableOpacity, Image, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, Spacing, Radius } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const footerAnim = useRef(new Animated.Value(80)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
      ]),
      Animated.spring(footerAnim, { toValue: 0, tension: 80, friction: 14, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background gradient */}
      <LinearGradient
        colors={['#FF6D00', '#C43C00', '#8B2500']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />

      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      {/* Hero content */}
      <Animated.View
        style={[styles.heroSection, {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        }]}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/splash-icon.png')}
            style={styles.logo}
          />
        </View>

        <Text style={styles.appName}>MSOSI FASTA</Text>
        <Text style={styles.tagline}>Msosi unaotaka, haraka iwezekanavyo 🍽️</Text>

        {/* Feature chips */}
        <View style={styles.chips}>
          {['Oda Haraka', 'Chakula Bora', 'Malipo Salama'].map((chip) => (
            <View key={chip} style={styles.chip}>
              <Ionicons name="checkmark-circle" size={13} color="rgba(255,255,255,0.9)" />
              <Text style={styles.chipText}>{chip}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Footer buttons */}
      <Animated.View style={[styles.footer, { transform: [{ translateY: footerAnim }], opacity: fadeAnim }]}>
        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Anza Safari Yako</Text>
          <Text style={styles.footerSubtitle}>Jiunge leo au ingia akaunti yako</Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/(auth)/role-select')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#FF6D00', '#C43C00']}
              style={styles.primaryBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryBtnText}>Anza Sasa</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>
              Nina Akaunti · <Text style={{ color: Colors.primary, fontWeight: '800' }}>Ingia</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  circle1: {
    position: 'absolute', top: -80, right: -80,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  circle2: {
    position: 'absolute', top: height * 0.25, left: -120,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroSection: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 60, paddingHorizontal: Spacing.xl,
  },
  logoContainer: {
    width: 120, height: 120, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  logo: { width: 90, height: 90, resizeMode: 'contain' },
  appName: {
    fontSize: 36, fontWeight: '900', color: '#fff',
    letterSpacing: 4, marginBottom: 10,
  },
  tagline: {
    fontSize: FontSize.md, color: 'rgba(255,255,255,0.82)',
    textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl,
  },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full,
  },
  chipText: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  footer: { paddingHorizontal: Spacing.md, paddingBottom: 40 },
  footerCard: {
    backgroundColor: '#fff', borderRadius: 28,
    padding: Spacing.xl,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 30, shadowOffset: { width: 0, height: -8 },
    elevation: 16,
  },
  footerTitle: { fontSize: FontSize.xl, fontWeight: '900', color: '#1A1A1A', marginBottom: 4 },
  footerSubtitle: { fontSize: FontSize.sm, color: '#888', marginBottom: Spacing.xl },
  primaryBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: Spacing.md },
  primaryBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 17, gap: 10,
  },
  primaryBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '800', letterSpacing: 0.5 },
  secondaryBtn: { alignItems: 'center', paddingVertical: 10 },
  secondaryBtnText: { fontSize: FontSize.md, color: '#777', fontWeight: '500' },
});
