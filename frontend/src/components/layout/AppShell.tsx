import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { useLogout, useUpdateMe } from "@/features/auth/hooks";
import { CommandPalette } from "@/components/CommandPalette";
import { OfflineBanner } from "@/components/OfflineBanner";
import { Toaster } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from "@/components/ui/Dropdown";
import { cn } from "@/lib/cn";
import {
  FileIcon,
  MenuIcon,
  MonitorIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
  XIcon,
} from "@/components/ui/icons";
import type { Locale, ThemePreference } from "@/types/domain";

const NAV_ITEMS: Array<{ to: string; labelKey: string; exact?: boolean }> = [
  { to: "/", labelKey: "nav.dashboard", exact: true },
  { to: "/processes", labelKey: "nav.processes" },
  { to: "/documents", labelKey: "nav.documents" },
  { to: "/settings", labelKey: "nav.settings" },
];

export function AppShell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const locale = useUiStore((s) => s.locale);
  const setLocale = useUiStore((s) => s.setLocale);
  const updateMe = useUpdateMe();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleLocaleChange(next: Locale) {
    setLocale(next);
    // Persist server-side too — the local preference otherwise gets
    // silently overwritten by the server's stale value on the next session
    // restore (AuthBootstrap seeds locale/theme from GET /users/me).
    if (user) updateMe.mutate({ locale: next });
  }

  function handleThemeChange(next: ThemePreference) {
    setTheme(next);
    if (user) updateMe.mutate({ theme: next });
  }

  const themeIcon = theme === "dark" ? <MoonIcon /> : theme === "light" ? <SunIcon /> : <MonitorIcon />;

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <OfflineBanner />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-[200] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-fg"
      >
        {t("a11y.skipToContent")}
      </a>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface px-4">
        <button
          type="button"
          className="rounded-md p-2 text-fg hover:bg-surface-raised md:hidden"
          aria-label={t("nav.toggleMenu")}
          aria-expanded={mobileNavOpen}
          onClick={() => setMobileNavOpen((v) => !v)}
        >
          {mobileNavOpen ? <XIcon /> : <MenuIcon />}
        </button>
        <NavLink to="/" className="flex items-center gap-2 font-semibold text-fg">
          <span className="text-lg" aria-hidden="true">
            🗂️
          </span>
          <span className="hidden sm:inline">{t("app.name")}</span>
        </NavLink>

        <nav className="hidden gap-1 md:flex" aria-label={t("nav.primary")}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-fg-muted hover:text-fg hover:bg-surface-raised",
                  isActive && "bg-surface-raised text-fg",
                )
              }
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPaletteOpen(true)}
            aria-label={t("commandPalette.open")}
          >
            <SearchIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{t("commandPalette.searchButton")}</span>
            <kbd className="hidden rounded border border-border bg-bg px-1.5 py-0.5 text-xs sm:inline">
              {t("commandPalette.shortcut")}
            </kbd>
          </Button>

          <Dropdown>
            <DropdownTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("settings.appearance.theme")}>
                {themeIcon}
              </Button>
            </DropdownTrigger>
            <DropdownContent align="end">
              <DropdownLabel>{t("settings.appearance.theme")}</DropdownLabel>
              {(["light", "dark", "system"] as ThemePreference[]).map((option) => (
                <DropdownItem key={option} onSelect={() => handleThemeChange(option)}>
                  {option === "light" && <SunIcon className="h-4 w-4" />}
                  {option === "dark" && <MoonIcon className="h-4 w-4" />}
                  {option === "system" && <MonitorIcon className="h-4 w-4" />}
                  {t(`settings.appearance.themeOptions.${option}`)}
                  {theme === option && <span className="ms-auto text-primary">✓</span>}
                </DropdownItem>
              ))}
            </DropdownContent>
          </Dropdown>

          <Dropdown>
            <DropdownTrigger asChild>
              <Button variant="ghost" size="sm" aria-label={t("settings.general.language")}>
                {locale === "he" ? "עברית" : "EN"}
              </Button>
            </DropdownTrigger>
            <DropdownContent align="end">
              <DropdownItem onSelect={() => handleLocaleChange("en")}>English {locale === "en" && "✓"}</DropdownItem>
              <DropdownItem onSelect={() => handleLocaleChange("he")}>עברית {locale === "he" && "✓"}</DropdownItem>
            </DropdownContent>
          </Dropdown>

          <Dropdown>
            <DropdownTrigger asChild>
              <Button variant="ghost" size="sm">
                {user?.display_name ?? t("nav.account")}
              </Button>
            </DropdownTrigger>
            <DropdownContent align="end">
              <DropdownItem onSelect={() => navigate("/settings")}>
                <FileIcon className="h-4 w-4" /> {t("nav.settings")}
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem onSelect={() => logout.mutate()}>{t("auth.logout")}</DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      </header>

      {mobileNavOpen && (
        <nav className="border-b border-border bg-surface px-4 py-2 md:hidden" aria-label={t("nav.primary")}>
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-fg-muted hover:bg-surface-raised",
                    isActive && "bg-surface-raised text-fg",
                  )
                }
              >
                {t(item.labelKey)}
              </NavLink>
            ))}
          </div>
        </nav>
      )}

      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <Toaster />
    </div>
  );
}
