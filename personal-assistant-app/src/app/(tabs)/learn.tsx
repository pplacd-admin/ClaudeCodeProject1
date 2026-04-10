import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import apiClient from '../../services/api/client';

interface Topic { topicId: string; track: string; title: string; difficulty: string; estimatedMinutes: number; order: number; }

export default function LearnScreen() {
  const router = useRouter();
  const [activeTrack, setActiveTrack] = useState<'claude' | 'gemini' | 'agents-ecosystem'>('claude');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  const tracks = [
    { id: 'claude', label: 'Claude', color: COLORS.claude, icon: '🤖' },
    { id: 'gemini', label: 'Gemini', color: COLORS.gemini, icon: '✨' },
    { id: 'agents-ecosystem', label: 'Ecosystem', color: COLORS.ecosystem, icon: '🌐' },
  ];

  useEffect(() => { loadCurriculum(); }, []);

  const loadCurriculum = async () => {
    try {
      const res = await apiClient.get('/learning/curriculum');
      setTopics(res.data.topics || []);
    } catch { } finally { setLoading(false); }
  };

  const startLesson = async (topicId: string) => {
    router.push({ pathname: '/(modals)/lesson', params: { topicId } } as any);
  };

  const takeQuiz = async () => {
    const res = await apiClient.get('/learning/quiz/next-topic');
    router.push({ pathname: '/(modals)/quiz', params: { topicId: res.data.topicId } } as any);
  };

  const filteredTopics = topics.filter((t) => t.track === activeTrack);
  const trackConfig = tracks.find((t) => t.id === activeTrack)!;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Microlearning</Text>
        <TouchableOpacity style={styles.quizButton} onPress={takeQuiz}>
          <Text style={styles.quizButtonText}>Take Quiz</Text>
        </TouchableOpacity>
      </View>

      {/* Track tabs */}
      <View style={styles.tabs}>
        {tracks.map((track) => (
          <TouchableOpacity
            key={track.id}
            style={[styles.tab, activeTrack === track.id && { borderBottomColor: track.color, borderBottomWidth: 2 }]}
            onPress={() => setActiveTrack(track.id as any)}
          >
            <Text style={styles.tabIcon}>{track.icon}</Text>
            <Text style={[styles.tabLabel, activeTrack === track.id && { color: track.color }]}>{track.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Progress bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{trackConfig.label} Track Progress</Text>
          <Text style={[styles.progressCount, { color: trackConfig.color }]}>{filteredTopics.length} topics</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '10%', backgroundColor: trackConfig.color }]} />
        </View>
      </View>

      {/* Topics list */}
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : (
        filteredTopics.map((topic) => (
          <TouchableOpacity key={topic.topicId} style={styles.topicCard} onPress={() => startLesson(topic.topicId)}>
            <View style={styles.topicLeft}>
              <View style={[styles.orderBadge, { backgroundColor: trackConfig.color + '20' }]}>
                <Text style={[styles.orderText, { color: trackConfig.color }]}>{topic.order}</Text>
              </View>
              <View style={styles.topicInfo}>
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <View style={styles.topicMeta}>
                  <Text style={styles.topicMetaText}>{topic.estimatedMinutes} min</Text>
                  <Text style={styles.topicMetaDot}>·</Text>
                  <Text style={[styles.difficultyBadge, {
                    color: topic.difficulty === 'beginner' ? COLORS.success : topic.difficulty === 'intermediate' ? COLORS.warning : COLORS.error
                  }]}>{topic.difficulty}</Text>
                </View>
              </View>
            </View>
            <Text style={{ color: COLORS.textMuted }}>→</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingTop: 60, gap: SPACING.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.text },
  quizButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  quizButtonText: { color: COLORS.text, fontWeight: '600', fontSize: FONT_SIZE.sm },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: SPACING.md },
  tab: { flex: 1, alignItems: 'center', paddingVertical: SPACING.sm, gap: 4 },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, fontWeight: '500' },
  progressSection: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  progressLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  progressCount: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  progressBar: { height: 6, backgroundColor: COLORS.border, borderRadius: 3 },
  progressFill: { height: 6, borderRadius: 3 },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topicLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  orderBadge: { width: 32, height: 32, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  orderText: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  topicInfo: { flex: 1 },
  topicTitle: { fontSize: FONT_SIZE.md, color: COLORS.text, fontWeight: '500' },
  topicMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: 2 },
  topicMetaText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  topicMetaDot: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs },
  difficultyBadge: { fontSize: FONT_SIZE.xs, fontWeight: '500' },
});
