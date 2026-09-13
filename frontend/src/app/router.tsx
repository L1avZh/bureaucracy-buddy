import { lazy, Suspense } from "react";
import type { ComponentType } from "react";
import { createBrowserRouter } from "react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import { AppShell } from "@/components/layout/AppShell";
import { PageFallback } from "@/components/PageFallback";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";

// Everything reachable only after auth is code-split per page, so the
// login/register bundle (what a signed-out visitor actually downloads)
// stays small. React.lazy + Suspense (rather than route.lazy) keeps each
// page module a plain named export.
function lazyPage<P extends object>(loader: () => Promise<{ [key: string]: ComponentType<P> }>, exportName: string) {
  const LazyComponent = lazy(() => loader().then((module) => ({ default: module[exportName] })));
  return function LazyPage(props: P) {
    return (
      <Suspense fallback={<PageFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

const OnboardingPage = lazyPage(() => import("@/pages/OnboardingPage"), "OnboardingPage");
const DashboardPage = lazyPage(() => import("@/pages/DashboardPage"), "DashboardPage");
const ProcessesListPage = lazyPage(() => import("@/pages/ProcessesListPage"), "ProcessesListPage");
const ProcessDetailPage = lazyPage(() => import("@/pages/ProcessDetailPage"), "ProcessDetailPage");
const DocumentsPage = lazyPage(() => import("@/pages/DocumentsPage"), "DocumentsPage");
const SettingsPage = lazyPage(() => import("@/pages/SettingsPage"), "SettingsPage");
const NotFoundPage = lazyPage(() => import("@/pages/NotFoundPage"), "NotFoundPage");

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/onboarding", element: <OnboardingPage /> },
      {
        element: <RequireOnboarding />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: "/", element: <DashboardPage /> },
              { path: "/processes", element: <ProcessesListPage /> },
              { path: "/processes/:id", element: <ProcessDetailPage /> },
              { path: "/documents", element: <DocumentsPage /> },
              { path: "/settings", element: <SettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
