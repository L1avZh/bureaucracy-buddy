import { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FieldGroup, FormField } from "@/components/ui/FormField";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { documentUploadMetaSchema, ACCEPTED_DOCUMENT_CONTENT_TYPES, MAX_UPLOAD_BYTES } from "@/schemas/document";
import type { DocumentUploadMetaValues } from "@/schemas/document";
import { useUploadDocument } from "@/features/documents/hooks";
import { useProcesses } from "@/features/processes/hooks";
import { toast } from "@/stores/toast-store";
import { ApiError } from "@/api/client";
import { PROCESS_CATEGORIES } from "@/lib/constants";
import { formatFileSize } from "@/lib/format";
import { UploadIcon } from "@/components/ui/icons";

export function UploadDocumentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation();
  const upload = useUploadDocument();
  const { data: processes } = useProcesses({ page_size: 100 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<DocumentUploadMetaValues>({
    resolver: zodResolver(documentUploadMetaSchema),
    defaultValues: { title: "", category: "other", process_id: "", expires_at: "", notes: "" },
  });

  function handleFileChange(selected: File | null) {
    setFileError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (!ACCEPTED_DOCUMENT_CONTENT_TYPES.includes(selected.type as (typeof ACCEPTED_DOCUMENT_CONTENT_TYPES)[number])) {
      setFileError(t("documents.errors.unsupportedType"));
      setFile(null);
      return;
    }
    if (selected.size > MAX_UPLOAD_BYTES) {
      setFileError(t("documents.errors.tooLarge", { max: formatFileSize(MAX_UPLOAD_BYTES) }));
      setFile(null);
      return;
    }
    setFile(selected);
  }

  async function onSubmit(values: DocumentUploadMetaValues) {
    if (!file) {
      setFileError(t("documents.errors.fileRequired"));
      return;
    }
    try {
      await upload.mutateAsync({
        file,
        meta: { ...values, process_id: values.process_id || null, expires_at: values.expires_at || null },
      });
      toast({ title: t("documents.uploadSuccess"), variant: "success" });
      reset();
      setFile(null);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t("documents.uploadError"),
        description: error instanceof ApiError ? error.message : undefined,
        variant: "danger",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t("documents.uploadTitle")}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-fg">{t("documents.form.file")}</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-sm text-fg-muted hover:border-primary hover:text-fg"
              >
                <UploadIcon className="h-6 w-6" />
                {file ? (
                  <span className="text-fg">
                    {file.name} ({formatFileSize(file.size)})
                  </span>
                ) : (
                  <span>{t("documents.form.chooseFile")}</span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.heic"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-fg-subtle">{t("documents.form.acceptedTypes")}</p>
              {fileError && (
                <Alert variant="danger">{fileError}</Alert>
              )}
            </div>

            <FormField label={t("documents.form.title")} required error={errors.title && t(errors.title.message ?? "")}>
              <Input {...register("title")} />
            </FormField>

            <FormField label={t("documents.form.category")} required>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select {...field}>
                    {PROCESS_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {t(`processes.category.${category}`)}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </FormField>

            <FormField label={t("documents.form.process")} hint={t("documents.form.processHint")}>
              <Controller
                control={control}
                name="process_id"
                render={({ field }) => (
                  <Select {...field} value={field.value ?? ""}>
                    <option value="">{t("documents.form.noProcess")}</option>
                    {processes?.items.map((process) => (
                      <option key={process.id} value={process.id}>
                        {process.title}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </FormField>

            <FormField label={t("documents.form.expiresAt")}>
              <Input type="date" {...register("expires_at")} />
            </FormField>

            <FormField label={t("documents.form.notes")}>
              <Textarea {...register("notes")} rows={2} />
            </FormField>
          </FieldGroup>

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" isLoading={upload.isPending}>
              {t("documents.upload")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
