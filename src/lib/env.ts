/**
 * Utility functions for safely accessing environment variables
 */

export function getEnvVar(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getEnvVarOptional(key: keyof ImportMetaEnv, defaultValue?: string): string | undefined {
  return import.meta.env[key] || defaultValue;
}

// Pre-validated environment variables
export const env = {
  CLERK_PUBLISHABLE_KEY: getEnvVar('VITE_CLERK_PUBLISHABLE_KEY'),
  OPENAI_API_KEY: getEnvVar('VITE_OPENAI_API_KEY'),
  OPENAI_API_URL: getEnvVarOptional('VITE_OPENAI_API_URL', 'https://ai-api.enzonic.me/api/v1/chat/completions'),
  API_URL: getEnvVarOptional('VITE_API_URL', 'http://localhost:8080'),
} as const;