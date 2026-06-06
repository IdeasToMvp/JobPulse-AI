const productionApiBaseUrl =
  "https://jobpulse-ai-production.up.railway.app/api/v1";

export const appConfig = {
  productionApiBaseUrl,
  localApiBaseUrl: "http://127.0.0.1:3000/api/v1",
  oauthCallbackPath: "/auth/callback",
} as const;

export function getApiBaseUrl(): string {
  const override = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (override) return override;

  if (process.env.NODE_ENV === "production") {
    return productionApiBaseUrl;
  }

  return appConfig.localApiBaseUrl;
}

export function getOAuthCallbackUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${appConfig.oauthCallbackPath}`;
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  return `${siteUrl}${appConfig.oauthCallbackPath}`;
}
