import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "@/stores/auth-store";

export function ProtectedRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg" aria-busy="true">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
