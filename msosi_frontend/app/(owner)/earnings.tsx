import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../../constants/colors';
import { paymentsApi } from '../../services/api';
import i18n from '../../constants/i18n';

export default function OwnerEarnings() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchEarnings = useCallback(async () => {
    try {
      const res = await paymentsApi.getEarnings();
      setData(res.data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEarnings(); }, [fetchEarnings]);

  const handleWithdraw = async () => {
    if (!withdrawAmount || Number(withdrawAmount) < 1000) {
      Alert.alert('Error', 'Minimum withdrawal is TSh 1,000');
      return;
    }
    setSubmitting(true);
    try {
      await paymentsApi.withdraw({ amount: Number(withdrawAmount), phone_number: '' });
      Alert.alert('Success', 'Withdrawal request submitted! Funds will be sent to your registered M-Pesa number.');
      setWithdrawModal(false);
      setWithdrawAmount('');
      fetchEarnings();
    } catch {
      Alert.alert('Error', 'Failed to submit withdrawal request');
    } finally { setSubmitting(false); }
  };

  if (!data && loading) return <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEarnings(); }} colors={[Colors.primary]} />} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{i18n.t('owner.earnings.title')}</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <Text style={styles.summaryLabel}>{i18n.t('owner.earnings.thisWeek')}</Text>
            <View style={styles.orderBadge}><Text style={styles.orderBadgeTxt}>{i18n.t('owner.earnings.ordersCount', { count: data?.order_count || 0 })}</Text></View>
          </View>
          <Text style={styles.summaryValue}>TSh {data?.available_balance?.toLocaleString() || '0'}</Text>
          <Text style={styles.summaryHint}>{i18n.t('owner.earnings.availableBalance')}</Text>
          <TouchableOpacity style={styles.withdrawMainBtn} onPress={() => setWithdrawModal(true)}>
            <Text style={styles.withdrawBtnTxt}>{i18n.t('owner.earnings.withdraw')}</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatBox label={i18n.t('owner.earnings.today')} value={`TSh ${data?.total_earned_today?.toLocaleString() || '0'}`} icon="calendar-outline" />
          <StatBox label={i18n.t('owner.earnings.pending')} value={`TSh ${data?.pending_earnings?.toLocaleString() || '0'}`} icon="hourglass-outline" />
        </View>

        <View style={styles.statsRow}>
          <StatBox label={i18n.t('owner.earnings.thisMonth')} value={`TSh ${data?.total_earned_this_month?.toLocaleString() || '0'}`} icon="receipt-outline" />
          <StatBox label={i18n.t('owner.earnings.inTransit')} value={`${data?.in_transit_count || 0}`} icon="bicycle-outline" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('owner.earnings.recentPayouts')}</Text>
          {data?.recent_payouts?.length > 0 ? data.recent_payouts.map((p: any) => (
            <View key={p.id} style={styles.payoutRow}>
              <View style={styles.payoutIconWrap}><Ionicons name="cash-outline" size={20} color={Colors.success} /></View>
              <View style={styles.payoutBody}>
                <Text style={styles.payoutCust}>{p.payment_method.toUpperCase()}</Text>
                <Text style={styles.payoutDate}>{new Date(p.created_at).toLocaleDateString()} at {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <Text style={styles.payoutAmt}>+ TSh {p.amount?.toLocaleString()}</Text>
            </View>
          )) : <View style={styles.empty}><Text style={styles.emptyTxt}>{i18n.t('owner.earnings.noPayouts')}</Text></View>}
        </View>
      </ScrollView>

      <Modal visible={withdrawModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
             <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{i18n.t('owner.earnings.withdraw')}</Text>
              <TouchableOpacity onPress={() => setWithdrawModal(false)}><Ionicons name="close" size={24} color={Colors.black} /></TouchableOpacity>
            </View>
            <View style={styles.form}>
              <Text style={styles.withdrawInfo}>{i18n.t('owner.earnings.withdrawalInfo')}</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>{i18n.t('owner.earnings.amount')}</Text>
                <TextInput style={styles.input} placeholder="10,000" keyboardType="numeric" value={withdrawAmount} onChangeText={setWithdrawAmount} />
              </View>
              <TouchableOpacity style={styles.submitBtn} onPress={handleWithdraw} disabled={submitting}>
                {submitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnTxt}>{i18n.t('owner.earnings.confirmWithdrawal')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatBox({ label, value, icon }: any) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={24} color={Colors.primary} style={{ marginBottom: 10 }} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutralLight },
  header: { padding: Spacing.lg, paddingBottom: 10 },
  title: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.tertiary },
  summaryCard: { margin: Spacing.lg, backgroundColor: '#C2520B', padding: Spacing.xl, borderRadius: Radius.xl, ...Shadow.lg },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  orderBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  orderBadgeTxt: { color: Colors.white, fontSize: 11, fontWeight: '800' },
  summaryValue: { fontSize: 32, fontWeight: '900', color: Colors.white },
  summaryHint: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', marginBottom: 24 },
  withdrawMainBtn: { backgroundColor: Colors.white, paddingVertical: 14, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  withdrawBtnTxt: { color: Colors.primary, fontWeight: '800', fontSize: FontSize.md },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.md, marginTop: Spacing.sm },
  statBox: { flex: 1, backgroundColor: Colors.white, padding: Spacing.lg, borderRadius: Radius.lg, ...Shadow.sm },
  statLabel: { fontSize: 11, color: Colors.gray, fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: FontSize.md, fontWeight: '800', color: Colors.black },
  section: { padding: Spacing.lg },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.black, marginBottom: 16 },
  payoutRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, padding: 14, borderRadius: Radius.lg, marginBottom: 10, ...Shadow.sm },
  payoutIconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center' },
  payoutBody: { flex: 1, marginLeft: 12 },
  payoutCust: { fontSize: FontSize.md, fontWeight: '700', color: Colors.black },
  payoutDate: { fontSize: 11, color: Colors.gray, marginTop: 2 },
  payoutAmt: { fontSize: FontSize.md, fontWeight: '800', color: Colors.success },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyTxt: { color: Colors.gray, fontSize: FontSize.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: Spacing.lg, paddingBottom: 60 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.black },
  form: { gap: 20 },
  withdrawInfo: { fontSize: 13, color: Colors.gray, lineHeight: 20 },
  inputWrap: { gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: Colors.gray },
  input: { backgroundColor: Colors.neutralLight, padding: 16, borderRadius: Radius.md, fontSize: FontSize.xl, fontWeight: '700', color: Colors.primary },
  submitBtn: { backgroundColor: Colors.primary, paddingVertical: 18, borderRadius: Radius.md, alignItems: 'center', marginTop: 10 },
  submitBtnTxt: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
});
