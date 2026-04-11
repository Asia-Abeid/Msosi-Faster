import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  StatusBar, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, Spacing } from '../../constants/colors';
import { authApi } from '../../services/api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef<TextInput[]>([]);

  const handleOtpChange = (val: string, index: number) => {
    if (val.length > 1) val = val[val.length - 1];
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (!val && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleReset = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      Alert.alert('Hitilafu', 'Tafadhali weka msimbo kamili wa nambari 6.');
      return;
    }
    if (!newPassword || !confirmPassword) {
      Alert.alert('Hitilafu', 'Tafadhali weka nywila mpya.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Hitilafu', 'Nywila hazifanani. Jaribu tena.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Hitilafu', 'Nywila lazima iwe na angalau herufi 8.');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({
        email: email || '',
        otp: otpCode,
        new_password: newPassword,
      });
      Alert.alert(
        'Nywila Imebadilishwa! ✅',
        'Nywila yako imebadilishwa kwa mafanikio. Tafadhali ingia na nywila yako mpya.',
        [{ text: 'Ingia', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (e: any) {
      Alert.alert('Hitilafu', e?.response?.data?.detail || 'Msimbo si sahihi au umepita muda wake. Jaribu tena.');
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
          <Ionicons name="shield-checkmark-outline" size={36} color="#fff" />
        </View>
        <Text style={styles.heroTitle}>Weka Nywila Mpya</Text>
        <Text style={styles.heroSubtitle}>
          Weka msimbo uliotumwa na nywila yako mpya hapa chini.
        </Text>
        {email ? (
          <View style={styles.emailBadge}>
            <Ionicons name="mail-outline" size={12} color="#fff" />
            <Text style={styles.emailBadgeTxt}>{email}</Text>
          </View>
        ) : null}
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>

          {/* OTP Section */}
          <Text style={styles.sectionTitle}>Msimbo wa Uthibitisho</Text>
          <Text style={styles.sectionDesc}>Weka nambari 6 ulizopokea</Text>
          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => { if (ref) inputRefs.current[i] = ref; }}
                style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                value={digit}
                onChangeText={(val) => handleOtpChange(val, i)}
                keyboardType="numeric"
                maxLength={2}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          {/* New Password */}
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Nywila Mpya</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nywila Mpya</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.primary} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="Angalau herufi 8"
                placeholderTextColor="#BABABA"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNew}
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
                <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={18} color="#AAA" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Thibitisha Nywila</Text>
            <View style={styles.inputRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="Rudia nywila mpya"
                placeholderTextColor="#BABABA"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color="#AAA" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Strength tip */}
          {newPassword.length > 0 && (
            <View style={[styles.strengthBar, { marginBottom: Spacing.md }]}>
              <View style={[
                styles.strengthFill,
                {
                  width: `${Math.min(100, (newPassword.length / 12) * 100)}%`,
                  backgroundColor: newPassword.length < 8 ? '#EF4444' : newPassword.length < 10 ? '#F59E0B' : '#10B981',
                }
              ]} />
            </View>
          )}

          <TouchableOpacity
            onPress={handleReset}
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
                    <Text style={styles.submitTxt}>Badilisha Nywila</Text>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  </>
              }
            </LinearGradient>
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
    paddingBottom: 50, overflow: 'hidden',
  },
  heroDecor: {
    position: 'absolute', top: -50, right: -50,
    width: 180, height: 180, borderRadius: 90,
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
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 6 },
  heroSubtitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
  emailBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
  },
  emailBadgeTxt: { fontSize: FontSize.xs, color: '#fff', fontWeight: '600' },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 60 },
  formCard: {
    backgroundColor: '#fff', borderRadius: 24,
    padding: Spacing.xl, marginTop: -28,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, elevation: 6,
  },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  sectionDesc: { fontSize: FontSize.sm, color: '#888', marginBottom: Spacing.md },
  otpRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    gap: 8, marginBottom: Spacing.lg,
  },
  otpBox: {
    flex: 1, height: 56, borderRadius: 12,
    backgroundColor: '#F6F6F6', borderWidth: 2, borderColor: '#EFEFEF',
    fontSize: 22, fontWeight: '900', color: '#1A1A1A',
    textAlign: 'center',
  },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: 'rgba(196,60,0,0.05)' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: Spacing.md },
  inputGroup: { gap: 8, marginBottom: Spacing.md },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#555', letterSpacing: 0.5 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F6F6F6', borderRadius: 14,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderWidth: 1.5, borderColor: '#EFEFEF',
  },
  input: { flex: 1, fontSize: FontSize.md, color: '#1A1A1A', paddingVertical: 13 },
  eyeBtn: { padding: 6 },
  strengthBar: {
    height: 4, backgroundColor: '#F0F0F0', borderRadius: 2, overflow: 'hidden',
  },
  strengthFill: { height: '100%', borderRadius: 2 },
  submitWrap: { borderRadius: 14, overflow: 'hidden', marginTop: Spacing.sm },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 17, gap: 10,
  },
  submitTxt: { color: '#fff', fontSize: FontSize.md, fontWeight: '800', letterSpacing: 0.5 },
});
