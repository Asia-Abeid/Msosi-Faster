import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../../constants/colors';
import { ordersApi } from '../../services/api';

const STEP_ICONS: Record<string, string> = {
  pending:    'time-outline',
  confirmed:  'checkmark-circle-outline',
  preparing:  'restaurant-outline',
  on_the_way: 'bicycle-outline',
  delivered:  'home-outline',
};

const STEP_LABELS: Record<string, string> = {
  pending:    'Agizo limepokelewa / Order Received',
  confirmed:  'Imethibitishwa / Confirmed',
  preparing:  'Inatayarishwa / Preparing',
  on_the_way: 'Ipo njiani / On the Way',
  delivered:  'Imefikia / Delivered',
};

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await ordersApi.detail(Number(id));
        setOrder(res.data);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
    
    // Poll for updates every 15 seconds
    const interval = setInterval(fetchOrder, 15000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const currentStatus = order?.status;
  const steps = ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered'];
  const currentStepIndex = steps.indexOf(currentStatus);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)/orders')}>
          <Ionicons name="arrow-back" size={24} color={Colors.tertiary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fuatilia Agizo / Track Order</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Order Status Header */}
        <LinearGradient 
          colors={Colors.primaryGradient} 
          style={styles.statusHeader}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Text style={styles.orderId}>AGIZO / ORDER #{order?.id}</Text>
          <Text style={styles.statusLabel}>{STEP_LABELS[currentStatus]?.split(' / ')[0]}</Text>
          <Text style={styles.statusLabelEn}>{STEP_LABELS[currentStatus]?.split(' / ')[1]}</Text>
          <View style={styles.headerIcon}>
            <Ionicons name={STEP_ICONS[currentStatus] as any} size={60} color={Colors.white} />
          </View>
        </LinearGradient>

        {/* Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.sectionTitle}>Maendeleo ya Agizo</Text>
          {steps.map((step, index) => (
            <TimelineStep 
              key={step}
              label={STEP_LABELS[step]}
              icon={STEP_ICONS[step]}
              isLast={index === steps.length - 1}
              isCompleted={index <= currentStepIndex}
              isActive={index === currentStepIndex}
            />
          ))}
        </View>

        {/* Order Details Summary */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Maelezo ya Agizo</Text>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={18} color={Colors.gray} />
            <Text style={styles.detailText}>{order?.delivery_address}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="wallet-outline" size={18} color={Colors.gray} />
            <Text style={styles.detailText}>Malipo: Selcom Pay (TSh {Number(order?.total_price).toLocaleString()})</Text>
          </View>
          
          <View style={styles.divider} />
          
          {order?.items?.map((item: any, i: number) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.quantity}x</Text>
              <Text style={styles.itemName}>{item.menu_item_name || 'Chakula'}</Text>
              <Text style={styles.itemPrice}>TSh {Number(item.price).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.helpBtn}
          onPress={() => { /* Open Support Chat */ }}
        >
          <Text style={styles.helpBtnText}>Unahitaji Msaada? / Need Help?</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function TimelineStep({ label, icon, isLast, isCompleted, isActive }: any) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.indicatorCol}>
        <View style={[
          styles.stepCircle, 
          isCompleted && styles.stepCircleCompleted,
          isActive && styles.stepCircleActive
        ]}>
          <Ionicons name={icon} size={18} color={isCompleted ? Colors.white : Colors.gray} />
        </View>
        {!isLast && <View style={[styles.stepLine, isCompleted && styles.stepLineCompleted]} />}
      </View>
      <View style={styles.labelCol}>
        <Text style={[styles.stepLabelText, isCompleted && styles.stepLabelTextActive]}>{label}</Text>
        {isActive && <Text style={styles.activeTag}>SASA HIVI / CURRENTLY</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutralLight },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, backgroundColor: Colors.white, ...Shadow.sm },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.tertiary },
  scrollContent: { padding: Spacing.lg },
  statusHeader: { padding: 30, borderRadius: Radius.xl, alignItems: 'center', gap: 5, marginBottom: Spacing.lg, ...Shadow.lg, position: 'relative', overflow: 'hidden' },
  orderId: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  statusLabel: { color: Colors.white, fontSize: 24, fontWeight: '900', marginTop: 5 },
  statusLabelEn: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm, fontWeight: '500' },
  headerIcon: { marginTop: 15 },
  timelineCard: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadow.md },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.tertiary, marginBottom: 20 },
  detailsCard: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadow.md },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  detailText: { fontSize: FontSize.sm, color: Colors.gray, flex: 1 },
  divider: { height: 1, backgroundColor: Colors.grayLight, marginVertical: 15 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemQty: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm, width: 30 },
  itemName: { flex: 1, color: Colors.tertiary, fontSize: FontSize.sm },
  itemPrice: { color: Colors.gray, fontSize: FontSize.sm },
  helpBtn: { padding: 15, alignItems: 'center', borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.primary, marginBottom: 30 },
  helpBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
  // Timeline Step Styles
  stepRow: { flexDirection: 'row', minHeight: 70 },
  indicatorCol: { alignItems: 'center', width: 40, marginRight: 15 },
  stepCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.grayLight, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  stepCircleCompleted: { backgroundColor: Colors.success },
  stepCircleActive: { backgroundColor: Colors.primary, transform: [{ scale: 1.1 }], borderWidth: 4, borderColor: 'rgba(194,82,11,0.2)' },
  stepLine: { width: 4, flex: 1, backgroundColor: Colors.grayLight, marginVertical: -5 },
  stepLineCompleted: { backgroundColor: Colors.success },
  labelCol: { flex: 1, paddingTop: 5 },
  stepLabelText: { fontSize: 13, color: Colors.gray, fontWeight: '500' },
  stepLabelTextActive: { color: Colors.tertiary, fontWeight: '800', fontSize: 14 },
  activeTag: { fontSize: 9, fontWeight: '900', color: Colors.primary, backgroundColor: 'rgba(194,82,11,0.1)', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, marginTop: 4, alignSelf: 'flex-start' },
});
