import { useEffect, useState } from "react";
import { AlertCircle, Clock3, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function SlowLoadingNotice({ loading }: { loading: boolean }) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!loading) {
      setShow(false);
      return;
    }
    const timeoutId = window.setTimeout(() => setShow(true), 5_000);
    return () => window.clearTimeout(timeoutId);
  }, [loading]);

  if (!show) return null;

  return (
    <Alert className="border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20">
      <Clock3 className="h-4 w-4" />
      <AlertDescription>{t("dataStates.slow")}</AlertDescription>
    </Alert>
  );
}

export function StaleDataNotice({ timestamp }: { timestamp: number | null }) {
  const { t, i18n } = useTranslation();
  const formattedTimestamp = timestamp
    ? new Intl.DateTimeFormat(i18n.language, { dateStyle: "short", timeStyle: "short" }).format(timestamp)
    : null;

  return (
    <Alert className="border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20">
      <Clock3 className="h-4 w-4" />
      <AlertDescription>
        {t("dataStates.stale")}
        {formattedTimestamp ? ` ${t("dataStates.staleAt", { date: formattedTimestamp })}` : ""}
      </AlertDescription>
    </Alert>
  );
}

export function DataFreshness({ timestamp }: { timestamp: number | null }) {
  const { t, i18n } = useTranslation();
  const formattedTimestamp = timestamp
    ? new Intl.DateTimeFormat(i18n.language, { dateStyle: "short", timeStyle: "short" }).format(timestamp)
    : null;

  if (!formattedTimestamp) return null;

  return (
    <p className="text-xs text-muted-foreground" role="status">
      {t("dataStates.currentAt", { date: formattedTimestamp })}
    </p>
  );
}

interface DataUnavailableProps {
  onRetry: () => void;
  retrying?: boolean;
  external?: boolean;
}

export function DataUnavailable({ onRetry, retrying = false, external = false }: DataUnavailableProps) {
  const { t } = useTranslation();

  return (
    <Alert variant="destructive" className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <AlertDescription>{t(external ? "dataStates.externalUnavailable" : "dataStates.unavailable")}</AlertDescription>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onRetry} disabled={retrying}>
        <RefreshCw className={`mr-2 h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
        {t("dataStates.retry")}
      </Button>
    </Alert>
  );
}
