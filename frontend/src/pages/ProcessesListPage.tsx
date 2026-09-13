import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useProcesses } from "@/features/processes/hooks";
import { useDebounce } from "@/hooks/useDebounce";
import { ProcessCard } from "@/components/process/ProcessCard";
import { ProcessFormDialog } from "@/components/process/ProcessFormDialog";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { PlusIcon, SearchIcon } from "@/components/ui/icons";
import { PROCESS_CATEGORIES, PROCESS_STATUSES } from "@/lib/constants";
import { ApiError } from "@/api/client";
import type { ProcessCategory, ProcessStatus } from "@/types/domain";

export function ProcessesListPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(searchParams.get("new") === "1");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ProcessStatus | "">("");
  const [category, setCategory] = useState<ProcessCategory | "">("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setCreateOpen(true);
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, isLoading, isError, error, refetch } = useProcesses({
    q: debouncedQuery || undefined,
    status: status || undefined,
    category: category || undefined,
    page_size: 50,
  });

  const processes = data?.items ?? [];
  const hasFilters = Boolean(debouncedQuery || status || category);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-fg">{t("nav.processes")}</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon className="h-4 w-4" /> {t("processes.newProcess")}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("processes.searchPlaceholder")}
            className="ps-9"
            aria-label={t("processes.searchPlaceholder")}
          />
        </div>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as ProcessStatus | "")}
          aria-label={t("processes.filterStatus")}
        >
          <option value="">{t("processes.allStatuses")}</option>
          {PROCESS_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`processes.status.${s}`)}
            </option>
          ))}
        </Select>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value as ProcessCategory | "")}
          aria-label={t("processes.filterCategory")}
        >
          <option value="">{t("processes.allCategories")}</option>
          {PROCESS_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`processes.category.${c}`)}
            </option>
          ))}
        </Select>
      </div>

      {isError && (
        <Alert variant="danger" title={t("errors.loadFailed")}>
          {error instanceof ApiError ? error.message : t("errors.genericMessage")}
          <div className="mt-2">
            <Button size="sm" variant="secondary" onClick={() => void refetch()}>
              {t("common.retry")}
            </Button>
          </div>
        </Alert>
      )}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      )}

      {!isLoading && !isError && processes.length === 0 && (
        <EmptyState
          icon={<span aria-hidden="true">🗂️</span>}
          title={hasFilters ? t("processes.noResultsTitle") : t("processes.emptyTitle")}
          description={hasFilters ? t("processes.noResultsDescription") : t("processes.emptyDescription")}
          action={
            !hasFilters && (
              <Button onClick={() => setCreateOpen(true)}>
                <PlusIcon className="h-4 w-4" /> {t("processes.newProcess")}
              </Button>
            )
          }
        />
      )}

      {!isLoading && !isError && processes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {processes.map((process) => (
            <ProcessCard key={process.id} process={process} />
          ))}
        </div>
      )}

      <ProcessFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
