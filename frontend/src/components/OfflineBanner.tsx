import { useTranslation } from "react-i18next";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { WifiOffIcon } from "@/components/ui/icons";

export function OfflineBanner() {
  const online = useOnlineStatus();
  const { t } = useTranslation();

  if (online) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-warning-bg px-4 py-2 text-sm font-medium text-warning"
    >
      <WifiOffIcon className="h-4 w-4" />
      {t("offline.banner")}
    </div>
  );
}
