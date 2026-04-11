import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  StatusBar, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, Spacing } from '../../constants/colors';
import { authApi } from '../../services/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert('Hitilafu', 'Tafadhali weka barua pepe yako.');
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      Alert.alert(
        'Msimbo Umetumwa! ✅',
        'Angalia terminal ya seva kwa msimbo wa wakati huu (maandishi ya maendeleo).\n\nKatika mazingira ya uzalishaji, msimbo utakuja kwa barua pepe yako.',
        [
          {
            text: 'Weka Msimbo',
            onPress: () =>
              router.push({ pathname: '/(auth)/reset-password', params: { email: email.trim().toLowerCase() } }),
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Hitilafu', e?.response?.data?.detail || 'Imeshindwa kutuma msimbo. Jaribu tena.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Hero */}
      <LinearGradient
        colors={['#FF6D00', '#C43C00']}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroDecor} />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.heroIconWrap}>
          <Ionicons name="lock-open-outline" size={36} color="#fff" />
        </View>
        <Text style={styles.heroTitle}>Umesahau Nywila?</Text>
        <Text style={styles.heroSubtitle}>
          Hakuna wasiwasi! Tutakutumia msimbo wa kurejesha nywila yako.
        </Text>
      </LinearGradient>

      {/* Form Card */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Weka Barua Pepe</Text>
          <Text style={styles.formSubtitle}>
            Tutakutumia msimbo wa nambari 6 kurejesha nywila yako.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Barua Pepe</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={Colors.primary} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="john@example.com"
                placeholderTextColor="#BABABA"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSend}
            disabled={loading}
            activeOpacity={0.85}
            style={styles.submitWrap}
          >
            <LinearGradient
              colors={['#FF6D00', '#C43C00']}
              style={styles.submitBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Text style={styles.submitTxt}>Tuma Msimbo</Text>
                    <Ionicons name="send-outline" size={18} color="#fff" />
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>

          {/* Info box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.infoTxt}>
              Kwa sasa, msimbo unaonekana kwenye terminal ya seva (hali ya maendeleo).
              Katika uzalishaji, utakuja kwa barua pepe yako.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back-outline" size={16} color={Colors.primary} />
            <Text style={styles.backLinkTxt}>Rudi Kuingia</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6' },
  hero: {
    paddingTop: 56, paddingHorizontal: Spacing.lg,
    paddingBottom: 56, overflow: 'hidden',
  },
  heroDecor: {
    position: 'absolute', top: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  heroIconWrap: {
    width: 70, height: 70, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  heroTitle: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 8 },
  heroSubtitle: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.85)', lineHeight: 22 },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 60 },
  formCard: {
    backgroundColor: '#fff', borderRadius: 24,
    padding: Spacing.xl, marginTop: -28,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, elevation: 6,
  },
  formTitle: { fontSize: FontSize.xl, fontWeight: '900', color: '#1A1A1A', marginBottom: 4 },
  formSubtitle: { fontSize: FontSize.sm, color: '#888', lineHeight: 20, marginBottom: Spacing.xl },
  inputGroup: { gap: 8, marginBottom: Spacing.md },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#555', letterSpacing: 0.5 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F6F6F6', borderRadius: 14,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderWidth: 1.5, borderColor: '#EFEFEF',
  },
  input: { flex: 1, fontSize: FontSize.md, color: '#1A1A1A', paddingVertical: 13 },
  submitWrap: { borderRadius: 14, overflow: 'hidden', marginBottom: Spacing.lg },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 17, gap: 10,
  },
  submitTxt: { color: '#fff', fontSize: FontSize.md, fontWeight: '800', letterSpacing: 0.5 },
  infoBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: 'rgba(196,60,0,0.06)', borderRadius: 12,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  infoTxt: { flex: 1, fontSize: FontSize.xs, color: '#666', lineHeight: 18 },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  backLinkTxt: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
});
