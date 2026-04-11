import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ActivityIndicator, ScrollView, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../../constants/colors';
import { restaurantsApi, BASE_URL } from '../../services/api';
import { useCart } from '../../store/CartContext';
import axios from 'axios';
import i18n from '../../constants/i18n';

const { width } = Dimensions.get('window');

export default function FoodDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem, decrementItem, incrementItem, getItemQuantity } = useCart();

  const [food, setFood] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFood = async () => {
      try {
        const res = await restaurantsApi.getFoodDetail(Number(id));
        setFood(res.data);
      } catch (error) {
        console.error('Error fetching food details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFood();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const quantity = getItemQuantity(Number(id));
  const imgUri = food?.image ? `${BASE_URL.replace('/api', '')}${food.image}` : null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.bannerContainer}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={styles.banner} />
          ) : (
            <View style={[styles.banner, styles.bannerPlaceholder]}>
              <Ionicons name="fast-food-outline" size={80} color={Colors.grayLight} />
            </View>
          )}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{food?.name}</Text>
            {food?.is_available && (
              <View style={styles.availableBadge}>
                <Text style={styles.availableText}>{i18n.t('food.available')}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.price}>TSh {Number(food?.price).toLocaleString()}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>{i18n.t('food.description')}</Text>
          <Text style={styles.description}>
            {food?.description || i18n.t('food.defaultDesc')}
          </Text>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="timer-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>20-30 min prep</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="flame-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>Hot & Fresh</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer / Action */}
      <View style={styles.footer}>
        <View style={styles.qtyContainer}>
          <TouchableOpacity 
            style={styles.qtyBtn} 
            onPress={() => decrementItem(`${food?.restaurant}-${id}`)}
            disabled={quantity === 0}
          >
            <Ionicons name="remove" size={24} color={quantity > 0 ? Colors.primary : Colors.gray} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity 
            style={styles.qtyBtn} 
            onPress={() => addItem({
              menuItemId: Number(id),
              restaurantId: food?.restaurant,
              restaurantName: "Restaurant", // We would ideally have this from the previous screen
              name: food?.name,
              price: Number(food?.price),
              image: food?.image,
            })}
          >
            <Ionicons name="add" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => {
            if (quantity === 0) {
              addItem({
                menuItemId: Number(id),
                restaurantId: food?.restaurant,
                restaurantName: "Restaurant",
                name: food?.name,
                price: Number(food?.price),
                image: food?.image,
              });
            }
            router.push('/(tabs)/cart');
          }}
        >
          <LinearGradient
            colors={Colors.primaryGradient}
            style={styles.addBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.addBtnText}>
              {quantity > 0 ? i18n.t('cart.viewCart') : i18n.t('cart.addToCart')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bannerContainer: { width: width, height: 350, position: 'relative' },
  banner: { width: '100%', height: '100%', resizeMode: 'cover' },
  bannerPlaceholder: { backgroundColor: Colors.neutral, justifyContent: 'center', alignItems: 'center' },
  backBtn: { position: 'absolute', top: 50, left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.lg },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  name: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.tertiary, flex: 1 },
  availableBadge: { backgroundColor: Colors.success + '20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.sm },
  availableText: { color: Colors.success, fontSize: 12, fontWeight: '700' },
  price: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary, marginBottom: 20 },
  divider: { height: 1, backgroundColor: Colors.grayLight, marginBottom: 20 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.tertiary, marginBottom: 10 },
  description: { fontSize: FontSize.md, color: Colors.gray, lineHeight: 24, marginBottom: 25 },
  infoRow: { flexDirection: 'row', gap: 30 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontSize: FontSize.sm, color: Colors.gray, fontWeight: '600' },
  footer: { padding: Spacing.lg, paddingBottom: 40, borderTopWidth: 1, borderTopColor: Colors.grayLight, flexDirection: 'row', gap: 15, alignItems: 'center' },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.neutral, borderRadius: Radius.lg, padding: 5 },
  qtyBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.tertiary, width: 40, textAlign: 'center' },
  addBtn: { flex: 1 },
  addBtnGrad: { height: 55, borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '800' },
});
