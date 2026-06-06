import { apiRequest } from "@/lib/api/client";
import { getOAuthCallbackUrl } from "@/lib/config";
import type { AuthSession, UserProfile } from "@/lib/types/user";

export async function getGoogleAuthUrl(): Promise<string> {
  const clientRedirectUri = encodeURIComponent(getOAuthCallbackUrl());
  const data = await apiRequest<{ authUrl: string }>(
    `/auth/google/url?clientRedirectUri=${clientRedirectUri}`,
  );

  if (!data.authUrl) {
    throw new Error("Invalid auth URL from server");
  }

  return data.authUrl;
}

export async function fetchCurrentUser(
  token?: string,
): Promise<UserProfile> {
  const data = await apiRequest<{ user: UserProfile }>("/auth/me", { token });
  if (!data.user) {
    throw new Error("Invalid user profile from server");
  }
  return data.user;
}

export async function logout(token?: string): Promise<void> {
  await apiRequest("/auth/logout", { method: "POST", token });
}

export type { AuthSession };
