import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import apiClient from '../../services/api/client';

const CHECKLIST_ITEMS = [
  { id: 'email', icon: '📧', label: 'Inbox at zero (or close)' },
  { id: 'learning', icon: '🧠', label: '60 min learning completed' },
  { id: 'schedule', icon: '📅', label: 'Schedule items done' },
  { id: 'ideas', icon: '💡', label: 'Business idea reviewed' },
  { id: 'logoff', icon: '🔒', label: 'Ready to log off' },
];

export default function LogOffModal() {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [completing, setCompleting] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [summary, setSummary] = useState('');

  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const completeDay = async () => {
    setCompleting(true);
    const today = new Date().toISOString().split('T')[0];
    const responses = CHECKLIST_ITEMS.map((item) => ({ id: item.id, completed: checked[item.id] || false }));
    try {
      const res = await apiClient.post('/schedule/logoff-review', { date: today, checklistResponses: responses });
      setScore(res.data.dailyScore);
      setSummary(res.data.summary);
    } catch {} finally { setCompleting(false); }
  };

  if (score !== null) return (
    <View style={styles.container}>
      <View style={styles.resultCenter}>
        <Text style={styles.resultIcon}>{score >= 80 ? '🌟' : score >= 60 ? '👍' : '💪'}</Text>
        <Text style={styles.resultScore}>{score}</Text>
        <Text style={styles.resultLabel}>Day Score</Text>
        <Text style={styles.resultSummary}>{summary}</Text>
        <Text style={styles.streakNote}>Your streak continues! See you tomorrow.</Text>
      </View>
      <TouchableOpacity style={styles.logoffButton} onPress={() => router.back()}>
        <Text style={styles.logoffButtonText}>Log Off 🔒</Text>
      </TouchableOpacity>
    </View>
  );

  const completedCount = Object.values(checked).filter(Boolean).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🕔</Text>
        <Text style={styles.headerTitle}>End of Day Review</Text>
        <Text style={styles.headerSub}>Almost time to log off. How did today go?</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {CHECKLIST_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.checkItem, checked[item.id] && styles.checkItemDone]}
            onPress={() => toggle(item.id)}
          >
            <Text style={styles.checkIcon}>{checked[item.id] ? '✅' : item.icon}</Text>
            <Text style={[styles.checkLabel, checked[item.id] && styles.checkLabelDone]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerCount}>{completedCount}/{CHECKLIST_ITEMS.length} completed</Text>
        <TouchableOpacity
          style={[styles.completeButton, completing && { opacity: 0.6 }]}
          onPress={completeDay}
          disabled={completing}
        >
          {completing ? <ActivityIndicator color={COLORS.text} size="small" /> : <Text style={styles.completeButtonText}>Complete Day</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg },
  header: { alignItems: 'center', gap: SPACING.sm, paddingTop: SPACING.xl, paddingBottom: SPACING.lg },
  headerIcon: { fontSize: 48 },
  headerTitle: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.text },
  headerSub: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: { gap: SPACING.sm },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  checkItemDone: { borderColor: COLORS.success + '60', backgroundColor: COLORS.success + '10' },
  checkIcon: { fontSize: 24, width: 32 },
  checkLabel: { fontSize: FONT_SIZE.md, color: COLORS.text, fontWeight: '500' },
  checkLabelDone: { color: COLORS.textMuted, textDecorationLine: 'line-through' },
  footer: { paddingTop: SPACING.lg, gap: SPACING.sm },
  footerCount: { textAlign: 'center', color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  completeButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center' },
  completeButtonText: { color: COLORS.text, fontWeight: '700', fontSize: FONT_SIZE.lg },
  resultCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  resultIcon: { fontSize: 64 },
  resultScore: { fontSize: 80, fontWeight: '700', color: COLORS.primary },
  resultLabel: { fontSize: FONT_SIZE.lg, color: COLORS.textSecondary },
  resultSummary: { fontSize: FONT_SIZE.md, color: COLORS.text, textAlign: 'center', lineHeight: 24, paddingHorizontal: SPACING.lg },
  streakNote: { fontSize: FONT_SIZE.sm, color: COLORS.success, fontWeight: '600' },
  logoffButton: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, marginTop: SPACING.md },
  logoffButtonText: { color: COLORS.text, fontWeight: '700', fontSize: FONT_SIZE.lg },
});
