import { useEffect } from "react";
import type { ReactNode } from "react";
import * as authApi from "@/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";

/**
 * On first load there is no access token in memory (by design — see
 * auth-store.ts), but a valid httpOnly refresh cookie may still exist from
 * a previous session. Try to silently trade it for a fresh access token
 * before the router decides whether the user is authenticated, so a page
 * reload doesn't bounce a logged-in user to /login.
 */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession);
  const finishInitializing = useAuthStore((s) => s.finishInitializing);
  const setLocale = useUiStore((s) => s.setLocale);
  const setTheme = useUiStore((s) => s.setTheme);

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      try {
        const { access_token } = await authApi.refresh();
        if (cancelled) return;
        useAuthStore.getState().setAccessToken(access_token);
        const user = await authApi.getMe();
        if (cancelled) return;
        setSession(user, access_token);
        setLocale(user.locale);
        setTheme(user.theme);
      } catch {
        // No valid session to restore — that's the normal logged-out state.
      } finally {
        if (!cancelled) finishInitializing();
      }
    }
    void restore();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
