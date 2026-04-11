import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useCart } from '../../store/CartContext';
import { useLanguage } from '../../store/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import i18n from '../../constants/i18n';

function TabIcon({ name, focused, label, badge }: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  label: string;
  badge?: number;
}) {
  return (
    <View style={styles.tabItem}>
      <View>
        <Ionicons 
          name={name} 
          size={24} 
          color={focused ? Colors.primary : Colors.gray} 
        />
        {badge != null && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { totalItems } = useCart();
  const { locale } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          { 
            height: 70 + insets.bottom, 
            paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          }
        ],
        tabBarShowLabel: false,
        tabBarIconStyle: {
          width: '100%',
          height: 60,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              name={focused ? 'home' : 'home-outline'} 
              focused={focused} 
              label={i18n.t('navbar.home')}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              name={focused ? 'search' : 'search-outline'} 
              focused={focused} 
              label={i18n.t('navbar.search')}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'basket' : 'basket-outline'}
              focused={focused}
              label={i18n.t('navbar.cart')}
              badge={totalItems}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              name={focused ? 'receipt' : 'receipt-outline'} 
              focused={focused} 
              label={i18n.t('navbar.orders')}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              name={focused ? 'person' : 'person-outline'} 
              focused={focused} 
              label={i18n.t('navbar.profile')}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    position: 'absolute',
    elevation: 30,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    flex: 1,
    paddingTop: 12,
  },
  tabLabel: { fontSize: 10, color: Colors.gray, fontWeight: '600' },
  tabLabelActive: { color: Colors.primary, fontWeight: '800' },
  badge: {
    position: 'absolute', top: -5, right: -12,
    backgroundColor: Colors.error,
    minWidth: 17, height: 17, borderRadius: 8.5,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
    paddingHorizontal: 2,
  },
  badgeText: { color: '#fff', fontSize: 8, fontWeight: '900' },
});

