import { Router, Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { streamChatToWebSocket } from '../services/claude.service';
import { streamGeminiChatToWebSocket } from '../services/gemini.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateText } from '../services/claude.service';
import { morningBriefingPrompt } from '../utils/prompts';

const router = Router();

// POST /voice/morning-briefing
router.post('/morning-briefing', async (req: AuthRequest, res: Response) => {
  try {
    const { date, events = [], inboxCount = 0, nextLesson = 'AI Fundamentals', streak = 0 } = req.body;
    const prompt = morningBriefingPrompt({
      name: 'Vivek',
      date: date || new Date().toISOString().split('T')[0],
      events,
      inboxCount,
      nextLesson,
      streak,
    });
    const briefing = await generateText(prompt);
    res.json({ briefing, date });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate morning briefing' });
  }
});

export default router;

// WebSocket handler (called from index.ts)
export function setupVoiceWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url || '/', `http://localhost`);
    const userId = url.searchParams.get('userId') || 'unknown';
    const ai = url.searchParams.get('ai') || 'claude';

    let conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'chat') {
          conversationHistory.push({ role: 'user', content: message.text });

          // Keep last 10 turns
          if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
          }

          const contextInjection = message.context
            ? JSON.stringify(message.context)
            : undefined;

          let fullResponse = '';
          if (ai === 'gemini') {
            fullResponse = await streamGeminiChatToWebSocket(ws, conversationHistory, contextInjection);
          } else {
            fullResponse = await streamChatToWebSocket(ws, conversationHistory, contextInjection);
          }

          conversationHistory.push({ role: 'assistant', content: fullResponse });
        }

        if (message.type === 'reset') {
          conversationHistory = [];
          ws.send(JSON.stringify({ type: 'reset_ok' }));
        }
      } catch (err) {
        ws.send(JSON.stringify({ type: 'error', error: 'Failed to process message' }));
      }
    });

    ws.on('error', console.error);
    ws.send(JSON.stringify({ type: 'connected', ai, userId }));
  });
}
