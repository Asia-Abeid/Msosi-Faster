import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius } from '../../constants/colors';
import { useAuth } from '../../store/AuthContext';
import i18n from '../../constants/i18n';

export default function RegisterScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: string }>();
  const { register, login } = useAuth();
  
  const isOwner = role === 'owner';
  const [form, setForm] = useState({ username: '', email: '', phone_number: '', password: '' });
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.username || !form.email || !form.phone_number || !form.password) return;
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
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : `Network Error: ${e.message}`;
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.title}>{i18n.t('register.title')}</Text>
        <Text style={styles.subtitle}>{isOwner ? i18n.t('register.owner') : i18n.t('register.customer')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.form}>
          <InputGroup label={i18n.t('register.username')} placeholder="johndoe" value={form.username} onChange={update('username')} autoCapitalize="none" />
          <InputGroup label={i18n.t('register.email')} placeholder="john@example.com" value={form.email} onChange={update('email')} keyboardType="email-address" />
          <InputGroup label={i18n.t('register.phone')} placeholder="0712345678" value={form.phone_number} onChange={update('phone_number')} keyboardType="phone-pad" />
          <InputGroup label={i18n.t('register.password')} placeholder="••••••••" value={form.password} onChange={update('password')} secureTextEntry />

          <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitText}>{i18n.t('common.signUp')}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InputGroup({ label, placeholder, value, onChange, ...props }: any) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholder={placeholder} value={value} onChangeText={onChange} placeholderTextColor={Colors.grayLight} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral, paddingTop: 60 },
  header: { paddingHorizontal: Spacing.lg, marginBottom: 20 },
  backBtn: { marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '700', color: Colors.black, letterSpacing: -0.5 },
  subtitle: { fontSize: FontSize.md, color: Colors.primary, marginTop: 4, fontWeight: '600' },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 60 },
  form: { gap: 24, marginTop: 10 },
  inputContainer: { gap: 8 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.gray, letterSpacing: 1 },
  input: { fontSize: FontSize.md, color: Colors.black, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.grayLight },
  submitBtn: { backgroundColor: Colors.primary, paddingVertical: 18, borderRadius: Radius.sm, alignItems: 'center', marginTop: 16 },
  submitText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700', letterSpacing: 1 },
});
