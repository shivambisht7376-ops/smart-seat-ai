/**
 * SmartSeat AI — Auth Zustand Store
 * Manages current user, login/logout, and session initialization.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CurrentUser, RoleName } from "@/types";
import { authApi } from "@/lib/auth";
import { setAccessToken, setRefreshToken, clearTokens } from "@/lib/api";

interface AuthState {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.login({ email, password });
          const user = await authApi.me();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err: unknown) {
          const message =
            (err as { detail?: string; message?: string })?.detail ||
            (err as { message?: string })?.message ||
            "Login failed. Please check your credentials.";
          set({ error: message, isLoading: false, isAuthenticated: false });
          // Throw a proper Error, not a plain object
          throw new Error(message);
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } finally {
          clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      fetchMe: async () => {
        set({ isLoading: true });
        try {
          const user = await authApi.me();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "smartseat-auth",
      storage: createJSONStorage(() => sessionStorage),
      // Only persist the user object — tokens are managed separately
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// ─── Selectors ────────────────────────────────────────────────────────────────
export const useCurrentUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);

export const useHasRole = (...roles: RoleName[]) => {
  const user = useAuthStore((s) => s.user);
  const roleName = user?.role?.name as RoleName | undefined;
  return roleName ? roles.includes(roleName) : false;
};

export const useIsSuperAdmin = () => useHasRole("super_admin");
export const useIsHRAdmin = () => useHasRole("super_admin", "hr_admin");
export const useIsProjectManager = () =>
  useHasRole("super_admin", "hr_admin", "project_manager");
