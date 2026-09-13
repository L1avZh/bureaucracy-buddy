import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { buttonVariants } from "@/components/ui/buttonVariants";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-4 text-center">
      <p className="text-5xl" aria-hidden="true">
        🧭
      </p>
      <h1 className="text-2xl font-semibold text-fg">{t("notFound.title")}</h1>
      <p className="max-w-sm text-fg-muted">{t("notFound.description")}</p>
      <Link to="/" className={buttonVariants("primary")}>
        {t("notFound.backHome")}
      </Link>
    </div>
  );
}
