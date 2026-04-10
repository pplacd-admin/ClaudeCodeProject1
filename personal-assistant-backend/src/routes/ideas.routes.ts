import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateIdea, expandIdea, getIdeas, updateIdeaStatus } from '../services/ideas.service';

const router = Router();

// GET /ideas
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const limit = req.query.limit as string | undefined;
    const ideas = await getIdeas(req.userId!, status, parseInt(limit || '20') || 20);
    res.json({ ideas, total: ideas.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get ideas' });
  }
});

// POST /ideas/generate
router.post('/generate', async (req: AuthRequest, res: Response) => {
  try {
    const { marketFocus, noveltyThreshold } = req.body;
    const idea = await generateIdea(req.userId!, marketFocus as string | undefined, noveltyThreshold as number | undefined);
    res.json({ idea });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate idea' });
  }
});

// POST /ideas/:ideaId/expand
router.post('/:ideaId/expand', async (req: AuthRequest, res: Response) => {
  try {
    const depth = (req.body.depth || 'full') as 'brief' | 'full' | 'investor-deck';
    const ideaId = String(req.params.ideaId);
    const analysis = await expandIdea(req.userId!, ideaId, depth);
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: 'Failed to expand idea' });
  }
});

// PATCH /ideas/:ideaId
router.patch('/:ideaId', async (req: AuthRequest, res: Response) => {
  try {
    await updateIdeaStatus(req.userId!, String(req.params.ideaId), req.body as { status?: string; userRating?: number });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update idea' });
  }
});

export default router;
