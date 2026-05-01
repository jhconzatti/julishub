import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useCookieConsent } from "@/hooks/useCookieConsent";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

const GA_EXTERNAL_SCRIPT_ID = "julishub-ga-external";
const GA_INLINE_SCRIPT_ID = "julishub-ga-inline";
const EXPIRED_COOKIE_DATE = "Thu, 01 Jan 1970 00:00:00 GMT";

const getDomainCandidates = (hostname: string) => {
  const domains = new Set<string | undefined>([undefined, hostname, `.${hostname}`]);
  const parts = hostname.split(".");

  for (let index = 0; index < parts.length - 1; index += 1) {
    const domain = parts.slice(index).join(".");
    domains.add(domain);
    domains.add(`.${domain}`);
  }

  return Array.from(domains);
};

const isGaCookie = (cookieName: string) => (
  cookieName === "_ga" || cookieName === "_gid" || cookieName === "_gat" || cookieName.startsWith("_ga_")
);

const clearGaCookies = () => {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  const cookieNames = document.cookie
    .split(";")
    .map((item) => item.trim().split("=")[0])
    .filter(Boolean)
    .filter(isGaCookie);

  if (cookieNames.length === 0) {
    return;
  }

  const domainCandidates = getDomainCandidates(window.location.hostname);

  cookieNames.forEach((cookieName) => {
    domainCandidates.forEach((domain) => {
      const domainPart = domain ? `; domain=${domain}` : "";
      document.cookie = `${cookieName}=; expires=${EXPIRED_COOKIE_DATE}; path=/${domainPart}; SameSite=Lax`;
    });
  });
};

const removeGaScripts = () => {
  document.getElementById(GA_EXTERNAL_SCRIPT_ID)?.remove();
  document.getElementById(GA_INLINE_SCRIPT_ID)?.remove();
};

const setGaDisabled = (measurementId: string, disabled: boolean) => {
  window[`ga-disable-${measurementId}`] = disabled;
};

const injectGaScripts = (measurementId: string) => {
  if (document.getElementById(GA_EXTERNAL_SCRIPT_ID) && document.getElementById(GA_INLINE_SCRIPT_ID)) {
    return;
  }

  const externalScript = document.createElement("script");
  externalScript.id = GA_EXTERNAL_SCRIPT_ID;
  externalScript.async = true;
  externalScript.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;

  const inlineScript = document.createElement("script");
  inlineScript.id = GA_INLINE_SCRIPT_ID;
  inlineScript.text = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('consent', 'default', { analytics_storage: 'denied' });
    gtag('js', new Date());
    gtag('config', '${measurementId}', { anonymize_ip: true, send_page_view: false });
  `;

  document.head.appendChild(externalScript);
  document.head.appendChild(inlineScript);
};

const teardownGa = (measurementId: string) => {
  setGaDisabled(measurementId, true);
  removeGaScripts();
  clearGaCookies();
  window.dataLayer = [];
  window.gtag = undefined;
};

export const useAnalytics = (measurementId?: string) => {
  const location = useLocation();
  const consent = useCookieConsent();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const trimmedMeasurementId = measurementId?.trim();
    if (!trimmedMeasurementId) {
      return;
    }

    if (consent !== "all") {
      teardownGa(trimmedMeasurementId);
      return;
    }

    setGaDisabled(trimmedMeasurementId, false);
    injectGaScripts(trimmedMeasurementId);
    window.gtag?.("consent", "update", { analytics_storage: "granted" });
  }, [consent, measurementId]);

  useEffect(() => {
    const trimmedMeasurementId = measurementId?.trim();

    if (!trimmedMeasurementId || consent !== "all" || typeof window.gtag !== "function") {
      return;
    }

    const pagePath = `${location.pathname}${location.search}`;

    window.gtag("event", "page_view", {
      page_title: document.title,
      page_path: pagePath,
      page_location: window.location.href,
      send_to: trimmedMeasurementId,
    });
  }, [consent, location.pathname, location.search, measurementId]);
};

export default useAnalytics;