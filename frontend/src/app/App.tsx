import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "react-router";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { queryClient } from "@/lib/queryClient";
import { router } from "@/app/router";
import { AuthBootstrap } from "@/app/AuthBootstrap";
import { setOnAuthExpired } from "@/api/client";
import { useUiStore } from "@/stores/ui-store";
import { setAppLocale } from "@/lib/i18n";
import { useAppliedTheme } from "@/hooks/useAppliedTheme";

export function App() {
  const locale = useUiStore((s) => s.locale);
  // Applied at the app root (not inside AppShell) so unauthenticated pages
  // like /login and /register also respect the theme preference.
  useAppliedTheme();

  useEffect(() => {
    setOnAuthExpired(() => {
      void router.navigate("/login");
    });
  }, []);

  useEffect(() => {
    setAppLocale(locale);
  }, [locale]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthBootstrap>
          <RouterProvider router={router} />
        </AuthBootstrap>
      </TooltipProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
