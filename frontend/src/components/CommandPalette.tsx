import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useSearch } from "@/features/search/hooks";
import { useDebounce } from "@/hooks/useDebounce";
import { useUiStore } from "@/stores/ui-store";
import { useExportJson } from "@/features/export/hooks";
import {
  ClockIcon,
  DownloadIcon,
  FileIcon,
  MoonIcon,
  PlusIcon,
  SearchIcon,
  SunIcon,
} from "@/components/ui/icons";
import type { SearchResultItem } from "@/types/domain";

const typeToRoute: Record<SearchResultItem["type"], (id: string) => string> = {
  process: (id) => `/processes/${id}`,
  task: (id) => `/processes/${id}`, // tasks route to their parent process detail; id here is the task's process context in real usage
  document: () => `/documents`,
  note: () => `/processes`,
  source: () => `/settings`,
};

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);
  const { data: results, isFetching } = useSearch(debouncedQuery);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const exportJson = useExportJson();

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  function go(path: string) {
    onOpenChange(false);
    navigate(path);
  }

  const groups: Array<{ key: keyof NonNullable<typeof results>; label: string }> = [
    { key: "processes", label: t("search.groups.processes") },
    { key: "tasks", label: t("search.groups.tasks") },
    { key: "documents", label: t("search.groups.documents") },
    { key: "notes", label: t("search.groups.notes") },
    { key: "sources", label: t("search.groups.sources") },
  ];

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label={t("commandPalette.label")}
      className="fixed start-1/2 top-24 z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-surface shadow-lg animate-scale-in"
      shouldFilter={false}
    >
      <div className="flex items-center gap-2 border-b border-border px-4">
        <SearchIcon className="h-4 w-4 flex-shrink-0 text-fg-subtle" />
        <Command.Input
          autoFocus
          value={query}
          onValueChange={setQuery}
          placeholder={t("commandPalette.placeholder")}
          className="h-12 w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
        />
      </div>
      <Command.List className="max-h-96 overflow-y-auto p-2">
        <Command.Empty className="px-3 py-6 text-center text-sm text-fg-muted">
          {isFetching ? t("commandPalette.searching") : t("commandPalette.noResults")}
        </Command.Empty>

        {!query && (
          <Command.Group heading={t("commandPalette.actions")} className="text-xs font-medium text-fg-subtle [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
            <Command.Item
              onSelect={() => go("/processes?new=1")}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-fg data-[selected=true]:bg-surface-raised"
            >
              <PlusIcon className="h-4 w-4" /> {t("commandPalette.newProcess")}
            </Command.Item>
            <Command.Item
              onSelect={() => go("/processes")}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-fg data-[selected=true]:bg-surface-raised"
            >
              <PlusIcon className="h-4 w-4" /> {t("commandPalette.newTask")}
            </Command.Item>
            <Command.Item
              onSelect={() => go("/settings")}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-fg data-[selected=true]:bg-surface-raised"
            >
              <FileIcon className="h-4 w-4" /> {t("commandPalette.openSettings")}
            </Command.Item>
            <Command.Item
              onSelect={() => {
                setTheme(theme === "dark" ? "light" : "dark");
                onOpenChange(false);
              }}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-fg data-[selected=true]:bg-surface-raised"
            >
              {theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
              {t("commandPalette.toggleTheme")}
            </Command.Item>
            <Command.Item
              onSelect={() => {
                onOpenChange(false);
                exportJson.mutate();
              }}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-fg data-[selected=true]:bg-surface-raised"
            >
              <DownloadIcon className="h-4 w-4" /> {t("commandPalette.exportData")}
            </Command.Item>
            <Command.Item
              onSelect={() => go("/?focus=deadlines")}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-fg data-[selected=true]:bg-surface-raised"
            >
              <ClockIcon className="h-4 w-4" /> {t("commandPalette.showDeadlines")}
            </Command.Item>
          </Command.Group>
        )}

        {query &&
          results &&
          groups.map((group) => {
            const items = results[group.key];
            if (!items || items.length === 0) return null;
            return (
              <Command.Group
                key={group.key}
                heading={group.label}
                className="text-xs font-medium text-fg-subtle [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
              >
                {items.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={`${group.key}-${item.id}`}
                    onSelect={() => go(typeToRoute[item.type](item.id))}
                    className="flex cursor-pointer flex-col items-start gap-0.5 rounded-md px-2.5 py-2 text-sm text-fg data-[selected=true]:bg-surface-raised"
                  >
                    <span className="font-medium">{item.title}</span>
                    {item.snippet && <span className="text-xs text-fg-muted line-clamp-1">{item.snippet}</span>}
                  </Command.Item>
                ))}
              </Command.Group>
            );
          })}
      </Command.List>
    </Command.Dialog>
  );
}
