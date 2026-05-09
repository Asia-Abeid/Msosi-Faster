import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  StatusBar, ScrollView, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, Spacing, Radius } from '../../constants/colors';
import { useAuth } from '../../store/AuthContext';
import i18n from '../../constants/i18n';

const { height } = Dimensions.get('window');

function InputField({
  label, icon, placeholder, value, onChangeText,
  secureTextEntry, keyboardType, autoCapitalize, rightElement,
}: any) {
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

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert(i18n.t('payment.errorTitle'), i18n.t('login.errorAllFields'));
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (e: any) {
      Alert.alert(i18n.t('payment.errorTitle'), e?.response?.data?.detail || 'Nywila au jina la mtumiaji si sahihi.');
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
        colors={['#FF6D00', '#C43C00']}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroDecor} />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>{i18n.t('login.welcomeBack')}</Text>
          <Text style={styles.heroSubtitle}>{i18n.t('login.subtitle')}</Text>
        </View>
      </LinearGradient>

      {/* Form card */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{i18n.t('login.formTitle')}</Text>
          <Text style={styles.formSubtitle}>{i18n.t('login.formSubtitle')}</Text>

          <View style={styles.fields}>
            <InputField
              label={i18n.t('login.usernameLabel')}
              icon="person-outline"
              placeholder="johndoe"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <InputField
              label={i18n.t('login.passwordLabel')}
              icon="lock-closed-outline"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              rightElement={
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#AAA" />
                </TouchableOpacity>
              }
            />
          </View>

          {/* Forgot password */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotBtn}
          >
            <Text style={styles.forgotTxt}>{i18n.t('login.forgotPassword')}</Text>
          </TouchableOpacity>

          {/* Login button */}
          <TouchableOpacity
            onPress={handleLogin}
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
                    <Text style={styles.submitTxt}>{i18n.t('login.loginBtn')}</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>

          {/* Register link */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/role-select')}
            style={styles.registerLink}
          >
            <Text style={styles.registerTxt}>
              {i18n.t('login.noAccount')}{'  '}
              <Text style={styles.registerBold}>{i18n.t('login.joinFree')}</Text>
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
    position: 'absolute', top: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl,
  },
  heroContent: { gap: 6 },
  heroTitle: { fontSize: 30, fontWeight: '900', color: '#fff' },
  heroSubtitle: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.82)' },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 60 },
  formCard: {
    backgroundColor: '#fff', borderRadius: 24,
    padding: Spacing.xl, marginTop: -28,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, elevation: 6,
  },
  formTitle: { fontSize: FontSize.xl, fontWeight: '900', color: '#1A1A1A', marginBottom: 4 },
  formSubtitle: { fontSize: FontSize.sm, color: '#888', marginBottom: Spacing.xl },
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
  forgotBtn: { alignSelf: 'flex-end', marginTop: Spacing.sm, marginBottom: Spacing.md },
  forgotTxt: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '700' },
  submitWrap: { borderRadius: 14, overflow: 'hidden', marginTop: Spacing.sm },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 17, gap: 10,
  },
  submitTxt: { color: '#fff', fontSize: FontSize.md, fontWeight: '800', letterSpacing: 0.5 },
  registerLink: { alignItems: 'center', marginTop: Spacing.lg, paddingVertical: 4 },
  registerTxt: { fontSize: FontSize.md, color: '#888' },
  registerBold: { color: Colors.primary, fontWeight: '800' },
});
