import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import apiClient from '../../services/api/client';

interface ScheduleEvent { id: string; title: string; startTime: string; endTime?: string; priority: string; completed: boolean; source: string; }

export default function ScheduleScreen() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { loadSchedule(); }, []);

  const loadSchedule = async () => {
    try {
      const res = await apiClient.get(`/schedule/${today}`);
      setEvents(res.data.schedule?.events || []);
    } catch {} finally { setLoading(false); }
  };

  const suggestDay = async () => {
    setSuggesting(true);
    try {
      const res = await apiClient.post('/schedule/ai-suggest', { date: today, goals: ['Learn AI', 'Inbox zero', 'Generate business ideas'] });
      const suggestions = res.data.suggestions || [];
      // Add suggested events
      for (const s of suggestions) {
        await apiClient.post(`/schedule/${today}/events`, s);
      }
      await loadSchedule();
    } catch { Alert.alert('Error', 'Failed to generate suggestions'); } finally { setSuggesting(false); }
  };

  const toggleComplete = async (eventId: string, completed: boolean) => {
    try {
      await apiClient.patch(`/schedule/${today}/events/${eventId}/complete`, { completed: !completed });
      setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, completed: !completed } : e));
    } catch {}
  };

  const priorityColor = (p: string) => ({ high: COLORS.error, medium: COLORS.warning, low: COLORS.success }[p] || COLORS.textMuted);

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Schedule</Text>
          <Text style={styles.subtitle}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>
        <TouchableOpacity style={[styles.suggestButton, suggesting && { opacity: 0.6 }]} onPress={suggestDay} disabled={suggesting}>
          {suggesting ? <ActivityIndicator color={COLORS.text} size="small" /> : <Text style={styles.suggestButtonText}>AI Suggest</Text>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xxl }} />
      ) : events.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>No events today</Text>
          <Text style={styles.emptySubtitle}>Tap "AI Suggest" to let AI plan your perfect day</Text>
        </View>
      ) : (
        <View style={styles.timeline}>
          {events.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((event, i) => (
            <View key={event.id} style={styles.timelineItem}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeText}>{event.startTime}</Text>
                {i < events.length - 1 && <View style={styles.timeLine} />}
              </View>
              <TouchableOpacity
                style={[styles.eventCard, event.completed && styles.eventCardDone, { borderLeftColor: priorityColor(event.priority) }]}
                onPress={() => toggleComplete(event.id, event.completed)}
              >
                <View style={styles.eventRow}>
                  <Text style={[styles.eventTitle, event.completed && styles.eventTitleDone]}>{event.title}</Text>
                  <Text style={{ fontSize: 18 }}>{event.completed ? '✅' : '⬜'}</Text>
                </View>
                {event.endTime && <Text style={styles.eventTime}>{event.startTime} – {event.endTime}</Text>}
                <View style={[styles.priorityDot, { backgroundColor: priorityColor(event.priority) }]} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Log-off reminder */}
      <TouchableOpacity style={styles.logoffCard} onPress={() => {}}>
        <Text style={styles.logoffIcon}>🔔</Text>
        <View>
          <Text style={styles.logoffTitle}>Log off at 5:00 PM</Text>
          <Text style={styles.logoffSubtitle}>Reminder set · Complete your daily review</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingTop: 60, gap: SPACING.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 4 },
  suggestButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  suggestButtonText: { color: COLORS.text, fontWeight: '600', fontSize: FONT_SIZE.sm },
  emptyState: { alignItems: 'center', paddingTop: SPACING.xxl },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '600', color: COLORS.text, marginTop: SPACING.md },
  emptySubtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm },
  timeline: { gap: 0 },
  timelineItem: { flexDirection: 'row', gap: SPACING.sm },
  timeColumn: { width: 52, alignItems: 'flex-end', paddingTop: 14 },
  timeText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  timeLine: { flex: 1, width: 1, backgroundColor: COLORS.border, marginTop: 4, marginBottom: -8, alignSelf: 'center' },
  eventCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderLeftWidth: 3, borderWidth: 1, borderColor: COLORS.border, position: 'relative' },
  eventCardDone: { opacity: 0.5 },
  eventRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventTitle: { fontSize: FONT_SIZE.md, color: COLORS.text, fontWeight: '500', flex: 1 },
  eventTitleDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  eventTime: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 4 },
  priorityDot: { position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: 3 },
  logoffCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.warning + '40' },
  logoffIcon: { fontSize: 28 },
  logoffTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text },
  logoffSubtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
});
