/**
 * Environment Configuration Helper
 * -------------------------
 * Loads and validates required environment variable GEMINI_API_KEY from (.env)
 * is available.
 *
 */

export function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key];

  if (!value) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Environment variable ${key} is not set`);
  }

  return value;
}

export function getGeminiApiKey(): string {
  return getEnvVar("GEMINI_API_KEY");
}
