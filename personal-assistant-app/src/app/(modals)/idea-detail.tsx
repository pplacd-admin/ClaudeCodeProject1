import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import apiClient from '../../services/api/client';

export default function IdeaDetailModal() {
  const { ideaId, title, summary, noveltyScore, marketCategory } = useLocalSearchParams<{ ideaId: string; title: string; summary: string; noveltyScore: string; marketCategory: string; }>();
  const router = useRouter();
  const [expanding, setExpanding] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [depth, setDepth] = useState<'brief' | 'full' | 'investor-deck'>('full');

  const expand = async () => {
    setExpanding(true);
    try {
      const res = await apiClient.post(`/ideas/${ideaId}/expand`, { depth });
      setAnalysis(res.data.analysis);
    } catch {} finally { setExpanding(false); }
  };

  const saveIdea = async () => {
    try {
      await apiClient.patch(`/ideas/${ideaId}`, { status: 'saved' });
      router.back();
    } catch {}
  };

  const score = parseInt(noveltyScore || '7');
  const noveltyColor = score >= 9 ? COLORS.success : score >= 7 ? COLORS.warning : COLORS.textSecondary;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>✕ Close</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={saveIdea}>
          <Text style={styles.saveButtonText}>Save Idea</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.meta}>
          <View style={[styles.noveltyBadge, { backgroundColor: noveltyColor + '20' }]}>
            <Text style={[styles.noveltyText, { color: noveltyColor }]}>⚡ Novelty: {score}/10</Text>
          </View>
          <Text style={styles.category}>{marketCategory}</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.summary}>{summary}</Text>

        {/* Expand section */}
        <View style={styles.expandSection}>
          <Text style={styles.expandTitle}>Deep Analysis</Text>
          <View style={styles.depthRow}>
            {(['brief', 'full', 'investor-deck'] as const).map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.depthPill, depth === d && styles.depthPillActive]}
                onPress={() => setDepth(d)}
              >
                <Text style={[styles.depthPillText, depth === d && styles.depthPillTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.expandButton, expanding && { opacity: 0.6 }]}
            onPress={expand}
            disabled={expanding}
          >
            {expanding ? <ActivityIndicator color={COLORS.text} size="small" /> : <Text style={styles.expandButtonText}>Expand with Claude →</Text>}
          </TouchableOpacity>
        </View>

        {analysis ? (
          <View style={styles.analysisCard}>
            <Text style={styles.analysisLabel}>Claude Analysis</Text>
            <Text style={styles.analysisText}>{analysis}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingTop: SPACING.xl },
  backText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md },
  saveButton: { backgroundColor: COLORS.success, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  saveButtonText: { color: COLORS.text, fontWeight: '600', fontSize: FONT_SIZE.sm },
  content: { padding: SPACING.lg, gap: SPACING.lg },
  meta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  noveltyBadge: { borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 4 },
  noveltyText: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  category: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, backgroundColor: COLORS.surface, borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 3 },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.text, lineHeight: 32 },
  summary: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, lineHeight: 24 },
  expandSection: { gap: SPACING.sm },
  expandTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text },
  depthRow: { flexDirection: 'row', gap: SPACING.sm },
  depthPill: { borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  depthPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  depthPillText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  depthPillTextActive: { color: COLORS.text, fontWeight: '600' },
  expandButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  expandButtonText: { color: COLORS.text, fontWeight: '600', fontSize: FONT_SIZE.md },
  analysisCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.primary + '40', gap: SPACING.sm },
  analysisLabel: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: '600', textTransform: 'uppercase' },
  analysisText: { fontSize: FONT_SIZE.md, color: COLORS.text, lineHeight: 24 },
});
