import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { registerFormSchema } from "@/schemas/auth";
import type { RegisterFormValues } from "@/schemas/auth";
import { useRegister } from "@/features/auth/hooks";
import { Button } from "@/components/ui/Button";
import { FieldGroup, FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { ApiError } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerFormSchema) });

  async function onSubmit(values: RegisterFormValues) {
    try {
      await registerMutation.mutateAsync(values);
      navigate("/onboarding", { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setError("root", { message: error.message });
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("auth.registerTitle")}</CardTitle>
          <CardDescription>{t("auth.registerDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              {errors.root && <Alert variant="danger">{errors.root.message}</Alert>}
              <FormField
                label={t("auth.displayName")}
                required
                error={errors.display_name && t(errors.display_name.message ?? "")}
              >
                <Input autoComplete="name" {...register("display_name")} autoFocus />
              </FormField>
              <FormField label={t("auth.email")} required error={errors.email && t(errors.email.message ?? "")}>
                <Input type="email" autoComplete="email" {...register("email")} />
              </FormField>
              <FormField
                label={t("auth.password")}
                required
                hint={t("auth.passwordHint")}
                error={errors.password && t(errors.password.message ?? "")}
              >
                <Input type="password" autoComplete="new-password" {...register("password")} />
              </FormField>
            </FieldGroup>
            <Button type="submit" className="mt-6 w-full" isLoading={registerMutation.isPending}>
              {t("auth.createAccount")}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-fg-muted">
            {t("auth.haveAccount")}{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              {t("auth.logIn")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
