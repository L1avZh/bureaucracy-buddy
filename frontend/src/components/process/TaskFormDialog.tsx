import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FieldGroup, FormField } from "@/components/ui/FormField";
import { Input, Textarea } from "@/components/ui/Input";
import { createTaskSchema } from "@/schemas/task";
import type { CreateTaskValues } from "@/schemas/task";
import { useCreateTask, useUpdateTask } from "@/features/tasks/hooks";
import { toast } from "@/stores/toast-store";
import { ApiError } from "@/api/client";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";
import type { Task } from "@/types/domain";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processId: string;
  /** When set, edits this task instead of creating a new one. */
  task?: Task;
}

export function TaskFormDialog({ open, onOpenChange, processId, task }: TaskFormDialogProps) {
  const { t } = useTranslation();
  const createTask = useCreateTask(processId);
  const updateTask = useUpdateTask(processId);
  const isEditing = Boolean(task);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateTaskValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { title: "", explanation: "", deadline: "", notes: "", external_links: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "external_links" });

  useEffect(() => {
    if (open) {
      reset(
        task
          ? {
              title: task.title,
              explanation: task.explanation ?? "",
              deadline: task.deadline ?? "",
              notes: task.notes ?? "",
              estimated_minutes: task.estimated_minutes ?? undefined,
              external_links: task.external_links,
            }
          : { title: "", explanation: "", deadline: "", notes: "", external_links: [] },
      );
    }
  }, [open, task, reset]);

  async function onSubmit(values: CreateTaskValues) {
    const payload = {
      ...values,
      explanation: values.explanation || null,
      deadline: values.deadline || null,
      notes: values.notes || null,
    };
    try {
      if (isEditing && task) {
        await updateTask.mutateAsync({ id: task.id, values: payload });
        toast({ title: t("tasks.updateSuccess"), variant: "success" });
      } else {
        await createTask.mutateAsync(payload);
        toast({ title: t("tasks.createSuccess"), variant: "success" });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: isEditing ? t("tasks.updateError") : t("tasks.createError"),
        description: error instanceof ApiError ? error.message : undefined,
        variant: "danger",
      });
    }
  }

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={isEditing ? t("tasks.editTask") : t("tasks.newTask")}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <FormField label={t("tasks.form.title")} required error={errors.title && t(errors.title.message ?? "")}>
              <Input {...register("title")} autoFocus />
            </FormField>

            <FormField label={t("tasks.form.explanation")} hint={t("tasks.form.explanationHint")}>
              <Textarea {...register("explanation")} rows={3} />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label={t("tasks.form.deadline")}>
                <Input type="date" {...register("deadline")} />
              </FormField>
              <FormField
                label={t("tasks.form.estimatedMinutes")}
                error={errors.estimated_minutes && t("tasks.errors.estimatedMinutesInvalid")}
              >
                <Input type="number" min={1} {...register("estimated_minutes", { valueAsNumber: true })} />
              </FormField>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-fg">{t("tasks.form.externalLinks")}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => append({ label: "", url: "" })}>
                  <PlusIcon className="h-4 w-4" /> {t("common.add")}
                </Button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input
                    placeholder={t("tasks.form.linkLabel")}
                    {...register(`external_links.${index}.label` as const)}
                    className="flex-1"
                  />
                  <Input
                    placeholder={t("tasks.form.linkUrl")}
                    {...register(`external_links.${index}.url` as const)}
                    className="flex-[2]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("common.remove")}
                    onClick={() => remove(index)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <FormField label={t("tasks.form.notes")}>
              <Textarea {...register("notes")} rows={2} />
            </FormField>
          </FieldGroup>

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" isLoading={isPending}>
              {isEditing ? t("common.saveChanges") : t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
