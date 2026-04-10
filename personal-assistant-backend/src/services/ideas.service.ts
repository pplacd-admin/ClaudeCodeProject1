import { db } from '../config/firebase';
import { generateText } from './claude.service';
import { ideaGenerationPrompt } from '../utils/prompts';
import { v4 as uuidv4 } from '../utils/uuid';

export interface BusinessIdea {
  ideaId: string;
  title: string;
  summary: string;
  targetMarket: string;
  problemSolved: string;
  revenueModel: string;
  competitiveLandscape: string;
  noveltyScore: number;
  tags: string[];
  status: 'new' | 'saved' | 'developing' | 'dismissed';
  userRating?: number;
  marketCategory: string;
  createdAt: Date;
}

export async function generateIdea(
  userId: string,
  marketFocus?: string,
  noveltyThreshold = 7
): Promise<BusinessIdea> {
  // Get prior idea categories to avoid
  const avoidCategories: string[] = [];
  const avoidTitles: string[] = [];

  if (db) {
    const ideasSnap = await db
      .collection(`users/${userId}/ideas`)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    ideasSnap.docs.forEach((doc) => {
      const data = doc.data();
      avoidCategories.push(data.marketCategory);
      avoidTitles.push(data.title);
    });
  }

  const prompt = ideaGenerationPrompt(
    [...new Set(avoidCategories)],
    avoidTitles,
    marketFocus
  );

  let ideaData: Partial<BusinessIdea> = {};
  let attempts = 0;

  while (attempts < 3) {
    try {
      const raw = await generateText(prompt, 'You are a visionary business strategist. Return only valid JSON.');
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        ideaData = JSON.parse(jsonMatch[0]);
        if ((ideaData.noveltyScore || 0) >= noveltyThreshold) break;
      }
    } catch {
      // retry
    }
    attempts++;
  }

  const idea: BusinessIdea = {
    ideaId: uuidv4(),
    title: ideaData.title || 'Untitled Idea',
    summary: ideaData.summary || '',
    targetMarket: ideaData.targetMarket || '',
    problemSolved: ideaData.problemSolved || '',
    revenueModel: ideaData.revenueModel || '',
    competitiveLandscape: ideaData.competitiveLandscape || '',
    noveltyScore: ideaData.noveltyScore || 7,
    tags: ideaData.tags || [],
    status: 'new',
    marketCategory: ideaData.marketCategory || 'general',
    createdAt: new Date(),
  };

  if (db) {
    await db.doc(`users/${userId}/ideas/${idea.ideaId}`).set(idea);
  }

  return idea;
}

export async function expandIdea(
  userId: string,
  ideaId: string,
  depth: 'brief' | 'full' | 'investor-deck'
): Promise<string> {
  if (!db) return 'Configure Firebase to use this feature.';

  const ideaSnap = await db.doc(`users/${userId}/ideas/${ideaId}`).get();
  if (!ideaSnap.exists) throw new Error('Idea not found');

  const idea = ideaSnap.data() as BusinessIdea;

  const depthInstructions = {
    brief: 'Write a 3-paragraph expansion. Focus on the core insight.',
    full: 'Write a comprehensive 800-word business analysis covering market, competition, execution, and risks.',
    'investor-deck': `Write a full investor pitch covering: Problem, Solution, Market Size (TAM/SAM/SOM), Business Model, Go-to-Market, Competitive Moat, Team Needs, Financial Projections (3-year), and Ask.`,
  };

  const prompt = `Expand this business idea for Vivek:

Title: ${idea.title}
Summary: ${idea.summary}
Target Market: ${idea.targetMarket}
Problem: ${idea.problemSolved}
Revenue Model: ${idea.revenueModel}

${depthInstructions[depth]}

Be specific, credible, and actionable. Include real numbers where possible.`;

  return generateText(prompt);
}

export async function getIdeas(
  userId: string,
  status?: string,
  limit = 20
): Promise<BusinessIdea[]> {
  if (!db) return [];

  let query = db.collection(`users/${userId}/ideas`).orderBy('createdAt', 'desc').limit(limit);
  if (status) query = query.where('status', '==', status) as any;

  const snap = await query.get();
  return snap.docs.map((doc) => doc.data() as BusinessIdea);
}

export async function updateIdeaStatus(
  userId: string,
  ideaId: string,
  updates: { status?: string; userRating?: number }
): Promise<void> {
  if (!db) return;
  await db.doc(`users/${userId}/ideas/${ideaId}`).update(updates);
}
