import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { onAuthStateChanged, getIdToken } from 'firebase/auth';
import { auth } from '../services/firebase/config';
import { useAuthStore } from '../store/auth.store';
import { COLORS } from '../constants/theme';
import { scheduleAllNotifications } from '../services/notifications/scheduler';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const { setUser, setToken, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await getIdToken(firebaseUser);
        await SecureStore.setItemAsync('auth_token', token);
        setToken(token);
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        });
        // Schedule daily notifications
        await scheduleAllNotifications();
      } else {
        await SecureStore.deleteItemAsync('auth_token');
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    // Request notification permissions
    Notifications.requestPermissionsAsync();

    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(modals)/quiz" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(modals)/lesson" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(modals)/morning-brief" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(modals)/log-off" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(modals)/idea-detail" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
