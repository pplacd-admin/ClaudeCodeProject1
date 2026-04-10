import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import apiClient from '../../services/api/client';

export default function ProgressScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProgress(); }, []);

  const loadProgress = async () => {
    try {
      const res = await apiClient.get('/progress/dashboard');
      setData(res.data);
    } catch {} finally { setLoading(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;

  const learningStats = data?.learningStats || {};
  const masteredPct = learningStats.totalTopics ? Math.round((learningStats.totalMastered / learningStats.totalTopics) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Progress</Text>

      {/* Streak */}
      <View style={styles.streakCard}>
        <Text style={styles.streakIcon}>🔥</Text>
        <View>
          <Text style={styles.streakValue}>{data?.streak || 0} day streak</Text>
          <Text style={styles.streakSub}>Keep going! Log off on time to maintain it.</Text>
        </View>
      </View>

      {/* Weekly scores */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.barChart}>
          {(data?.weeklyScores || []).map((d: { date: string; score: number }, i: number) => (
            <View key={d.date} style={styles.barItem}>
              <View style={[styles.bar, { height: Math.max(4, (d.score / 100) * 80), backgroundColor: d.score >= 70 ? COLORS.primary : d.score >= 40 ? COLORS.warning : COLORS.border }]} />
              <Text style={styles.barLabel}>{new Date(d.date).toLocaleDateString('en-US', { weekday: 'narrow' })}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Learning progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Knowledge Mastery</Text>
        <View style={styles.masteryCard}>
          <View style={styles.masteryHeader}>
            <Text style={styles.masteryTotal}>{learningStats.totalMastered || 0} / {learningStats.totalTopics || 45} topics mastered</Text>
            <Text style={[styles.masteryPct, { color: masteredPct > 50 ? COLORS.success : COLORS.primary }]}>{masteredPct}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${masteredPct}%` }]} />
          </View>
          <View style={styles.trackBreakdown}>
            {[
              { label: 'Claude', value: learningStats.claudeProgress || 0, color: COLORS.claude },
              { label: 'Gemini', value: learningStats.geminiProgress || 0, color: COLORS.gemini },
              { label: 'Ecosystem', value: learningStats.ecoProgress || 0, color: COLORS.ecosystem },
            ].map((track) => (
              <View key={track.label} style={styles.trackItem}>
                <View style={[styles.trackDot, { backgroundColor: track.color }]} />
                <Text style={styles.trackLabel}>{track.label}</Text>
                <Text style={[styles.trackValue, { color: track.color }]}>{track.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Ideas stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Ideas</Text>
        <View style={styles.statsRow}>
          <StatBox label="Generated" value={data?.ideasStats?.totalGenerated || 0} color={COLORS.primary} />
          <StatBox label="Saved" value={data?.ideasStats?.saved || 0} color={COLORS.success} />
        </View>
      </View>
    </ScrollView>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[statStyles.box, { borderColor: color + '40' }]}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  box: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 1 },
  value: { fontSize: FONT_SIZE.xxxl, fontWeight: '700' },
  label: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 4 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingTop: 60, gap: SPACING.lg },
  center: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.text },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.warning + '40' },
  streakIcon: { fontSize: 40 },
  streakValue: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.text },
  streakSub: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 4 },
  section: { gap: SPACING.sm },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text },
  barChart: { flexDirection: 'row', gap: SPACING.sm, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, justifyContent: 'space-around', alignItems: 'flex-end', height: 120, borderWidth: 1, borderColor: COLORS.border },
  barItem: { alignItems: 'center', gap: SPACING.xs, flex: 1 },
  bar: { width: '100%', borderRadius: 3, minHeight: 4 },
  barLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  masteryCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, gap: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  masteryHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  masteryTotal: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  masteryPct: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  progressBar: { height: 8, backgroundColor: COLORS.border, borderRadius: 4 },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  trackBreakdown: { flexDirection: 'row', gap: SPACING.md },
  trackItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  trackDot: { width: 8, height: 8, borderRadius: 4 },
  trackLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  trackValue: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: SPACING.sm },
});
