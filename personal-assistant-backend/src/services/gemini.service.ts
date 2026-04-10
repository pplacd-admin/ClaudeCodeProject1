import { getGeminiModel } from '../config/gemini';
import { ASSISTANT_SYSTEM_PROMPT } from '../utils/prompts';
import { WebSocket } from 'ws';
import { ConversationMessage } from './claude.service';

export async function streamGeminiChatToWebSocket(
  ws: WebSocket,
  messages: ConversationMessage[],
  contextInjection?: string
): Promise<string> {
  const model = getGeminiModel('gemini-1.5-pro');
  const systemInstruction = contextInjection
    ? `${ASSISTANT_SYSTEM_PROMPT}\n\nContext: ${contextInjection}`
    : ASSISTANT_SYSTEM_PROMPT;

  const history = messages.slice(-10, -1).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];
  const chat = model.startChat({
    history,
    systemInstruction: { role: 'user', parts: [{ text: systemInstruction }] },
  });

  let fullResponse = '';

  try {
    const result = await chat.sendMessageStream(lastMessage.content);
    for await (const chunk of result.stream) {
      const delta = chunk.text();
      fullResponse += delta;
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'delta', delta }));
      }
    }
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'done', fullResponse }));
    }
  } catch (err) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'error', error: 'Gemini response failed' }));
    }
  }

  return fullResponse;
}

export async function generateTextGemini(prompt: string): Promise<string> {
  const model = getGeminiModel('gemini-1.5-pro');
  const result = await model.generateContent(prompt);
  return result.response.text();
}
