import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { google } from 'googleapis';
import { db } from '../config/firebase';
import { generateTextFast } from '../services/claude.service';
import { env } from '../config/env';

const router = Router();

function getOAuthClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ access_token: accessToken });
  return oauth2Client;
}

async function getUserTokens(userId: string): Promise<{ accessToken: string } | null> {
  if (!db) return null;
  const snap = await db.doc(`users/${userId}`).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  return data.gmailAccessToken ? { accessToken: data.gmailAccessToken } : null;
}

// GET /email/inbox
router.get('/inbox', async (req: AuthRequest, res: Response) => {
  try {
    const tokens = await getUserTokens(req.userId!);
    if (!tokens) return res.status(400).json({ error: 'Gmail not connected. Please connect Gmail first.' });

    const auth = getOAuthClient(tokens.accessToken);
    const gmail = google.gmail({ version: 'v1', auth });

    const listRes = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['INBOX', 'UNREAD'],
      maxResults: parseInt(req.query.maxResults as string) || 20,
    });

    const messages = listRes.data.messages || [];
    const threads: any[] = [];

    for (const msg of messages.slice(0, 10)) {
      const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id!, format: 'metadata', metadataHeaders: ['From', 'Subject', 'Date'] });
      const headers = detail.data.payload?.headers || [];
      const get = (name: string) => headers.find((h) => h.name === name)?.value || '';
      const snippet = detail.data.snippet || '';

      const summary = await generateTextFast(
        `Summarize this email in 1 sentence (max 15 words): From: ${get('From')} | Subject: ${get('Subject')} | ${snippet}`,
        'You summarize emails ultra-concisely.'
      );

      threads.push({
        id: msg.id,
        from: get('From'),
        subject: get('Subject'),
        date: get('Date'),
        snippet,
        aiSummary: summary.trim(),
      });
    }

    res.json({ threads, totalUnread: listRes.data.resultSizeEstimate || 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch inbox' });
  }
});

// POST /email/summarize-inbox
router.post('/summarize-inbox', async (req: AuthRequest, res: Response) => {
  try {
    const tokens = await getUserTokens(req.userId!);
    if (!tokens) return res.status(400).json({ error: 'Gmail not connected' });

    const auth = getOAuthClient(tokens.accessToken);
    const gmail = google.gmail({ version: 'v1', auth });

    const listRes = await gmail.users.messages.list({ userId: 'me', labelIds: ['INBOX', 'UNREAD'], maxResults: 20 });
    const messages = listRes.data.messages || [];

    const subjects: string[] = [];
    for (const msg of messages.slice(0, 15)) {
      const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id!, format: 'metadata', metadataHeaders: ['From', 'Subject'] });
      const headers = detail.data.payload?.headers || [];
      const subject = headers.find((h) => h.name === 'Subject')?.value || '';
      const from = headers.find((h) => h.name === 'From')?.value || '';
      subjects.push(`From: ${from} | Subject: ${subject}`);
    }

    const digest = await generateTextFast(
      `You have ${messages.length} unread emails. Here are the most recent:\n${subjects.join('\n')}\n\nWrite a 3-sentence digest for Vivek. Highlight anything urgent. Be direct.`,
      'You are a chief of staff summarizing emails.'
    );

    res.json({ digest, urgentCount: Math.min(3, messages.length), totalCount: messages.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to summarize inbox' });
  }
});

// POST /email/oauth/callback
router.post('/oauth/callback', async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;
    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI
    );
    const { tokens } = await oauth2Client.getToken(code);

    if (db) {
      await db.doc(`users/${req.userId}`).set({
        gmailAccessToken: tokens.access_token,
        gmailRefreshToken: tokens.refresh_token,
        gmailTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      }, { merge: true });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'OAuth failed' });
  }
});

// GET /email/inbox-zero-status
router.get('/inbox-zero-status', async (req: AuthRequest, res: Response) => {
  try {
    const tokens = await getUserTokens(req.userId!);
    if (!tokens) return res.json({ current: 0, target: 0, progressPct: 100 });

    const auth = getOAuthClient(tokens.accessToken);
    const gmail = google.gmail({ version: 'v1', auth });
    const listRes = await gmail.users.messages.list({ userId: 'me', labelIds: ['INBOX', 'UNREAD'], maxResults: 1 });

    const current = listRes.data.resultSizeEstimate || 0;
    res.json({ current, target: 0, progressPct: current === 0 ? 100 : Math.max(0, Math.round((1 - current / 50) * 100)) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
