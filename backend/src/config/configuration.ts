export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
  mobileRedirectUri:
    process.env.MOBILE_REDIRECT_URI ?? 'jobpulse://auth/callback',
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ??
      'http://localhost:3000/api/v1/auth/google/callback',
  },
  supabase: {
    url: process.env.SUPABASE_URL ?? '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  },
  tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY ?? '',
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  },
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  autoSync: {
    enabled: process.env.ENABLE_AUTO_SYNC_CRON !== 'false',
  },
  adminApiKey: process.env.ADMIN_API_KEY ?? '',
  androidRelease: {
    enabled: process.env.ANDROID_UPDATE_ENABLED === 'true',
    latestVersion: process.env.ANDROID_LATEST_VERSION ?? '1.0.0',
    latestBuildNumber: parseInt(process.env.ANDROID_LATEST_BUILD ?? '1', 10),
    apkUrl: process.env.ANDROID_APK_URL ?? '',
    releaseNotes: process.env.ANDROID_RELEASE_NOTES ?? '',
    forceUpdate: process.env.ANDROID_FORCE_UPDATE === 'true',
    minSupportedBuildNumber: parseInt(
      process.env.ANDROID_MIN_SUPPORTED_BUILD ?? '1',
      10,
    ),
  },
});
