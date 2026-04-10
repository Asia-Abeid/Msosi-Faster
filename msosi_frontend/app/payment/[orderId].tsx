import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../../constants/colors';
import { paymentsApi, ordersApi } from '../../services/api';
import { useCart } from '../../store/CartContext';
import i18n from '../../constants/i18n';

type PaymentMethod = 'mpesa' | 'tigo_pesa' | 'airtel_money' | 'card';

export default function PaymentScreen() {
  const { orderId, total } = useLocalSearchParams<{ orderId: string, total: string }>();
  const router = useRouter();
  const { clearCart } = useCart();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('mpesa');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const finalOrderId = Number(orderId);
      const res = await paymentsApi.initiate(finalOrderId, selectedMethod);
      
      if (res.status === 201 || res.status === 200) {
        Alert.alert(
          i18n.t('payment.success'),
          `Tafadhali kamilisha malipo kupitia simu yako.\n\nAngalia ujumbe (STK Push) kutoka ${selectedMethod.toUpperCase()}.`,
          [{ text: 'OK', onPress: () => {
              clearCart();
              router.replace(`/order/${finalOrderId}`);
          }}]
        );
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      Alert.alert('Hitilafu / Error', 'Imeshindwa kuanzisha malipo. Jaribu tena baadae.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.tertiary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{i18n.t('payment.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Order Summary Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{i18n.t('cart.total')}</Text>
          <Text style={styles.summaryValue}>TSh {Number(total).toLocaleString()}</Text>
          <Text style={styles.summaryMeta}>{orderId === 'new' ? 'New Order' : `Order #${orderId}`}</Text>
        </View>

        <Text style={styles.sectionTitle}>{i18n.t('payment.method')}</Text>

        <PaymentOption 
          id="mpesa"
          name="M-Pesa"
          provider="Vodacom"
          selected={selectedMethod === 'mpesa'}
          onSelect={() => setSelectedMethod('mpesa')}
          icon="phone-portrait-outline"
          color="#E11A2B"
        />
        <PaymentOption 
          id="tigo_pesa"
          name="Tigo Pesa"
          provider="Tigo"
          selected={selectedMethod === 'tigo_pesa'}
          onSelect={() => setSelectedMethod('tigo_pesa')}
          icon="phone-portrait-outline"
          color="#00358e"
        />
        <PaymentOption 
          id="airtel_money"
          name="Airtel Money"
          provider="Airtel"
          selected={selectedMethod === 'airtel_money'}
          onSelect={() => setSelectedMethod('airtel_money')}
          icon="phone-portrait-outline"
          color="#FF0000"
        />
        <PaymentOption 
          id="card"
          name="Debit / Credit Card"
          provider="Visa / Mastercard"
          selected={selectedMethod === 'card'}
          onSelect={() => setSelectedMethod('card')}
          icon="card-outline"
          color="#444"
        />

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.gray} />
          <Text style={styles.infoText}>
            Ukurasa huu unatumia Selcom Secure Pay. Malipo yako ni salama 100%.
          </Text>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.payBtn}
          onPress={handlePayment}
          disabled={loading}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={Colors.primaryGradient}
            style={styles.payBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="lock-closed" size={18} color={Colors.white} />
                <Text style={styles.payBtnText}>{i18n.t('payment.pay')}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.secured}>{i18n.t('cart.secured')}</Text>
      </View>
    </SafeAreaView>
  );
}

function PaymentOption({ name, provider, selected, onSelect, icon, color }: any) {
  return (
    <TouchableOpacity 
      style={[styles.paymentOption, selected && styles.paymentOptionSelected]} 
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={[styles.methodIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.methodInfo}>
        <Text style={styles.methodName}>{name}</Text>
        <Text style={styles.methodProvider}>{provider}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutralLight },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, backgroundColor: Colors.white, ...Shadow.sm },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.tertiary },
  scrollContent: { padding: Spacing.lg },
  summaryCard: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: 25, alignItems: 'center', marginBottom: Spacing.xl, ...Shadow.md },
  summaryLabel: { fontSize: FontSize.sm, color: Colors.gray, marginBottom: 5 },
  summaryValue: { fontSize: 28, fontWeight: '900', color: Colors.primary },
  summaryMeta: { fontSize: 12, color: Colors.grayLight, marginTop: 5, fontWeight: '700' },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.tertiary, marginBottom: 15 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, padding: 15, borderRadius: Radius.lg, marginBottom: 10, ...Shadow.sm, borderWidth: 2, borderColor: 'transparent' },
  paymentOptionSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(194,82,11,0.02)' },
  methodIcon: { width: 50, height: 50, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  methodEmoji: { fontSize: 24 },
  methodInfo: { flex: 1 },
  methodName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.tertiary },
  methodProvider: { fontSize: FontSize.xs, color: Colors.gray },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.grayLight, justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: Colors.primary },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
  infoBox: { flexDirection: 'row', backgroundColor: 'rgba(196,60,0,0.05)', padding: 15, borderRadius: Radius.lg, marginTop: 15, borderLeftWidth: 4, borderLeftColor: Colors.tertiary },
  infoText: { flex: 1, fontSize: 12, color: Colors.tertiary, lineHeight: 18, marginLeft: 10 },
  footer: { padding: Spacing.lg, paddingBottom: 40, gap: 12 },
  payBtn: { borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.lg },
  payBtnGrad: { height: 60, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  payBtnText: { color: Colors.white, fontSize: 16, fontWeight: '800' },
  secured: { textAlign: 'center', fontSize: 11, color: Colors.gray, fontWeight: '600' },
});
