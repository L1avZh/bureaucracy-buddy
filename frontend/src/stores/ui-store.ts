import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale, ThemePreference } from "@/types/domain";

interface UiState {
  theme: ThemePreference;
  locale: Locale;
  reducedMotion: boolean;
  onboardingSeen: boolean;
  setTheme: (theme: ThemePreference) => void;
  setLocale: (locale: Locale) => void;
  setReducedMotion: (value: boolean) => void;
  markOnboardingSeen: () => void;
  resetOnboarding: () => void;
}

/**
 * Small, persisted UI-only preferences. Server data never lives here —
 * TanStack Query owns everything that comes from the API.
 */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: "system",
      locale: "en",
      reducedMotion: false,
      onboardingSeen: false,
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      markOnboardingSeen: () => set({ onboardingSeen: true }),
      resetOnboarding: () => set({ onboardingSeen: false }),
    }),
    { name: "bb-ui-preferences" },
  ),
);
