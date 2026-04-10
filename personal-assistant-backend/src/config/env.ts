import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  ANTHROPIC_API_KEY: z.string(),
  GEMINI_API_KEY: z.string(),
  OPENAI_API_KEY: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string().default('http://localhost:3000/api/v1/email/oauth/callback'),
  FIREBASE_PROJECT_ID: z.string(),
  FIREBASE_SERVICE_ACCOUNT_KEY: z.string(), // JSON string of service account key
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Missing required environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  // In dev, warn but don't crash so we can build incrementally
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export const env = parsed.success ? parsed.data : ({} as z.infer<typeof envSchema>);
