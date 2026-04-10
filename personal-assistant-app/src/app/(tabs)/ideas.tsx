import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import apiClient from '../../services/api/client';

interface Idea { ideaId: string; title: string; summary: string; noveltyScore: number; marketCategory: string; status: string; userRating?: number; createdAt: string; }

export default function IdeasScreen() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { loadIdeas(); }, []);

  const loadIdeas = async () => {
    try {
      const res = await apiClient.get('/ideas');
      setIdeas(res.data.ideas || []);
    } catch {} finally { setLoading(false); }
  };

  const generateIdea = async () => {
    setGenerating(true);
    try {
      const res = await apiClient.post('/ideas/generate', {});
      setIdeas((prev) => [res.data.idea, ...prev]);
    } catch {
      Alert.alert('Error', 'Failed to generate idea. Check your API keys.');
    } finally { setGenerating(false); }
  };

  const noveltyColor = (score: number) =>
    score >= 9 ? COLORS.success : score >= 7 ? COLORS.warning : COLORS.textSecondary;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Business Ideas</Text>
          <Text style={styles.subtitle}>{ideas.length} generated • path to $500M</Text>
        </View>
        <TouchableOpacity
          style={[styles.generateButton, generating && { opacity: 0.6 }]}
          onPress={generateIdea}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator color={COLORS.text} size="small" />
          ) : (
            <Text style={styles.generateButtonText}>+ Generate</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xxl }} />
      ) : ideas.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💡</Text>
          <Text style={styles.emptyTitle}>No ideas yet</Text>
          <Text style={styles.emptySubtitle}>Tap Generate to create your first AI-powered business idea</Text>
          <TouchableOpacity style={styles.generateButtonLarge} onPress={generateIdea}>
            <Text style={styles.generateButtonText}>Generate First Idea</Text>
          </TouchableOpacity>
        </View>
      ) : (
        ideas.map((idea) => (
          <TouchableOpacity
            key={idea.ideaId}
            style={styles.ideaCard}
            onPress={() => router.push({ pathname: '/(modals)/idea-detail', params: { ideaId: idea.ideaId, title: idea.title, summary: idea.summary, noveltyScore: idea.noveltyScore, marketCategory: idea.marketCategory } } as any)}
          >
            <View style={styles.ideaHeader}>
              <View style={[styles.noveltyBadge, { backgroundColor: noveltyColor(idea.noveltyScore) + '20' }]}>
                <Text style={[styles.noveltyText, { color: noveltyColor(idea.noveltyScore) }]}>
                  ⚡ {idea.noveltyScore}/10
                </Text>
              </View>
              <Text style={styles.categoryTag}>{idea.marketCategory}</Text>
            </View>
            <Text style={styles.ideaTitle}>{idea.title}</Text>
            <Text style={styles.ideaSummary} numberOfLines={2}>{idea.summary}</Text>
            <View style={styles.ideaFooter}>
              <Text style={[styles.statusBadge, {
                color: idea.status === 'saved' ? COLORS.success : idea.status === 'developing' ? COLORS.primary : COLORS.textMuted
              }]}>{idea.status}</Text>
              <Text style={styles.expandHint}>Tap to expand →</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingTop: 60, gap: SPACING.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 4 },
  generateButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, minWidth: 110, alignItems: 'center' },
  generateButtonLarge: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, marginTop: SPACING.lg },
  generateButtonText: { color: COLORS.text, fontWeight: '600', fontSize: FONT_SIZE.sm },
  emptyState: { alignItems: 'center', paddingTop: SPACING.xxl },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '600', color: COLORS.text, marginTop: SPACING.md },
  emptySubtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm, paddingHorizontal: SPACING.xl },
  ideaCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm },
  ideaHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  noveltyBadge: { borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 3 },
  noveltyText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  categoryTag: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, backgroundColor: COLORS.border, borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 3 },
  ideaTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text },
  ideaSummary: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 20 },
  ideaFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { fontSize: FONT_SIZE.xs, fontWeight: '600', textTransform: 'uppercase' },
  expandHint: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
});
