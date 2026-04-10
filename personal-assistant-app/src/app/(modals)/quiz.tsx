import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';
import apiClient from '../../services/api/client';

interface Question { id: string; text: string; options: string[]; }

export default function QuizModal() {
  const { topicId: paramTopicId } = useLocalSearchParams<{ topicId?: string }>();
  const router = useRouter();
  const [topicId, setTopicId] = useState(paramTopicId || '');
  const [quizId, setQuizId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [currentQ, setCurrentQ] = useState(0);

  useEffect(() => { loadQuiz(); }, []);

  const loadQuiz = async () => {
    try {
      let tid = topicId;
      if (!tid) {
        const topicRes = await apiClient.get('/learning/quiz/next-topic');
        tid = topicRes.data.topicId;
        setTopicId(tid);
      }
      const res = await apiClient.post('/learning/quiz/generate', { topicId: tid });
      setQuizId(res.data.quizId);
      setQuestions(res.data.questions || []);
    } catch {} finally { setLoading(false); }
  };

  const selectAnswer = (questionId: string, idx: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: idx }));
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1);
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    try {
      const answerList = Object.entries(answers).map(([questionId, answerIndex]) => ({ questionId, answerIndex }));
      const res = await apiClient.post('/learning/quiz/submit', { quizId, answers: answerList });
      setResult(res.data);
    } catch {} finally { setSubmitting(false); }
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color={COLORS.primary} size="large" />
      <Text style={styles.loadingText}>Generating quiz questions...</Text>
    </View>
  );

  if (result) return (
    <View style={styles.container}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultIcon}>{result.score >= 0.8 ? '🎉' : result.score >= 0.6 ? '👍' : '💪'}</Text>
        <Text style={styles.resultScore}>{Math.round(result.score * 100)}%</Text>
        <Text style={styles.resultLabel}>{result.score >= 0.8 ? 'Excellent!' : result.score >= 0.6 ? 'Good work!' : 'Keep practicing!'}</Text>
        <Text style={styles.nextReview}>Next review: {result.nextReviewAt ? new Date(result.nextReviewAt).toLocaleDateString() : 'Tomorrow'}</Text>
      </View>
      <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  const q = questions[currentQ];
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.progress}>{currentQ + 1} / {questions.length}</Text>
      </View>

      {/* Progress dots */}
      <View style={styles.dots}>
        {questions.map((_, i) => (
          <View key={i} style={[styles.dot, i === currentQ && styles.dotActive, answers[questions[i].id] !== undefined && styles.dotAnswered]} />
        ))}
      </View>

      <ScrollView style={styles.questionScroll} contentContainerStyle={styles.questionContent}>
        <Text style={styles.questionText}>{q?.text}</Text>

        {q?.options.map((opt, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.option, answers[q.id] === idx && styles.optionSelected]}
            onPress={() => selectAnswer(q.id, idx)}
          >
            <View style={[styles.optionLetter, answers[q.id] === idx && styles.optionLetterSelected]}>
              <Text style={styles.optionLetterText}>{['A', 'B', 'C', 'D'][idx]}</Text>
            </View>
            <Text style={[styles.optionText, answers[q.id] === idx && styles.optionTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        {currentQ < questions.length - 1 ? (
          <TouchableOpacity
            style={[styles.nextButton, !answers[q?.id] && { opacity: 0.4 }]}
            onPress={nextQuestion}
            disabled={!answers[q?.id]}
          >
            <Text style={styles.nextButtonText}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, (!allAnswered || submitting) && { opacity: 0.4 }]}
            onPress={submitQuiz}
            disabled={!allAnswered || submitting}
          >
            {submitting ? <ActivityIndicator color={COLORS.text} size="small" /> : <Text style={styles.submitButtonText}>Submit Quiz</Text>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg, paddingTop: SPACING.xl },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  loadingText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  backText: { fontSize: FONT_SIZE.xl, color: COLORS.textSecondary },
  progress: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, fontWeight: '600' },
  dots: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.xl },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.primary },
  dotAnswered: { backgroundColor: COLORS.success },
  questionScroll: { flex: 1 },
  questionContent: { gap: SPACING.md },
  questionText: { fontSize: FONT_SIZE.lg, color: COLORS.text, fontWeight: '600', lineHeight: 28, marginBottom: SPACING.md },
  option: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  optionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' },
  optionLetter: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  optionLetterSelected: { backgroundColor: COLORS.primary },
  optionLetterText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text },
  optionText: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.text, lineHeight: 20 },
  optionTextSelected: { color: COLORS.text },
  footer: { paddingTop: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border },
  nextButton: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary },
  nextButtonText: { color: COLORS.primary, fontWeight: '600', fontSize: FONT_SIZE.md },
  submitButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  submitButtonText: { color: COLORS.text, fontWeight: '600', fontSize: FONT_SIZE.md },
  resultHeader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  resultIcon: { fontSize: 64 },
  resultScore: { fontSize: 56, fontWeight: '700', color: COLORS.primary },
  resultLabel: { fontSize: FONT_SIZE.xl, fontWeight: '600', color: COLORS.text },
  nextReview: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  doneButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', margin: SPACING.lg },
  doneButtonText: { color: COLORS.text, fontWeight: '600', fontSize: FONT_SIZE.md },
});
