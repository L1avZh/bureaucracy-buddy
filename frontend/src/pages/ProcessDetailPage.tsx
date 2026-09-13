import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useProcess, useUpdateProcess, useDeleteProcess } from "@/features/processes/hooks";
import { useTasks } from "@/features/tasks/hooks";
import { useCreateNote, useDeleteNote, useNotes, useUpdateNote } from "@/features/notes/hooks";
import { TaskRow } from "@/components/process/TaskRow";
import { TaskFormDialog } from "@/components/process/TaskFormDialog";
import { AiAssistantDialog } from "@/components/process/AiAssistantDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlusIcon, SparklesIcon, TrashIcon, EditIcon } from "@/components/ui/icons";
import { PRIORITY_BADGE_VARIANT, PROCESS_PRIORITIES, PROCESS_STATUSES, STATUS_BADGE_VARIANT, CATEGORY_EMOJI } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { useUiStore } from "@/stores/ui-store";
import { toast } from "@/stores/toast-store";
import { ApiError } from "@/api/client";
import type { ProcessPriority, ProcessStatus, Task } from "@/types/domain";

export function ProcessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const locale = useUiStore((s) => s.locale);

  const { data: process, isLoading, isError, error, refetch } = useProcess(id);
  const { data: tasks, isLoading: tasksLoading } = useTasks(id);
  const { data: notes } = useNotes({ process_id: id });
  const updateProcess = useUpdateProcess(id ?? "");
  const deleteProcess = useDeleteProcess();
  const createNote = useCreateNote({ process_id: id });
  const updateNote = useUpdateNote({ process_id: id });
  const deleteNote = useDeleteNote({ process_id: id });

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [aiOpen, setAiOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteBody, setEditingNoteBody] = useState("");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !process) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <Alert variant="danger" title={notFound ? t("processes.notFoundTitle") : t("errors.loadFailed")}>
        {notFound
          ? t("processes.notFoundDescription")
          : error instanceof ApiError
            ? error.message
            : t("errors.genericMessage")}
        <div className="mt-2 flex gap-2">
          {!notFound && (
            <Button size="sm" variant="secondary" onClick={() => void refetch()}>
              {t("common.retry")}
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => navigate("/processes")}>
            {t("processes.backToList")}
          </Button>
        </div>
      </Alert>
    );
  }

  async function handleDelete() {
    try {
      await deleteProcess.mutateAsync(process!.id);
      toast({ title: t("processes.deleteSuccess"), variant: "success" });
      navigate("/processes");
    } catch {
      toast({ title: t("processes.deleteError"), variant: "danger" });
      setConfirmDelete(false);
    }
  }

  async function handleAddNote() {
    if (!noteDraft.trim()) return;
    try {
      await createNote.mutateAsync({ process_id: id, body: noteDraft.trim() });
      setNoteDraft("");
    } catch {
      toast({ title: t("notes.createError"), variant: "danger" });
    }
  }

  async function handleSaveNote(noteId: string) {
    try {
      await updateNote.mutateAsync({ id: noteId, values: { body: editingNoteBody } });
      setEditingNoteId(null);
    } catch {
      toast({ title: t("notes.updateError"), variant: "danger" });
    }
  }

  const sortedTasks = [...(tasks ?? [])].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/processes" className="text-sm text-fg-muted hover:underline">
          {t("processes.backToList")}
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">
              {CATEGORY_EMOJI[process.category]}
            </span>
            <h1 className="text-2xl font-semibold text-fg">{process.title}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setAiOpen(true)}>
              <SparklesIcon className="h-4 w-4" /> {t("ai.assistantTitle")}
            </Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <TrashIcon className="h-4 w-4" /> {t("common.delete")}
            </Button>
          </div>
        </div>
        {process.description && <p className="mt-2 text-fg-muted">{process.description}</p>}
      </div>

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-fg-subtle">{t("processes.form.status")}</span>
            <Select
              value={process.status}
              onChange={(e) =>
                updateProcess.mutate(
                  { status: e.target.value as ProcessStatus },
                  { onError: () => toast({ title: t("processes.updateError"), variant: "danger" }) },
                )
              }
              aria-label={t("processes.form.status")}
            >
              {PROCESS_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`processes.status.${status}`)}
                </option>
              ))}
            </Select>
            <Badge variant={STATUS_BADGE_VARIANT[process.status]} className="w-fit">
              {t(`processes.status.${process.status}`)}
            </Badge>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-fg-subtle">{t("processes.form.priority")}</span>
            <Select
              value={process.priority}
              onChange={(e) =>
                updateProcess.mutate(
                  { priority: e.target.value as ProcessPriority },
                  { onError: () => toast({ title: t("processes.updateError"), variant: "danger" }) },
                )
              }
              aria-label={t("processes.form.priority")}
            >
              {PROCESS_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {t(`processes.priority.${priority}`)}
                </option>
              ))}
            </Select>
            <Badge variant={PRIORITY_BADGE_VARIANT[process.priority]} className="w-fit">
              {t(`processes.priority.${process.priority}`)}
            </Badge>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-fg-subtle">{t("processes.form.deadline")}</span>
            <Input
              type="date"
              value={process.deadline ?? ""}
              onChange={(e) =>
                updateProcess.mutate(
                  { deadline: e.target.value || null },
                  { onError: () => toast({ title: t("processes.updateError"), variant: "danger" }) },
                )
              }
              aria-label={t("processes.form.deadline")}
            />
            {process.deadline && <span className="text-xs text-fg-muted">{formatDate(process.deadline, locale)}</span>}
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="tasks-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="tasks-heading" className="text-lg font-semibold text-fg">
            {t("processes.checklist")}
          </h2>
          <Button
            size="sm"
            onClick={() => {
              setEditingTask(undefined);
              setTaskDialogOpen(true);
            }}
          >
            <PlusIcon className="h-4 w-4" /> {t("tasks.newTask")}
          </Button>
        </div>

        {tasksLoading && <Skeleton className="h-32 w-full" />}

        {!tasksLoading && sortedTasks.length === 0 && (
          <EmptyState title={t("processes.noTasksTitle")} description={t("processes.noTasksDescription")} />
        )}

        {!tasksLoading && sortedTasks.length > 0 && (
          <ul className="flex flex-col gap-2">
            {sortedTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                processId={process.id}
                onEdit={() => {
                  setEditingTask(task);
                  setTaskDialogOpen(true);
                }}
              />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="notes-heading">
        <Card>
          <CardHeader>
            <CardTitle id="notes-heading">{t("notes.title")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {notes && notes.length > 0 && (
              <ul className="flex flex-col gap-2">
                {notes.map((note) => (
                  <li key={note.id} className="rounded-md border border-border p-3 text-sm">
                    {editingNoteId === note.id ? (
                      <div className="flex flex-col gap-2">
                        <Textarea value={editingNoteBody} onChange={(e) => setEditingNoteBody(e.target.value)} rows={2} />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => setEditingNoteId(null)}>
                            {t("common.cancel")}
                          </Button>
                          <Button size="sm" onClick={() => void handleSaveNote(note.id)} isLoading={updateNote.isPending}>
                            {t("common.saveChanges")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <p className="whitespace-pre-wrap text-fg">{note.body}</p>
                        <div className="flex flex-shrink-0 gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t("common.edit")}
                            onClick={() => {
                              setEditingNoteId(note.id);
                              setEditingNoteBody(note.body);
                            }}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t("common.delete")}
                            onClick={() => deleteNote.mutate(note.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-col gap-2">
              <Textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder={t("notes.addPlaceholder")}
                rows={2}
                aria-label={t("notes.addPlaceholder")}
              />
              <Button
                size="sm"
                className="self-end"
                onClick={() => void handleAddNote()}
                isLoading={createNote.isPending}
                disabled={!noteDraft.trim()}
              >
                {t("notes.add")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <TaskFormDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} processId={process.id} task={editingTask} />
      <AiAssistantDialog open={aiOpen} onOpenChange={setAiOpen} process={process} />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("processes.deleteConfirmTitle")}
        description={t("processes.deleteConfirmDescription", { title: process.title })}
        isLoading={deleteProcess.isPending}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
