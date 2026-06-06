const TOKEN_KEY = "jobpulse_access_token";

export const tokenStorage = {
  save(token: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
  },

  read(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
  },
};
