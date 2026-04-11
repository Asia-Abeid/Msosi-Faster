import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Alert, StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, Spacing, Radius } from '../../constants/colors';
import { useAuth } from '../../store/AuthContext';
import i18n from '../../constants/i18n';

function InputField({ label, icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, rightElement }: any) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <View style={styles.inputIconWrap}>
          <Ionicons name={icon} size={18} color={Colors.primary} />
        </View>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#BABABA"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'none'}
        />
        {rightElement}
      </View>
    </View>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: string }>();
  const { register, login } = useAuth();

  const isOwner = role === 'owner';
  const [form, setForm] = useState({
    username: '', email: '', phone_number: '', password: '', confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.username || !form.email || !form.phone_number || !form.password) {
      Alert.alert('Hitilafu', 'Tafadhali jaza sehemu zote.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Hitilafu', 'Nywila hazifanani. Tafadhali angalia tena.');
      return;
    }
    if (form.password.length < 8) {
      Alert.alert('Hitilafu', 'Nywila lazima iwe na angalau herufi 8.');
      return;
    }
    setLoading(true);
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.startsWith('0') ? '255' + form.phone_number.slice(1) : form.phone_number,
        password: form.password,
        is_customer: !isOwner,
        is_restaurant_owner: isOwner,
      });
      await login(form.username.trim(), form.password);
    } catch (e: any) {
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : `Hitilafu ya mtandao: ${e.message}`;
      Alert.alert('Hitilafu', msg);
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

      {/* Top gradient hero */}
      <LinearGradient
        colors={isOwner ? ['#FF6D00', '#C43C00'] : ['#FF6D00', '#C43C00']}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroDecor} />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.heroContent}>
          <View style={styles.roleBadge}>
            <Ionicons name={isOwner ? 'restaurant-outline' : 'fast-food-outline'} size={14} color="#fff" />
            <Text style={styles.roleBadgeTxt}>{isOwner ? 'Mmiliki wa Mkahawa' : 'Mteja'}</Text>
          </View>
          <Text style={styles.heroTitle}>{i18n.t('register.title')}</Text>
          <Text style={styles.heroSubtitle}>Unda akaunti yako bure leo</Text>
        </View>
      </LinearGradient>

      {/* Form */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Maelezo yako</Text>

          <View style={styles.fields}>
            <InputField
              label="Jina la Mtumiaji"
              icon="person-outline"
              placeholder="johndoe"
              value={form.username}
              onChangeText={update('username')}
              autoCapitalize="none"
            />
            <InputField
              label="Barua Pepe"
              icon="mail-outline"
              placeholder="john@example.com"
              value={form.email}
              onChangeText={update('email')}
              keyboardType="email-address"
            />
            <InputField
              label="Nambari ya Simu"
              icon="call-outline"
              placeholder="0712 345 678"
              value={form.phone_number}
              onChangeText={update('phone_number')}
              keyboardType="phone-pad"
            />
            <InputField
              label="Nywila"
              icon="lock-closed-outline"
              placeholder="Angalau herufi 8"
              value={form.password}
              onChangeText={update('password')}
              secureTextEntry={!showPass}
              rightElement={
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#AAA" />
                </TouchableOpacity>
              }
            />
            <InputField
              label="Thibitisha Nywila"
              icon="shield-checkmark-outline"
              placeholder="Rudia nywila yako"
              value={form.confirmPassword}
              onChangeText={update('confirmPassword')}
              secureTextEntry={!showConfirm}
              rightElement={
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color="#AAA" />
                </TouchableOpacity>
              }
            />
          </View>

          <TouchableOpacity
            onPress={handleRegister}
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
                    <Text style={styles.submitTxt}>Jisajili</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.loginLink}>
            <Text style={styles.loginTxt}>
              Una akaunti tayari?{'  '}
              <Text style={styles.loginBold}>Ingia</Text>
            </Text>
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
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  heroContent: { gap: 6 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: Radius.full, marginBottom: 6,
  },
  roleBadgeTxt: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: '#fff' },
  heroSubtitle: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.82)' },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 60 },
  formCard: {
    backgroundColor: '#fff', borderRadius: 24,
    padding: Spacing.xl, marginTop: -28,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, elevation: 6,
  },
  formTitle: { fontSize: FontSize.xl, fontWeight: '900', color: '#1A1A1A', marginBottom: Spacing.lg },
  fields: { gap: Spacing.md },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#555', letterSpacing: 0.5 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F6F6F6', borderRadius: 14,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderWidth: 1.5, borderColor: '#EFEFEF',
  },
  inputIconWrap: { marginRight: 10 },
  input: {
    flex: 1, fontSize: FontSize.md, color: '#1A1A1A',
    paddingVertical: 13,
  },
  eyeBtn: { padding: 6 },
  submitWrap: { borderRadius: 14, overflow: 'hidden', marginTop: Spacing.xl },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 17, gap: 10,
  },
  submitTxt: { color: '#fff', fontSize: FontSize.md, fontWeight: '800', letterSpacing: 0.5 },
  loginLink: { alignItems: 'center', marginTop: Spacing.lg, paddingVertical: 4 },
  loginTxt: { fontSize: FontSize.md, color: '#888' },
  loginBold: { color: Colors.primary, fontWeight: '800' },
});
