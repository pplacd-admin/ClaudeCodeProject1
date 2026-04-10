// Replace with your deployed backend URL
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
export const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000/api/v1/voice/chat';

export const DAILY_LEARNING_GOAL_MINUTES = 60;
export const LOGOFF_HOUR = 17; // 5PM
export const LOGOFF_REMINDER_HOUR = 16; // 4:45PM reminder
export const MORNING_BRIEF_HOUR = 7;
