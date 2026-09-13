import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { SparklesIcon, PlusIcon } from "@/components/ui/icons";
import { useAiChat, useGenerateChecklist } from "@/features/ai/hooks";
import { useCreateTask } from "@/features/tasks/hooks";
import { useSources } from "@/features/sources/hooks";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/cn";
import type { AiChecklistResponse, AiMessage } from "@/types/domain";
import type { Process } from "@/types/domain";

const QUICK_ACTION_KEYS = [
  "explain",
  "whatsNext",
  "createChecklist",
  "summarize",
  "findMissingInfo",
  "prepareQuestions",
] as const;

type QuickActionKey = (typeof QUICK_ACTION_KEYS)[number];

export function AiAssistantDialog({
  open,
  onOpenChange,
  process,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  process: Process;
}) {
  const { t } = useTranslation();
  const chat = useAiChat();
  const generateChecklist = useGenerateChecklist();
  const createTask = useCreateTask(process.id);
  const { data: officialSources } = useSources({ category: process.category });
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<Array<AiMessage & { provider?: string; disclaimer?: string }>>([]);
  const [checklistSuggestion, setChecklistSuggestion] = useState<AiChecklistResponse | null>(null);
  const [input, setInput] = useState("");

  async function sendMessage(message: string) {
    setMessages((prev) => [...prev, { role: "user", content: message, created_at: new Date().toISOString() }]);
    setInput("");
    try {
      const response = await chat.mutateAsync({ conversation_id: conversationId, process_id: process.id, message });
      setConversationId(response.conversation_id);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.reply,
          created_at: new Date().toISOString(),
          provider: response.provider,
          disclaimer: response.disclaimer,
        },
      ]);
    } catch {
      toast({ title: t("ai.errors.requestFailed"), variant: "danger" });
    }
  }

  async function runQuickAction(key: QuickActionKey) {
    if (key === "createChecklist") {
      try {
        const result = await generateChecklist.mutateAsync({ goal: process.title, category: process.category });
        setChecklistSuggestion(result);
      } catch {
        toast({ title: t("ai.errors.requestFailed"), variant: "danger" });
      }
      return;
    }
    await sendMessage(t(`ai.quickActionPrompts.${key}`, { title: process.title }));
  }

  async function acceptChecklist() {
    if (!checklistSuggestion) return;
    try {
      await Promise.all(
        checklistSuggestion.tasks.map((task) =>
          createTask.mutateAsync({ title: task.title, explanation: task.explanation }),
        ),
      );
      toast({ title: t("ai.checklistAdded", { count: checklistSuggestion.tasks.length }), variant: "success" });
      setChecklistSuggestion(null);
    } catch {
      toast({ title: t("ai.errors.requestFailed"), variant: "danger" });
    }
  }

  function handleClose(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setMessages([]);
      setConversationId(undefined);
      setChecklistSuggestion(null);
      setInput("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent title={t("ai.assistantTitle")} description={t("ai.assistantDescription")} className="max-w-2xl">
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTION_KEYS.map((key) => (
            <Button
              key={key}
              variant="secondary"
              size="sm"
              onClick={() => void runQuickAction(key)}
              isLoading={key === "createChecklist" ? generateChecklist.isPending : false}
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              {t(`ai.quickActions.${key}`)}
            </Button>
          ))}
        </div>

        {officialSources && officialSources.length > 0 && (
          <div className="mt-4 rounded-lg border border-info/30 bg-info-bg p-3">
            <p className="text-xs font-semibold text-info">{t("ai.officialSourcesTitle")}</p>
            <ul className="mt-1 flex flex-col gap-1">
              {officialSources.slice(0, 3).map((source) => (
                <li key={source.id} className="text-xs">
                  <a href={source.url} target="_blank" rel="noreferrer noopener" className="text-info underline">
                    {source.title}
                  </a>{" "}
                  <span className="opacity-70">— {source.organization}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {checklistSuggestion && (
          <div className="mt-4 rounded-lg border border-border bg-bg p-4">
            <div className="mb-2 flex items-center justify-between">
              <Badge variant="brand">{t("ai.providerLabel", { provider: checklistSuggestion.provider })}</Badge>
            </div>
            <Alert variant="info" title={t("ai.disclaimerTitle")}>
              {checklistSuggestion.disclaimer}
            </Alert>
            <ul className="mt-3 flex flex-col gap-2">
              {checklistSuggestion.tasks.map((task, i) => (
                <li key={i} className="rounded-md bg-surface p-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-fg">{task.title}</span>
                    <Badge variant="neutral">{t("ai.confidence.ai_generated")}</Badge>
                  </div>
                  {task.explanation && <p className="mt-1 text-fg-muted">{task.explanation}</p>}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setChecklistSuggestion(null)}>
                {t("common.dismiss")}
              </Button>
              <Button size="sm" isLoading={createTask.isPending} onClick={() => void acceptChecklist()}>
                <PlusIcon className="h-4 w-4" /> {t("ai.addTasksToProcess")}
              </Button>
            </div>
          </div>
        )}

        <div className="mt-4 flex max-h-80 flex-col gap-3 overflow-y-auto" aria-live="polite">
          {messages.map((message, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-lg p-3 text-sm",
                message.role === "user" ? "self-end bg-primary text-primary-fg" : "self-start bg-surface-raised text-fg",
              )}
            >
              <p>{message.content}</p>
              {message.role === "assistant" && (
                <p className="mt-2 border-t border-border/50 pt-1 text-xs opacity-70">
                  {t("ai.providerLabel", { provider: message.provider })} · {t("ai.notVerified")}
                </p>
              )}
            </div>
          ))}
        </div>

        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) void sendMessage(input.trim());
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("ai.inputPlaceholder")}
            aria-label={t("ai.inputPlaceholder")}
          />
          <Button type="submit" isLoading={chat.isPending}>
            {t("common.send")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
