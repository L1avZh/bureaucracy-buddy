import { Navigate, Outlet } from "react-router";
import { useUiStore } from "@/stores/ui-store";

/** Sends first-time users to onboarding right after they land in the app shell. */
export function RequireOnboarding() {
  const onboardingSeen = useUiStore((s) => s.onboardingSeen);
  if (!onboardingSeen) {
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
}
