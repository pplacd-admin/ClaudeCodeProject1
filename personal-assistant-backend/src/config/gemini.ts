import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env';

export const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || '');

export function getGeminiModel(modelName = 'gemini-1.5-pro') {
  return genAI.getGenerativeModel({ model: modelName });
}
