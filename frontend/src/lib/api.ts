/**
 * SmartSeat AI — Axios API Client
 * Handles JWT auth, token refresh, and error normalization
 */
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { ApiError } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── Token Storage ──────────────────────────────────────────────────────────
// Stored in memory for the access token (security) + localStorage for refresh
let accessToken: string | null = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
  // Also write to cookie so Next.js middleware can read it for route protection
  if (typeof document !== "undefined") {
    if (token) {
      document.cookie = `access_token=${token}; path=/; SameSite=Strict`;
    } else {
      document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }
};

export const getRefreshToken = () =>
  typeof window !== "undefined"
    ? localStorage.getItem("refresh_token")
    : null;

export const setRefreshToken = (token: string | null) => {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("refresh_token", token);
  } else {
    localStorage.removeItem("refresh_token");
  }
};

export const clearTokens = () => {
  accessToken = null;
  setRefreshToken(null);
  // Clear the middleware cookie
  if (typeof document !== "undefined") {
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
};

// ─── Axios Instance ─────────────────────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// ─── Request Interceptor — attach Bearer token ──────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — handle 401 + token refresh ─────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      getRefreshToken()
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${token}`,
          };
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          { refresh_token: getRefreshToken() }
        );
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        processQueue(null, data.access_token);
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${data.access_token}`,
        };
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
        return Promise.reject(new Error("Session expired. Please log in again."));
      } finally {
        isRefreshing = false;
      }
    }

    // No refresh token + got 401 → clear session and redirect
    if (error.response?.status === 401) {
      clearTokens();
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
        // Return a never-resolving promise so react-query never sees the rejection
        return new Promise(() => {});
      }
    }

    // Normalize error — always throw a proper Error (not a plain object)
    const detail =
      (error.response?.data as { detail?: string | object })?.detail ||
      error.message ||
      "An unexpected error occurred";
    const message = typeof detail === "string" ? detail : JSON.stringify(detail);
    const apiError = new Error(message) as Error & { status_code?: number; detail?: string };
    apiError.status_code = error.response?.status;
    apiError.detail = message;
    return Promise.reject(apiError);
  }
);

// ─── API Helpers ────────────────────────────────────────────────────────────

export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    api.get<T>(url, config).then((r) => r.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.post<T>(url, data, config).then((r) => r.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.put<T>(url, data, config).then((r) => r.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.patch<T>(url, data, config).then((r) => r.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    api.delete<T>(url, config).then((r) => r.data),
};

export default api;
