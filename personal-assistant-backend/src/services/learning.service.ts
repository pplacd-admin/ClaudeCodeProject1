import { db } from '../config/firebase';
import { generateText, generateTextFast } from './claude.service';
import { generateTextGemini } from './gemini.service';
import { lessonPromptTemplate, microLessonPromptTemplate } from '../utils/prompts';
import { sm2Update, getNextReviewDate, scoreToQuality, SM2Record } from '../utils/sm2';
import { CURRICULUM } from '../constants/curriculum';

export interface LearningProgress {
  topicId: string;
  track: string;
  status: 'not_started' | 'in_progress' | 'mastered';
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date | null;
  totalQuizAttempts: number;
  lastQuizScore: number;
  lessonCompletedAt: Date | null;
}

export async function getNextLesson(userId: string, track?: string): Promise<{ topicId: string; lesson: string; estimatedMinutes: number } | null> {
  if (!db) return mockLesson(track);

  const progressSnap = await db
    .collection(`users/${userId}/learningProgress`)
    .get();

  const progressMap: Record<string, LearningProgress> = {};
  progressSnap.docs.forEach((doc) => {
    progressMap[doc.id] = doc.data() as LearningProgress;
  });

  const topics = track ? CURRICULUM.filter((t) => t.track === track) : CURRICULUM;

  // Find topics overdue for review first
  const overdue = topics.filter((t) => {
    const p = progressMap[t.topicId];
    if (!p || p.status === 'not_started') return false;
    return p.nextReviewAt && new Date(p.nextReviewAt) <= new Date();
  });

  // Then find next unstarted topic in order
  const unstarted = topics.filter((t) => {
    const p = progressMap[t.topicId];
    return !p || p.status === 'not_started';
  });

  const nextTopic = overdue[0] || unstarted[0];
  if (!nextTopic) return null;

  const lesson = await generateLesson(userId, nextTopic.topicId, nextTopic.difficulty, nextTopic.track);
  return { topicId: nextTopic.topicId, lesson, estimatedMinutes: nextTopic.estimatedMinutes };
}

export async function generateLesson(
  userId: string,
  topicId: string,
  difficulty: string,
  track: string
): Promise<string> {
  if (!db) {
    return mockLessonContent(topicId);
  }

  // Check cache
  const cacheRef = db.doc(`users/${userId}/lessons/${topicId}`);
  const cached = await cacheRef.get();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  if (cached.exists && cached.data()?.cachedAt?.toDate() > thirtyDaysAgo) {
    return cached.data()!.content;
  }

  const topic = CURRICULUM.find((t) => t.topicId === topicId);
  if (!topic) return 'Topic not found';

  const prompt = lessonPromptTemplate(topic.title, difficulty, topic.estimatedMinutes, track);
  const content = track === 'gemini'
    ? await generateTextGemini(prompt)
    : await generateText(prompt);

  await cacheRef.set({
    topicId,
    track,
    content,
    cachedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return content;
}

export async function getMicroLessons(userId: string, count = 3): Promise<{ topicId: string; content: string; track: string }[]> {
  // Pick random topics from different tracks for variety
  const tracks = ['claude', 'gemini', 'agents-ecosystem'];
  const results: { topicId: string; content: string; track: string }[] = [];

  for (let i = 0; i < Math.min(count, tracks.length); i++) {
    const trackTopics = CURRICULUM.filter((t) => t.track === tracks[i]);
    const topic = trackTopics[Math.floor(Math.random() * trackTopics.length)];
    const prompt = microLessonPromptTemplate(topic.title, topic.track);
    const content = await generateTextFast(prompt);
    results.push({ topicId: topic.topicId, content, track: topic.track });
  }

  return results;
}

export async function completeLesson(
  userId: string,
  topicId: string,
  minutesSpent: number
): Promise<void> {
  if (!db) return;

  const now = new Date();
  await db.doc(`users/${userId}/learningProgress/${topicId}`).set({
    topicId,
    track: CURRICULUM.find((t) => t.topicId === topicId)?.track || 'claude',
    status: 'in_progress',
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReviewAt: getNextReviewDate(1),
    totalQuizAttempts: 0,
    lastQuizScore: 0,
    lessonCompletedAt: now,
  }, { merge: true });

  // Update daily stats
  const dateKey = now.toISOString().split('T')[0];
  const statsRef = db.doc(`users/${userId}/dailyStats/${dateKey}`);
  const statsSnap = await statsRef.get();
  const existing = statsSnap.data() || {};
  await statsRef.set({
    ...existing,
    date: dateKey,
    learningMinutes: (existing.learningMinutes || 0) + minutesSpent,
    lessonsCompleted: (existing.lessonsCompleted || 0) + 1,
  }, { merge: true });
}

export async function updateProgressAfterQuiz(
  userId: string,
  topicId: string,
  score: number
): Promise<SM2Record & { nextReviewAt: Date }> {
  const quality = scoreToQuality(score);

  let record: SM2Record = { easeFactor: 2.5, interval: 1, repetitions: 0 };

  if (db) {
    const progRef = db.doc(`users/${userId}/learningProgress/${topicId}`);
    const snap = await progRef.get();
    if (snap.exists) {
      const data = snap.data()!;
      record = { easeFactor: data.easeFactor || 2.5, interval: data.interval || 1, repetitions: data.repetitions || 0 };
    }
  }

  const updated = sm2Update(record, quality);
  const nextReviewAt = getNextReviewDate(updated.interval);

  if (db) {
    await db.doc(`users/${userId}/learningProgress/${topicId}`).set({
      ...updated,
      nextReviewAt,
      lastQuizScore: score,
      totalQuizAttempts: 1,
      status: updated.repetitions >= 3 && score > 0.8 ? 'mastered' : 'in_progress',
    }, { merge: true });
  }

  return { ...updated, nextReviewAt };
}

function mockLesson(track?: string) {
  return {
    topicId: 'claude-api-basics',
    lesson: '## Overview\nThe Claude API lets you build AI-powered applications...\n\n## Core Concept\nYou send messages and receive responses...',
    estimatedMinutes: 10,
  };
}

function mockLessonContent(topicId: string) {
  return `## Overview\nLesson for ${topicId}.\n\n## Core Concept\nThis is a placeholder lesson. Configure your API keys to generate real content.\n\n## Key Takeaways\n- Set up your environment\n- Add API keys to .env\n- Restart the server`;
}
