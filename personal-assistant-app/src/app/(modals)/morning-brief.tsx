import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import apiClient from '../../services/api/client';

export default function MorningBriefModal() {
  const router = useRouter();
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadBriefing(); }, []);

  const loadBriefing = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await apiClient.post('/voice/morning-briefing', { date: today });
      setBriefing(res.data.briefing);
    } catch {} finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🌅</Text>
        <Text style={styles.headerTitle}>Morning Briefing</Text>
        <Text style={styles.headerDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Preparing your briefing...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.briefingText}>{briefing}</Text>
        </ScrollView>
      )}

      <TouchableOpacity style={styles.letsGoButton} onPress={() => router.back()}>
        <Text style={styles.letsGoText}>Let's Go 🚀</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg },
  header: { alignItems: 'center', gap: SPACING.sm, paddingTop: SPACING.xl, paddingBottom: SPACING.lg },
  headerIcon: { fontSize: 48 },
  headerTitle: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.text },
  headerDate: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  loadingText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: SPACING.xl },
  briefingText: { color: COLORS.text, fontSize: FONT_SIZE.md, lineHeight: 26 },
  letsGoButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', marginTop: SPACING.lg },
  letsGoText: { color: COLORS.text, fontWeight: '700', fontSize: FONT_SIZE.lg },
});
