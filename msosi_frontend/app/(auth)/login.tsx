import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius } from '../../constants/colors';
import { useAuth } from '../../store/AuthContext';
import i18n from '../../constants/i18n';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) return;
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Invalid credentials');
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
        <Text style={styles.title}>{i18n.t('login.title')}</Text>
        <Text style={styles.subtitle}>{i18n.t('login.subtitle')}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{i18n.t('login.username')}</Text>
          <TextInput style={styles.input} placeholder={i18n.t('login.usernamePlaceholder')} value={username} onChangeText={setUsername} autoCapitalize="none" placeholderTextColor={Colors.grayLight} />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{i18n.t('login.password')}</Text>
          <View style={styles.passwordRow}>
            <TextInput style={styles.input} placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry={!showPass} placeholderTextColor={Colors.grayLight} />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.gray} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitText}>{i18n.t('common.signIn')}</Text>}
        </TouchableOpacity>
      </View>
      
      <View style={{ flex: 1 }} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral, paddingHorizontal: Spacing.lg, paddingTop: 60 },
  header: { marginBottom: 40 },
  backBtn: { marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '700', color: Colors.black, letterSpacing: -0.5 },
  subtitle: { fontSize: FontSize.md, color: Colors.gray, marginTop: 8 },
  form: { gap: 24 },
  inputContainer: { gap: 8 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.gray, letterSpacing: 1 },
  input: { fontSize: FontSize.md, color: Colors.black, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.grayLight },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.grayLight },
  eyeBtn: { position: 'absolute', right: 0, padding: 8 },
  submitBtn: { backgroundColor: Colors.primary, paddingVertical: 18, borderRadius: Radius.sm, alignItems: 'center', marginTop: 16 },
  submitText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700', letterSpacing: 1 },
});
