import { create } from "zustand";
import type { User } from "@/types/models";

export const SESSION_HINT = "yatrik:session";
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  setAuth: (user, accessToken) => {
    try {
      localStorage.setItem(SESSION_HINT, "1");
    } catch {
      /* Authentication still works without storage. */
    }
    set({ user, accessToken, isAuthenticated: true, isLoading: false });
  },
  setAccessToken: (accessToken) => set({ accessToken }),
  clearAuth: () => {
    try {
      localStorage.removeItem(SESSION_HINT);
      localStorage.removeItem("atp_access_token");
      localStorage.removeItem("atp_refresh_token");
      localStorage.removeItem("atp_user");
      sessionStorage.removeItem("atp_access_token");
    } catch {
      /* Storage is optional. */
    }
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
  setLoading: (isLoading) => set({ isLoading }),
}));
