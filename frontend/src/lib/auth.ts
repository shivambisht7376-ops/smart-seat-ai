/**
 * SmartSeat AI — Auth API functions
 */
import { apiClient, setAccessToken, setRefreshToken, clearTokens } from "@/lib/api";
import type { AuthTokens, LoginCredentials, CurrentUser } from "@/types";

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthTokens> => {
    const data = await apiClient.post<AuthTokens>("/auth/login", credentials);
    // Store tokens
    setAccessToken(data.access_token);
    setRefreshToken(data.refresh_token);
    return data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      clearTokens();
    }
  },

  me: async (): Promise<CurrentUser> => {
    return apiClient.get<CurrentUser>("/auth/me");
  },

  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    return apiClient.post<AuthTokens>("/auth/refresh", {
      refresh_token: refreshToken,
    });
  },
};
