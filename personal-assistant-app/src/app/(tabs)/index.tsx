import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import apiClient from '../../services/api/client';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ streak: 0, score: 0, learningMinutes: 0, inboxCount: 0 });
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
    loadStats();
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [dashRes, emailRes] = await Promise.allSettled([
        apiClient.get('/progress/dashboard'),
        apiClient.get('/email/inbox-zero-status'),
      ]);
      if (dashRes.status === 'fulfilled') {
        setStats((s) => ({ ...s, streak: dashRes.value.data.streak || 0, score: dashRes.value.data.weeklyScores?.slice(-1)[0]?.score || 0 }));
      }
      if (emailRes.status === 'fulfilled') {
        setStats((s) => ({ ...s, inboxCount: emailRes.value.data.current || 0 }));
      }
    } catch {}
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  const quickActions = [
    { icon: '🎙️', label: 'Voice Chat', route: '/(tabs)/voice' },
    { icon: '📋', label: 'Morning Brief', route: '/(modals)/morning-brief' },
    { icon: '💡', label: 'Get Idea', route: '/(tabs)/ideas' },
    { icon: '🧠', label: "Today's Quiz", route: '/(modals)/quiz' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting}, {user?.displayName?.split(' ')[0] || 'Vivek'}</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </View>

      {/* Score ring row */}
      <View style={styles.statsRow}>
        <StatCard icon="🔥" label="Streak" value={`${stats.streak}d`} color={COLORS.warning} />
        <StatCard icon="📧" label="Inbox" value={stats.inboxCount === 0 ? 'Zero!' : `${stats.inboxCount}`} color={stats.inboxCount === 0 ? COLORS.success : COLORS.error} />
        <StatCard icon="⭐" label="Score" value={`${stats.score}`} color={COLORS.primary} />
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.actionButton}
            onPress={() => router.push(action.route as any)}
          >
            <Text style={styles.actionIcon}>{action.icon}</Text>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Today's Learning */}
      <Text style={styles.sectionTitle}>Start Learning</Text>
      <TouchableOpacity style={styles.learningCard} onPress={() => router.push('/(tabs)/learn')}>
        <View style={styles.learningBadge}>
          <Text style={styles.learningBadgeText}>5 min</Text>
        </View>
        <Text style={styles.learningTitle}>Claude API Basics</Text>
        <Text style={styles.learningSubtitle}>Tap to start your first micro-lesson</Text>
        <View style={styles.learningArrow}>
          <Text style={{ color: COLORS.primary, fontSize: FONT_SIZE.lg }}>→</Text>
        </View>
      </TouchableOpacity>

      {/* Daily Checklist */}
      <Text style={styles.sectionTitle}>Today's Goals</Text>
      <View style={styles.checklistCard}>
        {[
          { icon: '📚', label: '30 min Claude learning', done: false },
          { icon: '🎓', label: '30 min Gemini learning', done: false },
          { icon: '📧', label: 'Inbox zero by 5PM', done: stats.inboxCount === 0 },
          { icon: '🕐', label: 'Log off at 5PM', done: false },
          { icon: '💡', label: 'Generate 1 business idea', done: false },
        ].map((item) => (
          <View key={item.label} style={styles.checklistItem}>
            <Text style={[styles.checklistIcon, item.done && styles.checklistDone]}>{item.done ? '✅' : item.icon}</Text>
            <Text style={[styles.checklistLabel, item.done && styles.checklistLabelDone]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={[statStyles.card, { borderColor: color + '40' }]}>
      <Text style={statStyles.icon}>{icon}</Text>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 1 },
  icon: { fontSize: 22 },
  value: { fontSize: FONT_SIZE.xl, fontWeight: '700', marginTop: SPACING.xs },
  label: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, gap: SPACING.md, paddingTop: 60 },
  header: { marginBottom: SPACING.sm },
  greeting: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.text },
  date: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: SPACING.sm },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text, marginTop: SPACING.sm },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: { fontSize: 28 },
  actionLabel: { fontSize: FONT_SIZE.sm, color: COLORS.text, fontWeight: '500' },
  learningCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    position: 'relative',
  },
  learningBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  learningBadgeText: { fontSize: FONT_SIZE.xs, color: COLORS.text, fontWeight: '600' },
  learningTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text },
  learningSubtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 4 },
  learningArrow: { position: 'absolute', right: SPACING.lg, top: '50%' },
  checklistCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checklistItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  checklistIcon: { fontSize: 18, width: 28 },
  checklistDone: { opacity: 0.5 },
  checklistLabel: { fontSize: FONT_SIZE.md, color: COLORS.text },
  checklistLabelDone: { color: COLORS.textMuted, textDecorationLine: 'line-through' },
});
