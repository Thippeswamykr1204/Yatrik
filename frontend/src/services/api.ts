import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_URL } from "@/lib/constants";
import { useAuthStore } from "@/store/authStore";
import type { ApiResponse } from "@/types/api";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});
let refreshPromise: Promise<string> | null = null;

export function refreshSession(): Promise<string> {
  if (!refreshPromise) {
    const rotate = async () => {
      const { data } = await axios.post<{ data: { accessToken: string } }>(
        `${API_URL}/api/auth/refresh`,
        undefined,
        { withCredentials: true, timeout: 15000 },
      );
      useAuthStore.getState().setAccessToken(data.data.accessToken);
      return data.data.accessToken;
    };
    // Serialize across same-origin tabs as well as requests in this tab. Each
    // refresh cookie is single-use, so concurrent rotations would invalidate one.
    const withLock = async (): Promise<string> => {
      if (typeof navigator !== "undefined" && navigator.locks) {
        return await navigator.locks.request("yatrik-session-refresh", rotate);
      }
      return rotate();
    };
    refreshPromise = withLock().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const original = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthAction = /^\/auth\/(login|register|refresh)/.test(
      original?.url || "",
    );
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isAuthAction
    ) {
      original._retry = true;
      try {
        original.headers.Authorization = `Bearer ${await refreshSession()}`;
        return api(original);
      } catch {
        useAuthStore.getState().clearAuth();
      }
    }
    return Promise.reject(error);
  },
);
export function errorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (!error.response)
      return "We couldn’t reach Yatrik. Check your connection and try again.";
    if (error.response.status === 429)
      return "A little breather. You’ve reached the request limit; please try again shortly.";
    return error.response.data?.message || fallback;
  }
  return fallback;
}
export default api;
