import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { loginFormSchema } from "@/schemas/auth";
import type { LoginFormValues } from "@/schemas/auth";
import { useLogin } from "@/features/auth/hooks";
import { Button } from "@/components/ui/Button";
import { FieldGroup, FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { ApiError } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema) });

  async function onSubmit(values: LoginFormValues) {
    try {
      await login.mutateAsync(values);
      const from = (location.state as { from?: { pathname: string } } | null)?.from;
      navigate(from?.pathname ?? "/", { replace: true });
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
          <CardTitle>{t("auth.loginTitle")}</CardTitle>
          <CardDescription>{t("auth.loginDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              {errors.root && <Alert variant="danger">{errors.root.message}</Alert>}
              <FormField label={t("auth.email")} required error={errors.email && t(errors.email.message ?? "")}>
                <Input type="email" autoComplete="email" {...register("email")} autoFocus />
              </FormField>
              <FormField
                label={t("auth.password")}
                required
                error={errors.password && t(errors.password.message ?? "")}
              >
                <Input type="password" autoComplete="current-password" {...register("password")} />
              </FormField>
            </FieldGroup>
            <Button type="submit" className="mt-6 w-full" isLoading={login.isPending}>
              {t("auth.logIn")}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-fg-muted">
            {t("auth.noAccount")}{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              {t("auth.register")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
