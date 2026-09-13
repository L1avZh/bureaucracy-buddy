import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDocuments } from "@/features/documents/hooks";
import { useProcesses } from "@/features/processes/hooks";
import { useDebounce } from "@/hooks/useDebounce";
import { DocumentRow } from "@/components/documents/DocumentRow";
import { UploadDocumentDialog } from "@/components/documents/UploadDocumentDialog";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { PlusIcon, SearchIcon } from "@/components/ui/icons";
import { PROCESS_CATEGORIES } from "@/lib/constants";
import { ApiError } from "@/api/client";
import type { ProcessCategory } from "@/types/domain";

export function DocumentsPage() {
  const { t } = useTranslation();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ProcessCategory | "">("");
  const [processId, setProcessId] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const { data: processes } = useProcesses({ page_size: 100 });
  const { data, isLoading, isError, error, refetch } = useDocuments({
    q: debouncedQuery || undefined,
    category: category || undefined,
    process_id: processId || undefined,
  });

  const documents = data?.items ?? [];
  const hasFilters = Boolean(debouncedQuery || category || processId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-fg">{t("nav.documents")}</h1>
        <Button onClick={() => setUploadOpen(true)}>
          <PlusIcon className="h-4 w-4" /> {t("documents.upload")}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("documents.searchPlaceholder")}
            className="ps-9"
            aria-label={t("documents.searchPlaceholder")}
          />
        </div>
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
        <Select value={processId} onChange={(e) => setProcessId(e.target.value)} aria-label={t("documents.form.process")}>
          <option value="">{t("documents.allProcesses")}</option>
          {processes?.items.map((process) => (
            <option key={process.id} value={process.id}>
              {process.title}
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
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {!isLoading && !isError && documents.length === 0 && (
        <EmptyState
          icon={<span aria-hidden="true">📄</span>}
          title={hasFilters ? t("documents.noResultsTitle") : t("documents.emptyTitle")}
          description={hasFilters ? t("documents.noResultsDescription") : t("documents.emptyDescription")}
          action={
            !hasFilters && (
              <Button onClick={() => setUploadOpen(true)}>
                <PlusIcon className="h-4 w-4" /> {t("documents.upload")}
              </Button>
            )
          }
        />
      )}

      {!isLoading && !isError && documents.length > 0 && (
        <ul className="flex flex-col gap-2">
          {documents.map((document) => (
            <DocumentRow key={document.id} document={document} />
          ))}
        </ul>
      )}

      <UploadDocumentDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
