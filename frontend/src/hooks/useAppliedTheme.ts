import { useEffect } from "react";
import { useUiStore } from "@/stores/ui-store";

/**
 * Applies the user's theme preference to <html class="dark">, resolving
 * "system" via prefers-color-scheme and staying in sync with OS changes.
 * Also applies the reduced-motion override class.
 */
export function useAppliedTheme(): void {
  const theme = useUiStore((s) => s.theme);
  const reducedMotion = useUiStore((s) => s.reducedMotion);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const isDark = theme === "dark" || (theme === "system" && mediaQuery.matches);
      root.classList.toggle("dark", isDark);
      root.classList.toggle("light", theme === "light");
    };

    apply();
    if (theme === "system") {
      mediaQuery.addEventListener("change", apply);
      return () => mediaQuery.removeEventListener("change", apply);
    }
    return undefined;
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reducedMotion);
  }, [reducedMotion]);
}
