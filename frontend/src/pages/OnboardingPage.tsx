import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { CategoryPicker } from "@/components/onboarding/CategoryPicker";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";
import { useGenerateChecklist } from "@/features/ai/hooks";
import { useCreateProcess } from "@/features/processes/hooks";
import { createTask as createTaskApi } from "@/api/tasks";
import { useUiStore } from "@/stores/ui-store";
import { toast } from "@/stores/toast-store";
import type { AiChecklistResponse, ProcessCategory } from "@/types/domain";
import { SparklesIcon } from "@/components/ui/icons";

type Step = "input" | "preview";

export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const markOnboardingSeen = useUiStore((s) => s.markOnboardingSeen);
  const [step, setStep] = useState<Step>("input");
  const [goal, setGoal] = useState("");
  const [category, setCategory] = useState<ProcessCategory | null>(null);
  const [suggestion, setSuggestion] = useState<AiChecklistResponse | null>(null);
  const generateChecklist = useGenerateChecklist();
  const createProcess = useCreateProcess();
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);

  function skip() {
    markOnboardingSeen();
    navigate("/", { replace: true });
  }

  async function handleGenerate() {
    if (!goal.trim()) return;
    try {
      const result = await generateChecklist.mutateAsync({ goal: goal.trim(), category: category ?? undefined });
      setSuggestion(result);
      setStep("preview");
    } catch {
      toast({ title: t("ai.errors.requestFailed"), variant: "danger" });
    }
  }

  async function handleAccept() {
    if (!suggestion) return;
    try {
      const process = await createProcess.mutateAsync({
        title: suggestion.process.title,
        category: suggestion.process.category,
        description: suggestion.process.description,
        priority: suggestion.process.priority,
      });
      setIsCreatingTasks(true);
      // Called directly against the API (not through the useCreateTask mutation
      // hook) and sequentially, so each task lands on the process we just
      // created — a hook bound to a processId captured before this process
      // existed would race the state update and misfire the first request.
      for (const task of suggestion.tasks) {
        await createTaskApi(process.id, { title: task.title, explanation: task.explanation });
      }
      markOnboardingSeen();
      toast({ title: t("onboarding.processCreated"), variant: "success" });
      navigate(`/processes/${process.id}`, { replace: true });
    } catch {
      toast({ title: t("processes.createError"), variant: "danger" });
    } finally {
      setIsCreatingTasks(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-fg">{t("onboarding.title")}</h1>
          <p className="mt-1 text-fg-muted">{t("onboarding.subtitle")}</p>
        </div>

        {step === "input" && (
          <Card>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="onboarding-goal" className="text-sm font-medium text-fg">
                  {t("onboarding.goalLabel")}
                </label>
                <Input
                  id="onboarding-goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder={t("onboarding.goalPlaceholder")}
                  autoFocus
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-fg">{t("onboarding.categoryPrompt")}</p>
                <CategoryPicker selected={category} onSelect={setCategory} />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button type="button" onClick={skip} className="text-sm font-medium text-fg-muted hover:underline">
                  {t("onboarding.skip")}
                </button>
                <Button onClick={handleGenerate} isLoading={generateChecklist.isPending} disabled={!goal.trim()}>
                  <SparklesIcon className="h-4 w-4" /> {t("onboarding.generate")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "preview" && suggestion && (
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-fg">{suggestion.process.title}</h2>
                <Badge variant="brand">{t("ai.providerLabel", { provider: suggestion.provider })}</Badge>
              </div>
              <Alert variant="info" title={t("ai.disclaimerTitle")}>
                {suggestion.disclaimer}
              </Alert>
              <ul className="flex flex-col gap-2">
                {suggestion.tasks.map((task, i) => (
                  <li key={i} className="rounded-md border border-border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-fg">{task.title}</span>
                      <Badge variant="neutral">{t("ai.confidence.ai_generated")}</Badge>
                    </div>
                    {task.explanation && <p className="mt-1 text-fg-muted">{task.explanation}</p>}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between gap-3 pt-2">
                <Button variant="secondary" onClick={() => setStep("input")}>
                  {t("common.back")}
                </Button>
                <div className="flex gap-2">
                  <button type="button" onClick={skip} className="px-3 text-sm font-medium text-fg-muted hover:underline">
                    {t("onboarding.skip")}
                  </button>
                  <Button onClick={handleAccept} isLoading={createProcess.isPending || isCreatingTasks}>
                    {t("onboarding.createProcess")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
