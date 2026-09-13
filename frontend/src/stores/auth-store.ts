import { create } from "zustand";
import type { User } from "@/types/domain";

/**
 * Auth state lives in memory only — never localStorage/sessionStorage.
 * The access token is short-lived and reissued via the httpOnly refresh
 * cookie (see src/api/client.ts), so losing it on a hard refresh is
 * expected: the client silently re-authenticates from the cookie on boot.
 */
interface AuthState {
  user: User | null;
  accessToken: string | null;
  /** Whether we've finished the initial "try to restore session" check. */
  isInitializing: boolean;
  setSession: (user: User, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clear: () => void;
  finishInitializing: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isInitializing: true,
  setSession: (user, accessToken) => set({ user, accessToken, isInitializing: false }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clear: () => set({ user: null, accessToken: null, isInitializing: false }),
  finishInitializing: () => set({ isInitializing: false }),
}));

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}
