import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../config/firebase';
import { generateText } from '../services/claude.service';
import { v4 as uuidv4 } from '../utils/uuid';

const router = Router();

// GET /schedule/:date
router.get('/:date', async (req: AuthRequest, res: Response) => {
  try {
    if (!db) return res.json({ schedule: { date: req.params.date, events: [] } });
    const snap = await db.doc(`users/${req.userId}/schedule/${req.params.date}`).get();
    res.json({ schedule: snap.exists ? snap.data() : { date: req.params.date, events: [] } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get schedule' });
  }
});

// POST /schedule/:date/events
router.post('/:date/events', async (req: AuthRequest, res: Response) => {
  try {
    const event = { id: uuidv4(), completed: false, source: 'manual', ...req.body };
    if (db) {
      const ref = db.doc(`users/${req.userId}/schedule/${req.params.date}`);
      const snap = await ref.get();
      const existing = snap.exists ? snap.data()!.events || [] : [];
      await ref.set({ date: req.params.date, events: [...existing, event] }, { merge: true });
    }
    res.json({ event });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add event' });
  }
});

// POST /schedule/ai-suggest
router.post('/ai-suggest', async (req: AuthRequest, res: Response) => {
  try {
    const { date, goals = [] } = req.body;
    const prompt = `Create an ideal daily schedule for Vivek on ${date}.
Goals for today: ${goals.join(', ') || 'Be productive, learn AI, manage email'}
Include: morning routine, learning blocks (2x 30min), email review, focus work, breaks, 5PM log-off.
Return JSON array: [{"title": "...", "startTime": "HH:MM", "endTime": "HH:MM", "priority": "high|medium|low"}]`;

    const raw = await generateText(prompt, 'Return only valid JSON array.');
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    res.json({ suggestions, rationale: 'AI-optimized schedule for maximum productivity' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate schedule suggestions' });
  }
});

// PATCH /schedule/:date/events/:eventId/complete
router.patch('/:date/events/:eventId/complete', async (req: AuthRequest, res: Response) => {
  try {
    const { completed } = req.body;
    if (!db) return res.json({ success: true });
    const ref = db.doc(`users/${req.userId}/schedule/${req.params.date}`);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Schedule not found' });
    const events = (snap.data()!.events || []).map((e: any) =>
      e.id === req.params.eventId ? { ...e, completed } : e
    );
    await ref.update({ events });
    const completionRate = events.filter((e: any) => e.completed).length / events.length;
    res.json({ success: true, completionRate });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// POST /schedule/logoff-review
router.post('/logoff-review', async (req: AuthRequest, res: Response) => {
  try {
    const { date, checklistResponses = [] } = req.body;
    const completed = checklistResponses.filter((r: any) => r.completed).length;
    const total = checklistResponses.length || 5;
    const score = Math.round((completed / total) * 100);

    const summary = await generateText(
      `Write a 2-sentence end-of-day summary for Vivek. Score: ${score}/100. Completed: ${completed}/${total} goals. Be encouraging and specific about tomorrow.`,
      'You are a personal coach. Be direct and motivating.'
    );

    if (db) {
      await db.doc(`users/${req.userId}/schedule/${date}`).set({
        logoffReviewCompleted: true,
        dailyScore: score,
      }, { merge: true });

      await db.doc(`users/${req.userId}/dailyStats/${date}`).set({
        date,
        overallScore: score,
        logoffCompleted: true,
      }, { merge: true });
    }

    res.json({ dailyScore: score, summary });
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete log-off review' });
  }
});

export default router;
