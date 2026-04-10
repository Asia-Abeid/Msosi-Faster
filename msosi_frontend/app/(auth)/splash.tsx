import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, Spacing, Radius } from '../../constants/colors';
import i18n from '../../constants/i18n';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={Colors.primaryGradient}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center' }}>
          <View style={styles.logoWrapper}>
            <Image source={require('../../assets/splash-icon.png')} style={styles.logo} />
          </View>
          <Text style={styles.appName}>MSOSI FASTA</Text>
          <Text style={styles.tagline}>{i18n.t('splash.tagline')}</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(auth)/role-select')} activeOpacity={0.8}>
          <Text style={styles.primaryButtonText}>{i18n.t('common.getStarted')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/(auth)/login')} activeOpacity={0.8}>
          <Text style={styles.secondaryButtonText}>{i18n.t('common.signIn')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrapper: { marginBottom: Spacing.xxl + 10 },
  logo: { width: 140, height: 140, resizeMode: 'contain' },
  appName: { fontSize: 32, fontWeight: '800', color: Colors.white, letterSpacing: 2 },
  tagline: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.8)', marginTop: 8, letterSpacing: 0.5 },
  footer: { paddingHorizontal: Spacing.lg, paddingBottom: 60, width: '100%', gap: Spacing.md },
  primaryButton: { backgroundColor: Colors.white, paddingVertical: 18, borderRadius: Radius.sm, alignItems: 'center' },
  primaryButtonText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700', letterSpacing: 1 },
  secondaryButton: { backgroundColor: 'transparent', paddingVertical: 18, borderRadius: Radius.sm, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  secondaryButtonText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700', letterSpacing: 1 },
});
