import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Document } from "@/types/domain";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DownloadIcon, FileIcon, TrashIcon } from "@/components/ui/icons";
import { formatDate, formatFileSize, deadlineUrgency } from "@/lib/format";
import { useUiStore } from "@/stores/ui-store";
import { useDeleteDocument, useDownloadDocument } from "@/features/documents/hooks";
import { toast } from "@/stores/toast-store";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { cn } from "@/lib/cn";
import type { BadgeVariant } from "@/components/ui/Badge";

const urgencyBadge: Record<string, BadgeVariant> = {
  overdue: "danger",
  urgent: "warning",
  soon: "info",
  normal: "neutral",
  none: "neutral",
};

export function DocumentRow({ document: doc }: { document: Document }) {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteDocument = useDeleteDocument();
  const download = useDownloadDocument();
  const urgency = deadlineUrgency(doc.expires_at);

  async function handleDelete() {
    try {
      await deleteDocument.mutateAsync(doc.id);
      toast({ title: t("documents.deleteSuccess"), variant: "success" });
    } catch {
      toast({ title: t("documents.deleteError"), variant: "danger" });
    } finally {
      setConfirmDelete(false);
    }
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
      <FileIcon className="h-8 w-8 flex-shrink-0 text-fg-subtle" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-fg">{doc.title}</p>
        <p className="truncate text-xs text-fg-muted">
          {doc.original_filename} · {formatFileSize(doc.size_bytes)} · {formatDate(doc.uploaded_at, locale)}
        </p>
      </div>
      <Badge variant="neutral" className="hidden sm:inline-flex">
        {t(`processes.category.${doc.category}`, doc.category)}
      </Badge>
      {doc.expires_at && (
        <Badge variant={urgencyBadge[urgency]} className={cn(urgency === "overdue" && "font-semibold")}>
          {urgency === "overdue" ? t("documents.expired") : t("documents.expires")}: {formatDate(doc.expires_at, locale)}
        </Badge>
      )}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("documents.download")}
          isLoading={download.isPending}
          onClick={() => download.mutate({ id: doc.id, filename: doc.original_filename })}
        >
          <DownloadIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label={t("common.delete")} onClick={() => setConfirmDelete(true)}>
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("documents.deleteConfirmTitle")}
        description={t("documents.deleteConfirmDescription", { title: doc.title })}
        isLoading={deleteDocument.isPending}
        onConfirm={handleDelete}
      />
    </li>
  );
}
