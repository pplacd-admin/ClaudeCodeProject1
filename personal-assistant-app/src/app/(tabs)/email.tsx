import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import apiClient from '../../services/api/client';

interface EmailThread { id: string; from: string; subject: string; date: string; aiSummary: string; }

export default function EmailScreen() {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [inboxCount, setInboxCount] = useState(0);
  const [summarizing, setSummarizing] = useState(false);
  const [digest, setDigest] = useState('');

  useEffect(() => { loadInbox(); }, []);

  const loadInbox = async () => {
    try {
      const [inboxRes, statusRes] = await Promise.allSettled([
        apiClient.get('/email/inbox'),
        apiClient.get('/email/inbox-zero-status'),
      ]);
      if (inboxRes.status === 'fulfilled') setThreads(inboxRes.value.data.threads || []);
      if (statusRes.status === 'fulfilled') setInboxCount(statusRes.value.data.current || 0);
    } catch (e: any) {
      if (e.response?.status === 400) {
        Alert.alert('Gmail Not Connected', 'Connect your Gmail account in Settings to use email features.');
      }
    } finally { setLoading(false); }
  };

  const summarizeAll = async () => {
    setSummarizing(true);
    try {
      const res = await apiClient.post('/email/summarize-inbox', {});
      setDigest(res.data.digest);
    } catch {} finally { setSummarizing(false); }
  };

  const progressPct = inboxCount === 0 ? 100 : Math.max(0, Math.round((1 - inboxCount / 50) * 100));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Inbox</Text>

      {/* Inbox zero progress */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Inbox Zero Progress</Text>
          <Text style={[styles.inboxCount, { color: inboxCount === 0 ? COLORS.success : COLORS.warning }]}>
            {inboxCount === 0 ? '🎉 Zero!' : `${inboxCount} unread`}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: inboxCount === 0 ? COLORS.success : COLORS.primary }]} />
        </View>
        <Text style={styles.progressSubtext}>{progressPct}% to inbox zero by 5PM</Text>
      </View>

      {/* Summarize button */}
      <TouchableOpacity style={styles.summarizeButton} onPress={summarizeAll} disabled={summarizing}>
        {summarizing ? <ActivityIndicator color={COLORS.text} size="small" /> : <Text style={styles.summarizeButtonText}>AI Summarize All</Text>}
      </TouchableOpacity>

      {/* Digest */}
      {digest ? (
        <View style={styles.digestCard}>
          <Text style={styles.digestLabel}>AI Digest</Text>
          <Text style={styles.digestText}>{digest}</Text>
        </View>
      ) : null}

      {/* Thread list */}
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : threads.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>{inboxCount === 0 ? '🎉' : '📭'}</Text>
          <Text style={styles.emptyTitle}>{inboxCount === 0 ? 'Inbox Zero!' : 'No emails loaded'}</Text>
          <Text style={styles.emptySubtitle}>{inboxCount === 0 ? "You're on top of everything. Great work!" : 'Connect Gmail or check your connection.'}</Text>
        </View>
      ) : (
        threads.map((thread) => (
          <View key={thread.id} style={styles.threadCard}>
            <View style={styles.threadHeader}>
              <Text style={styles.threadFrom} numberOfLines={1}>{thread.from.replace(/<.*>/, '').trim()}</Text>
              <Text style={styles.threadDate}>{new Date(thread.date).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.threadSubject} numberOfLines={1}>{thread.subject}</Text>
            <Text style={styles.threadSummary}>{thread.aiSummary}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingTop: 60, gap: SPACING.md },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.text },
  progressCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  progressLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  inboxCount: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  progressBar: { height: 8, backgroundColor: COLORS.border, borderRadius: 4 },
  progressFill: { height: 8, borderRadius: 4 },
  progressSubtext: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: SPACING.xs },
  summarizeButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  summarizeButtonText: { color: COLORS.text, fontWeight: '600', fontSize: FONT_SIZE.md },
  digestCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.primary + '40' },
  digestLabel: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: '600', marginBottom: SPACING.sm },
  digestText: { fontSize: FONT_SIZE.md, color: COLORS.text, lineHeight: 22 },
  emptyState: { alignItems: 'center', paddingTop: SPACING.xxl },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '600', color: COLORS.text, marginTop: SPACING.md },
  emptySubtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm },
  threadCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.xs },
  threadHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  threadFrom: { fontSize: FONT_SIZE.sm, color: COLORS.text, fontWeight: '600', flex: 1 },
  threadDate: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  threadSubject: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  threadSummary: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontStyle: 'italic' },
});
