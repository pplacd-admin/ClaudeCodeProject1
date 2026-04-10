import { create } from 'zustand';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
export type AIProvider = 'claude' | 'gemini';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface VoiceStore {
  state: VoiceState;
  aiProvider: AIProvider;
  messages: Message[];
  currentTranscript: string;
  currentResponse: string;
  setState: (state: VoiceState) => void;
  setAIProvider: (provider: AIProvider) => void;
  addMessage: (message: Message) => void;
  setCurrentTranscript: (text: string) => void;
  setCurrentResponse: (text: string) => void;
  appendToResponse: (delta: string) => void;
  clearConversation: () => void;
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  state: 'idle',
  aiProvider: 'claude',
  messages: [],
  currentTranscript: '',
  currentResponse: '',
  setState: (state) => set({ state }),
  setAIProvider: (aiProvider) => set({ aiProvider }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  setCurrentTranscript: (currentTranscript) => set({ currentTranscript }),
  setCurrentResponse: (currentResponse) => set({ currentResponse }),
  appendToResponse: (delta) => set((s) => ({ currentResponse: s.currentResponse + delta })),
  clearConversation: () => set({ messages: [], currentResponse: '', currentTranscript: '' }),
}));
