export const COOKIE_CONSENT_STORAGE_KEY = "julishub_cookie_consent";
export const COOKIE_CONSENT_POLICY_VERSION = "2026-05-01";

export type CookieConsentChoice = "all" | "essential";
export type CookieConsentSource = "banner" | "preferences";

export interface CookieConsentRecord {
  choice: CookieConsentChoice;
  timestamp: string;
  policyVersion: string;
  source: CookieConsentSource;
}

const COOKIE_CONSENT_UPDATED_EVENT = "julishub:cookie-consent-updated";
const COOKIE_CONSENT_MANAGE_EVENT = "julishub:cookie-consent-manage";

const isCookieConsentChoice = (value: string | null): value is CookieConsentChoice => (
  value === "all" || value === "essential"
);

const isCookieConsentSource = (value: unknown): value is CookieConsentSource => (
  value === "banner" || value === "preferences"
);

const isCookieConsentRecord = (value: unknown): value is CookieConsentRecord => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<CookieConsentRecord>;

  return (
    isCookieConsentChoice(record.choice ?? null)
    && typeof record.timestamp === "string"
    && typeof record.policyVersion === "string"
    && isCookieConsentSource(record.source)
  );
};

export const getCookieConsentRecord = (): CookieConsentRecord | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);

    if (!storedValue) {
      return null;
    }

    if (isCookieConsentChoice(storedValue)) {
      return {
        choice: storedValue,
        timestamp: "",
        policyVersion: "legacy",
        source: "banner",
      };
    }

    const parsedValue = JSON.parse(storedValue) as unknown;
    return isCookieConsentRecord(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
};

export const getCookieConsent = (): CookieConsentChoice | null => {
  return getCookieConsentRecord()?.choice ?? null;
};

export const setCookieConsent = (value: CookieConsentChoice, source: CookieConsentSource = "banner") => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const consentRecord: CookieConsentRecord = {
      choice: value,
      timestamp: new Date().toISOString(),
      policyVersion: COOKIE_CONSENT_POLICY_VERSION,
      source,
    };

    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consentRecord));
  } finally {
    window.dispatchEvent(new Event(COOKIE_CONSENT_UPDATED_EVENT));
  }
};

export const subscribeCookieConsent = (callback: () => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === COOKIE_CONSENT_STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, callback);
  };
};

export const openCookieConsentPreferences = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(COOKIE_CONSENT_MANAGE_EVENT));
};

export const subscribeCookieConsentPreferences = (callback: () => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(COOKIE_CONSENT_MANAGE_EVENT, callback);

  return () => {
    window.removeEventListener(COOKIE_CONSENT_MANAGE_EVENT, callback);
  };
};