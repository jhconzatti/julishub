import { useEffect, useId, useRef, useState } from "react";
import { Cookie, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  setCookieConsent,
  subscribeCookieConsentPreferences,
  type CookieConsentSource,
} from "@/lib/cookieConsent";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { useLang } from "@/hooks/use-lang";

export default function CookieConsent() {
  const { t } = useTranslation();
  const { lp } = useLang();
  const consent = useCookieConsent();
  const [isVisible, setIsVisible] = useState(() => consent === null);
  const [consentSource, setConsentSource] = useState<CookieConsentSource>("banner");
  const dialogRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    setIsVisible(consent === null);
  }, [consent]);

  useEffect(() => subscribeCookieConsentPreferences(() => {
    setConsentSource("preferences");
    setIsVisible(true);
  }), []);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    dialogRef.current?.focus();
  }, [isVisible]);

  const handleConsent = (choice: "all" | "essential") => {
    setCookieConsent(choice, consentSource);
    setIsVisible(false);
    setConsentSource("banner");
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-live="polite"
        tabIndex={-1}
        className="pointer-events-auto mx-auto flex max-w-5xl flex-col gap-5 rounded-2xl border border-border/60 bg-background/95 p-5 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:flex">
              <Cookie className="h-5 w-5" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t("cookieConsent.badge")}
              </div>

              <div className="space-y-2">
                <h2 id={titleId} className="text-lg font-semibold tracking-tight text-foreground">
                  {t("cookieConsent.title")}
                </h2>
                <p id={descriptionId} className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  {t("cookieConsent.description")}{" "}
                  <Link
                    to={lp("/privacy")}
                    className="font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
                  >
                    {t("cookieConsent.policyLink")}
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:min-w-72 sm:max-w-80 sm:grid-cols-2">
            <Button size="lg" variant="outline" onClick={() => handleConsent("essential")}>
              {t("cookieConsent.essentialOnly")}
            </Button>
            <Button size="lg" variant="outline" onClick={() => handleConsent("all")}>
              {t("cookieConsent.acceptAll")}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}