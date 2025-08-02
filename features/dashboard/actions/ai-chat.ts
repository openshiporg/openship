'use server';

import { getBaseUrl } from '@/features/dashboard/lib/getBaseUrl';

interface LocalKeys {
  apiKey: string;
  model: string;
  maxTokens: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Check if shared keys ENV variables are configured
export async function checkSharedKeysAvailable() {
  return {
    available: !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_MODEL),
    missing: {
      apiKey: !process.env.OPENROUTER_API_KEY,
      model: !process.env.OPENROUTER_MODEL,
      maxTokens: !process.env.OPENROUTER_MAX_TOKENS,
    }
  };
}

// Server action to get shared keys (returns plain object)
export async function getSharedKeys() {
  if (!process.env.OPENROUTER_API_KEY) {
    return {
      success: false,
      error: 'OPENROUTER_API_KEY is not configured'
    };
  }
  if (!process.env.OPENROUTER_MODEL) {
    return {
      success: false,
      error: 'OPENROUTER_MODEL is not configured'
    };
  }
  
  return {
    success: true,
    keys: {
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL,
      maxTokens: process.env.OPENROUTER_MAX_TOKENS ? parseInt(process.env.OPENROUTER_MAX_TOKENS) : 4000,
    }
  };
}