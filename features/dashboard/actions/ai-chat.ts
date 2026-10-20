'use server';

// Configuration metadata only. Shared credentials are resolved inside /api/completion.
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

export async function getSharedKeys() {
  const available = !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_MODEL);
  return {
    available,
    model: available ? process.env.OPENROUTER_MODEL : undefined,
  };
}
