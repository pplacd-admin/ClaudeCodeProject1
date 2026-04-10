import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text } from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { COLORS } from '../../constants/theme';

const TAB_ICONS: Record<string, string> = {
  index: '🏠',
  voice: '🎙️',
  learn: '🧠',
  schedule: '📅',
  email: '📧',
  ideas: '💡',
  progress: '📊',
};

export default function TabLayout() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.replace('/(auth)/login');
  }, [user]);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          paddingBottom: 8,
          height: 80,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 10, marginTop: 2 },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
            {TAB_ICONS[route.name] || '●'}
          </Text>
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="voice" options={{ title: 'Voice' }} />
      <Tabs.Screen name="learn" options={{ title: 'Learn' }} />
      <Tabs.Screen name="schedule" options={{ title: 'Schedule' }} />
      <Tabs.Screen name="email" options={{ title: 'Email' }} />
      <Tabs.Screen name="ideas" options={{ title: 'Ideas' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
    </Tabs>
  );
}
