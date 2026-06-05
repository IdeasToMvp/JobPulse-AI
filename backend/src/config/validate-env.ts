const REQUIRED = [
  'JWT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TOKEN_ENCRYPTION_KEY',
] as const;

export function validateEnv(): void {
  if (process.env.NODE_ENV === 'test') return;

  const missing = REQUIRED.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  if (
    process.env.NODE_ENV === 'production' &&
    process.env.JWT_SECRET === 'change-me-in-production'
  ) {
    throw new Error('JWT_SECRET must be changed in production');
  }
}
