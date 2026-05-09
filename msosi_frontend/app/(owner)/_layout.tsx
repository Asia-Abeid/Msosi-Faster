import { Tabs, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../store/AuthContext';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabIcon({ name, focused, label }: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  label: string;
}) {
  return (
    <View style={styles.tabItem}>
      <Ionicons 
        name={name} 
        size={24} 
        color={focused ? Colors.primary : Colors.gray} 
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function OwnerLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isLoading && (!user || !user.is_restaurant_owner)) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading]);

  if (isLoading || !user?.is_restaurant_owner) return null;

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
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'restaurant' : 'restaurant-outline'} focused={focused} label="Menu" />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'pie-chart' : 'pie-chart-outline'} focused={focused} label="Analytics" />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'receipt' : 'receipt-outline'} focused={focused} label="Orders" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} label="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    position: 'absolute',
    elevation: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    borderWidth: 1,
    borderColor: '#F1F1F1',
    justifyContent: 'center',
    display: 'flex',
  },
  tabItem: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 4, 
    flex: 1,
    marginTop: 15,
  },
  tabLabel: { fontSize: 10, color: Colors.gray, fontWeight: '500' },
  tabLabelActive: { color: Colors.primary, fontWeight: '700' },
});
