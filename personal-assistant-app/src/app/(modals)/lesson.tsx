import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import apiClient from '../../services/api/client';

export default function LessonModal() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const router = useRouter();
  const [lesson, setLesson] = useState('');
  const [topic, setTopic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (topicId) loadLesson();
  }, [topicId]);

  const loadLesson = async () => {
    try {
      const res = await apiClient.post('/learning/generate-lesson', { topicId });
      setLesson(res.data.lesson);
      setTopic(res.data.topic);
    } catch {} finally { setLoading(false); }
  };

  const completeLesson = async () => {
    setCompleting(true);
    const minutesSpent = Math.round((Date.now() - startTime) / 60000);
    try {
      await apiClient.post('/learning/complete-lesson', { topicId, minutesSpent: Math.max(1, minutesSpent) });
      router.back();
    } catch {} finally { setCompleting(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>✕ Close</Text>
        </TouchableOpacity>
        {topic && (
          <View style={[styles.trackBadge, {
            backgroundColor: (topic.track === 'claude' ? COLORS.claude : topic.track === 'gemini' ? COLORS.gemini : COLORS.ecosystem) + '20',
          }]}>
            <Text style={[styles.trackBadgeText, {
              color: topic.track === 'claude' ? COLORS.claude : topic.track === 'gemini' ? COLORS.gemini : COLORS.ecosystem
            }]}>{topic.track}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Generating lesson with AI...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.lessonText}>{lesson}</Text>
        </ScrollView>
      )}

      {!loading && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.completeButton, completing && { opacity: 0.6 }]}
            onPress={completeLesson}
            disabled={completing}
          >
            {completing ? <ActivityIndicator color={COLORS.text} size="small" /> : <Text style={styles.completeButtonText}>Mark Complete ✓</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingTop: SPACING.xl },
  backButton: { padding: SPACING.xs },
  backText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md },
  trackBadge: { borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 4 },
  trackBadgeText: { fontSize: FONT_SIZE.xs, fontWeight: '600', textTransform: 'uppercase' },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  loadingText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  lessonText: { color: COLORS.text, fontSize: FONT_SIZE.md, lineHeight: 26 },
  footer: { padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border },
  completeButton: { backgroundColor: COLORS.success, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  completeButtonText: { color: COLORS.text, fontWeight: '600', fontSize: FONT_SIZE.md },
});
