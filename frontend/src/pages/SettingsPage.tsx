import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FieldGroup, FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { useUpdateMe } from "@/features/auth/hooks";
import { useExportDocumentsZip, useExportJson, useImportData } from "@/features/export/hooks";
import { toast } from "@/stores/toast-store";
import { ApiError } from "@/api/client";
import { exportDataSchema } from "@/schemas/export";
import { DownloadIcon, MonitorIcon, MoonIcon, SunIcon, UploadIcon } from "@/components/ui/icons";
import type { Locale, ThemePreference } from "@/types/domain";

const generalFormSchema = z.object({
  display_name: z.string().min(1, "settings.general.errors.nameRequired"),
});
type GeneralFormValues = z.infer<typeof generalFormSchema>;

export function SettingsPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const updateMe = useUpdateMe();
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const locale = useUiStore((s) => s.locale);
  const setLocale = useUiStore((s) => s.setLocale);
  const reducedMotion = useUiStore((s) => s.reducedMotion);
  const setReducedMotion = useUiStore((s) => s.setReducedMotion);
  const resetOnboarding = useUiStore((s) => s.resetOnboarding);

  const exportJson = useExportJson();
  const exportZip = useExportDocumentsZip();
  const importData = useImportData();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importConfirmed, setImportConfirmed] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GeneralFormValues>({
    resolver: zodResolver(generalFormSchema),
    defaultValues: { display_name: user?.display_name ?? "" },
  });

  async function onSaveGeneral(values: GeneralFormValues) {
    try {
      await updateMe.mutateAsync(values);
      toast({ title: t("settings.general.saveSuccess"), variant: "success" });
    } catch (error) {
      toast({ title: t("settings.general.saveError"), description: error instanceof ApiError ? error.message : undefined, variant: "danger" });
    }
  }

  function handleThemeChange(next: ThemePreference) {
    setTheme(next);
    updateMe.mutate({ theme: next });
  }

  function handleLocaleChange(next: Locale) {
    setLocale(next);
    updateMe.mutate({ locale: next });
  }

  async function handleImport() {
    if (!importFile) return;
    try {
      const text = await importFile.text();
      const parsed = exportDataSchema.safeParse(JSON.parse(text));
      if (!parsed.success) {
        toast({ title: t("settings.data.importInvalidFile"), variant: "danger" });
        return;
      }
      await importData.mutateAsync(parsed.data);
      toast({ title: t("settings.data.importSuccess"), variant: "success" });
      setImportFile(null);
      setImportConfirmed(false);
    } catch (error) {
      toast({ title: t("settings.data.importError"), description: error instanceof ApiError ? error.message : undefined, variant: "danger" });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-fg">{t("nav.settings")}</h1>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{t("settings.tabs.general")}</TabsTrigger>
          <TabsTrigger value="appearance">{t("settings.tabs.appearance")}</TabsTrigger>
          <TabsTrigger value="notifications">{t("settings.tabs.notifications")}</TabsTrigger>
          <TabsTrigger value="privacy">{t("settings.tabs.privacy")}</TabsTrigger>
          <TabsTrigger value="ai">{t("settings.tabs.ai")}</TabsTrigger>
          <TabsTrigger value="data">{t("settings.tabs.data")}</TabsTrigger>
          <TabsTrigger value="about">{t("settings.tabs.about")}</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.general.title")}</CardTitle>
              <CardDescription>{t("settings.general.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSaveGeneral)} noValidate className="max-w-sm">
                <FieldGroup>
                  <FormField label={t("settings.general.email")}>
                    <Input value={user?.email ?? ""} disabled readOnly />
                  </FormField>
                  <FormField
                    label={t("settings.general.displayName")}
                    error={errors.display_name && t(errors.display_name.message ?? "")}
                  >
                    <Input {...register("display_name")} />
                  </FormField>
                  <FormField label={t("settings.general.language")}>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={locale === "en" ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => handleLocaleChange("en")}
                      >
                        English
                      </Button>
                      <Button
                        type="button"
                        variant={locale === "he" ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => handleLocaleChange("he")}
                      >
                        עברית
                      </Button>
                    </div>
                  </FormField>
                </FieldGroup>
                <Button type="submit" className="mt-4" isLoading={updateMe.isPending}>
                  {t("common.saveChanges")}
                </Button>
              </form>
              <div className="mt-6 border-t border-border pt-4">
                <Button variant="secondary" size="sm" onClick={resetOnboarding}>
                  {t("settings.general.replayOnboarding")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.appearance.title")}</CardTitle>
              <CardDescription>{t("settings.appearance.description")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div>
                <p className="mb-2 text-sm font-medium text-fg">{t("settings.appearance.theme")}</p>
                <div className="flex gap-2">
                  {(["light", "dark", "system"] as ThemePreference[]).map((option) => (
                    <Button
                      key={option}
                      variant={theme === option ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => handleThemeChange(option)}
                      aria-pressed={theme === option}
                    >
                      {option === "light" && <SunIcon className="h-4 w-4" />}
                      {option === "dark" && <MoonIcon className="h-4 w-4" />}
                      {option === "system" && <MonitorIcon className="h-4 w-4" />}
                      {t(`settings.appearance.themeOptions.${option}`)}
                    </Button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-fg">
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                {t("settings.appearance.reducedMotion")}
              </label>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.notifications.title")}</CardTitle>
              <CardDescription>{t("settings.notifications.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="info">{t("settings.notifications.localOnlyNote")}</Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.privacy.title")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-fg-muted">
              <p>{t("settings.privacy.documentsNote")}</p>
              <p>{t("settings.privacy.aiNote")}</p>
              <p>{t("settings.privacy.accountNote")}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.ai.title")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-fg-muted">
              <p>{t("settings.ai.providerNote")}</p>
              <div className="flex items-center gap-2">
                <Badge variant="brand">{t("settings.ai.mockLabel")}</Badge>
                <span>{t("settings.ai.mockDescription")}</span>
              </div>
              <p>{t("settings.ai.disclaimerNote")}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.data.title")}</CardTitle>
              <CardDescription>{t("settings.data.description")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" isLoading={exportJson.isPending} onClick={() => exportJson.mutate()}>
                  <DownloadIcon className="h-4 w-4" /> {t("settings.data.exportJson")}
                </Button>
                <Button variant="secondary" isLoading={exportZip.isPending} onClick={() => exportZip.mutate()}>
                  <DownloadIcon className="h-4 w-4" /> {t("settings.data.exportZip")}
                </Button>
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <p className="text-sm font-medium text-fg">{t("settings.data.importTitle")}</p>
                <Alert variant="warning">{t("settings.data.importWarning")}</Alert>
                <input
                  type="file"
                  accept="application/json"
                  aria-label={t("settings.data.importTitle")}
                  onChange={(e) => {
                    setImportFile(e.target.files?.[0] ?? null);
                    setImportConfirmed(false);
                  }}
                  className="text-sm text-fg-muted"
                />
                {importFile && (
                  <label className="flex items-center gap-2 text-sm text-fg">
                    <input
                      type="checkbox"
                      checked={importConfirmed}
                      onChange={(e) => setImportConfirmed(e.target.checked)}
                      className="h-4 w-4 rounded border-border"
                    />
                    {t("settings.data.importConfirm")}
                  </label>
                )}
                <Button
                  variant="danger"
                  className="w-fit"
                  disabled={!importFile || !importConfirmed}
                  isLoading={importData.isPending}
                  onClick={() => void handleImport()}
                >
                  <UploadIcon className="h-4 w-4" /> {t("settings.data.importAction")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>{t("app.name")}</CardTitle>
              <CardDescription>{t("settings.about.description")}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-fg-muted">
              <p>{t("settings.about.version", { version: "0.1.0" })}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
