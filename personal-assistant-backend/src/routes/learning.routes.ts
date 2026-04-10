import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  getNextLesson,
  generateLesson,
  getMicroLessons,
  completeLesson,
} from '../services/learning.service';
import { generateQuiz, submitQuiz, getNextQuizTopic } from '../services/quiz.service';
import { CURRICULUM } from '../constants/curriculum';

const router = Router();

// GET /learning/curriculum
router.get('/curriculum', async (req: AuthRequest, res: Response) => {
  const { track } = req.query;
  const topics = track ? CURRICULUM.filter((t) => t.track === track) : CURRICULUM;
  res.json({ topics });
});

// GET /learning/next-lesson
router.get('/next-lesson', async (req: AuthRequest, res: Response) => {
  try {
    const { track } = req.query as { track?: string };
    const result = await getNextLesson(req.userId!, track);
    if (!result) return res.json({ message: 'All lessons completed for today!' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get next lesson' });
  }
});

// POST /learning/generate-lesson
router.post('/generate-lesson', async (req: AuthRequest, res: Response) => {
  try {
    const { topicId } = req.body;
    const topic = CURRICULUM.find((t) => t.topicId === topicId);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });
    const lesson = await generateLesson(req.userId!, topicId, topic.difficulty, topic.track);
    res.json({ lesson, topicId, topic });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate lesson' });
  }
});

// GET /learning/micro-lessons
router.get('/micro-lessons', async (req: AuthRequest, res: Response) => {
  try {
    const count = parseInt(req.query.count as string) || 3;
    const lessons = await getMicroLessons(req.userId!, count);
    res.json({ lessons });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get micro-lessons' });
  }
});

// POST /learning/complete-lesson
router.post('/complete-lesson', async (req: AuthRequest, res: Response) => {
  try {
    const { topicId, minutesSpent = 5 } = req.body;
    await completeLesson(req.userId!, topicId, minutesSpent);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark lesson complete' });
  }
});

// POST /learning/quiz/generate
router.post('/quiz/generate', async (req: AuthRequest, res: Response) => {
  try {
    const { topicId, questionCount = 5 } = req.body;
    const quiz = await generateQuiz(req.userId!, topicId, questionCount);
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// POST /learning/quiz/submit
router.post('/quiz/submit', async (req: AuthRequest, res: Response) => {
  try {
    const { quizId, answers } = req.body;
    const result = await submitQuiz(req.userId!, quizId, answers);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// GET /learning/quiz/next-topic
router.get('/quiz/next-topic', async (req: AuthRequest, res: Response) => {
  try {
    const topicId = await getNextQuizTopic(req.userId!);
    res.json({ topicId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get next quiz topic' });
  }
});

export default router;
