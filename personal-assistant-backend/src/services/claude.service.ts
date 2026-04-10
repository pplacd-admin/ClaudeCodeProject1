import Anthropic from '@anthropic-ai/sdk';
import { anthropic } from '../config/anthropic';
import { ASSISTANT_SYSTEM_PROMPT } from '../utils/prompts';
import { WebSocket } from 'ws';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

const VOICE_TOOLS: Anthropic.Tool[] = [
  {
    name: 'add_schedule_event',
    description: "Add an event to the user's schedule",
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' },
        date: { type: 'string', description: 'YYYY-MM-DD format' },
        startTime: { type: 'string', description: 'HH:MM 24-hour format' },
        endTime: { type: 'string', description: 'HH:MM 24-hour format' },
        priority: { type: 'string', enum: ['high', 'medium', 'low'] },
      },
      required: ['title', 'date', 'startTime'],
    },
  },
  {
    name: 'get_todays_schedule',
    description: "Retrieve the user's schedule for today or a specific date",
    input_schema: {
      type: 'object' as const,
      properties: {
        date: { type: 'string', description: 'YYYY-MM-DD, defaults to today' },
      },
    },
  },
  {
    name: 'get_inbox_summary',
    description: "Get a summary of the user's email inbox",
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'generate_business_idea',
    description: 'Generate a new business idea',
    input_schema: {
      type: 'object' as const,
      properties: {
        marketFocus: { type: 'string', description: 'Optional market/industry focus' },
      },
    },
  },
];

export async function streamChatToWebSocket(
  ws: WebSocket,
  messages: ConversationMessage[],
  contextInjection?: string
): Promise<string> {
  const systemPrompt = contextInjection
    ? `${ASSISTANT_SYSTEM_PROMPT}\n\nContext: ${contextInjection}`
    : ASSISTANT_SYSTEM_PROMPT;

  let fullResponse = '';

  try {
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.slice(-10),
      tools: VOICE_TOOLS,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const delta = event.delta.text;
        fullResponse += delta;
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: 'delta', delta }));
        }
      }
    }

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'done', fullResponse }));
    }
  } catch (err) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'error', error: 'AI response failed' }));
    }
  }

  return fullResponse;
}

export async function generateText(prompt: string, system?: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: system || ASSISTANT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });
  return response.content[0].type === 'text' ? response.content[0].text : '';
}

export async function generateTextFast(prompt: string, system?: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: system || '',
    messages: [{ role: 'user', content: prompt }],
  });
  return response.content[0].type === 'text' ? response.content[0].text : '';
}
