import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../store/AuthContext';
import { CartProvider } from '../store/CartContext';
import { LanguageProvider } from '../store/LanguageContext';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/splash');
    } else if (isAuthenticated && inAuthGroup) {
      if (user?.is_restaurant_owner) {
        router.replace('/(owner)');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isLoading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <CartProvider>
          <StatusBar style="light" />
          <AuthGate>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(owner)" />
              <Stack.Screen name="restaurant/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="food/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="payment/[orderId]" options={{ headerShown: false }} />
              <Stack.Screen name="settings" options={{ headerShown: false }} />
            </Stack>
          </AuthGate>
        </CartProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
