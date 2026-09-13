import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FieldGroup, FormField } from "@/components/ui/FormField";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { createProcessSchema } from "@/schemas/process";
import type { CreateProcessValues } from "@/schemas/process";
import { PROCESS_CATEGORIES, PROCESS_PRIORITIES } from "@/lib/constants";
import { useCreateProcess } from "@/features/processes/hooks";
import { toast } from "@/stores/toast-store";
import { ApiError } from "@/api/client";
import type { Process } from "@/types/domain";

interface ProcessFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (process: Process) => void;
}

export function ProcessFormDialog({ open, onOpenChange, onCreated }: ProcessFormDialogProps) {
  const { t } = useTranslation();
  const createProcess = useCreateProcess();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateProcessValues>({
    resolver: zodResolver(createProcessSchema),
    defaultValues: { title: "", category: "other", priority: "medium", description: "", deadline: "" },
  });

  useEffect(() => {
    if (open) reset({ title: "", category: "other", priority: "medium", description: "", deadline: "" });
  }, [open, reset]);

  async function onSubmit(values: CreateProcessValues) {
    try {
      const process = await createProcess.mutateAsync({
        ...values,
        description: values.description || null,
        deadline: values.deadline || null,
      });
      toast({ title: t("processes.createSuccess"), variant: "success" });
      onOpenChange(false);
      onCreated?.(process);
    } catch (error) {
      toast({
        title: t("processes.createError"),
        description: error instanceof ApiError ? error.message : undefined,
        variant: "danger",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t("processes.newProcess")}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <FormField label={t("processes.form.title")} required error={errors.title && t(errors.title.message ?? "")}>
              <Input {...register("title")} autoFocus />
            </FormField>

            <FormField label={t("processes.form.category")} required>
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

            <FormField label={t("processes.form.priority")}>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select {...field}>
                    {PROCESS_PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {t(`processes.priority.${priority}`)}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </FormField>

            <FormField label={t("processes.form.deadline")} hint={t("processes.form.deadlineHint")}>
              <Input type="date" {...register("deadline")} />
            </FormField>

            <FormField label={t("processes.form.description")}>
              <Textarea {...register("description")} rows={3} />
            </FormField>
          </FieldGroup>

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" isLoading={createProcess.isPending}>
              {t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
