import { db } from '../config/firebase';
import { generateText } from './claude.service';
import { quizPromptTemplate } from '../utils/prompts';
import { CURRICULUM } from '../constants/curriculum';
import { updateProgressAfterQuiz } from './learning.service';
import { v4 as uuidv4 } from '../utils/uuid';

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizResult {
  questionId: string;
  userAnswerIndex: number;
  correct: boolean;
  explanation: string;
}

async function getPriorQuestions(userId: string, topicId: string): Promise<string[]> {
  if (!db) return [];
  const historySnap = await db
    .collection(`users/${userId}/quizHistory`)
    .where('topicId', '==', topicId)
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get();

  const questions: string[] = [];
  historySnap.docs.forEach((doc) => {
    const data = doc.data();
    (data.questions || []).forEach((q: QuizQuestion) => questions.push(q.text));
  });
  return questions;
}

export async function generateQuiz(
  userId: string,
  topicId: string,
  questionCount = 5
): Promise<{ quizId: string; questions: Omit<QuizQuestion, 'correctIndex' | 'explanation'>[] }> {
  const topic = CURRICULUM.find((t) => t.topicId === topicId);
  if (!topic) throw new Error(`Topic not found: ${topicId}`);

  const priorQuestions = await getPriorQuestions(userId, topicId);
  const prompt = quizPromptTemplate(topic.title, topic.track, priorQuestions);

  let questionsData: QuizQuestion[] = [];
  try {
    const raw = await generateText(prompt, 'You are a quiz generator. Return only valid JSON.');
    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      questionsData = parsed.questions || [];
    }
  } catch {
    questionsData = mockQuestions(topic.title);
  }

  const quizId = uuidv4();

  if (db) {
    await db.doc(`users/${userId}/quizHistory/${quizId}`).set({
      quizId,
      topicId,
      questions: questionsData,
      score: null,
      createdAt: new Date(),
    });
  }

  // Return questions WITHOUT correct answers to the client
  return {
    quizId,
    questions: questionsData.map(({ id, text, options }) => ({ id, text, options })),
  };
}

export async function submitQuiz(
  userId: string,
  quizId: string,
  answers: { questionId: string; answerIndex: number }[]
): Promise<{ score: number; results: QuizResult[]; nextReviewAt: Date }> {
  if (!db) {
    return { score: 0.8, results: [], nextReviewAt: new Date(Date.now() + 86400000) };
  }

  const quizRef = db.doc(`users/${userId}/quizHistory/${quizId}`);
  const quizSnap = await quizRef.get();
  if (!quizSnap.exists) throw new Error('Quiz not found');

  const quizData = quizSnap.data()!;
  const questions: QuizQuestion[] = quizData.questions;

  let correctCount = 0;
  const results: QuizResult[] = answers.map(({ questionId, answerIndex }) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return { questionId, userAnswerIndex: answerIndex, correct: false, explanation: '' };
    const correct = answerIndex === question.correctIndex;
    if (correct) correctCount++;
    return { questionId, userAnswerIndex: answerIndex, correct, explanation: question.explanation };
  });

  const score = correctCount / questions.length;

  await quizRef.update({ score, answers, completedAt: new Date() });

  const sm2Result = await updateProgressAfterQuiz(userId, quizData.topicId, score);

  // Update daily stats
  const dateKey = new Date().toISOString().split('T')[0];
  await db.doc(`users/${userId}/dailyStats/${dateKey}`).set({
    quizzesTaken: 1,
    quizAccuracy: score,
  }, { merge: true });

  return { score, results, nextReviewAt: sm2Result.nextReviewAt };
}

export async function getNextQuizTopic(userId: string): Promise<string | null> {
  if (!db) return 'claude-01-api-basics';

  const progressSnap = await db.collection(`users/${userId}/learningProgress`).get();
  const progressMap: Record<string, { nextReviewAt: any; totalQuizAttempts: number; status: string }> = {};
  progressSnap.docs.forEach((doc) => { progressMap[doc.id] = doc.data() as any; });

  // Topics with lessons done but never quizzed
  const unquizzed = CURRICULUM.filter((t) => {
    const p = progressMap[t.topicId];
    return p && p.status !== 'not_started' && p.totalQuizAttempts === 0;
  });
  if (unquizzed.length > 0) return unquizzed.sort((a, b) => a.order - b.order)[0].topicId;

  // Most overdue
  const overdue = Object.entries(progressMap)
    .filter(([_, p]) => p.nextReviewAt && new Date(p.nextReviewAt.toDate?.() || p.nextReviewAt) <= new Date())
    .sort(([_, a], [__, b]) => {
      const aDate = new Date(a.nextReviewAt?.toDate?.() || a.nextReviewAt);
      const bDate = new Date(b.nextReviewAt?.toDate?.() || b.nextReviewAt);
      return aDate.getTime() - bDate.getTime();
    });

  return overdue[0]?.[0] || CURRICULUM[0].topicId;
}

function mockQuestions(topicTitle: string): QuizQuestion[] {
  return [
    {
      id: 'q1',
      text: `What is the primary purpose of ${topicTitle}?`,
      options: ['To process data', 'To enable AI capabilities', 'To store information', 'To manage users'],
      correctIndex: 1,
      explanation: `${topicTitle} is primarily used to enable AI capabilities in applications.`,
    },
  ];
}
