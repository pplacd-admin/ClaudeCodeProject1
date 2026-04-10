import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../config/firebase';
import { CURRICULUM } from '../constants/curriculum';

const router = Router();

// GET /progress/dashboard
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    if (!db) {
      return res.json({
        streak: 0,
        weeklyScores: [],
        learningStats: { totalMastered: 0, totalTopics: CURRICULUM.length, claudeProgress: 0, geminiProgress: 0, ecoProgress: 0 },
        productivityStats: { inboxZeroRate: 0, scheduleCompletionRate: 0 },
        ideasStats: { totalGenerated: 0, saved: 0 },
      });
    }

    const userId = req.userId!;

    // Last 7 days stats
    const weeklyScores: { date: string; score: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const snap = await db.doc(`users/${userId}/dailyStats/${dateKey}`).get();
      weeklyScores.push({ date: dateKey, score: snap.exists ? snap.data()!.overallScore || 0 : 0 });
    }

    // Learning progress
    const progressSnap = await db.collection(`users/${userId}/learningProgress`).get();
    const progressDocs = progressSnap.docs.map((d) => d.data());
    const mastered = progressDocs.filter((p) => p.status === 'mastered').length;

    // Ideas count
    const ideasSnap = await db.collection(`users/${userId}/ideas`).count().get();
    const savedIdeas = await db.collection(`users/${userId}/ideas`).where('status', '==', 'saved').count().get();

    // Streak calculation
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const snap = await db.doc(`users/${userId}/dailyStats/${dateKey}`).get();
      if (snap.exists && (snap.data()!.overallScore || 0) >= 60) {
        streak++;
      } else {
        break;
      }
    }

    res.json({
      streak,
      weeklyScores,
      learningStats: {
        totalMastered: mastered,
        totalTopics: CURRICULUM.length,
        claudeProgress: progressDocs.filter((p) => p.track === 'claude' && p.status === 'mastered').length,
        geminiProgress: progressDocs.filter((p) => p.track === 'gemini' && p.status === 'mastered').length,
        ecoProgress: progressDocs.filter((p) => p.track === 'agents-ecosystem' && p.status === 'mastered').length,
      },
      productivityStats: {
        inboxZeroRate: 0,
        scheduleCompletionRate: 0,
      },
      ideasStats: {
        totalGenerated: ideasSnap.data().count,
        saved: savedIdeas.data().count,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
