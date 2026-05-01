import { useEffect, useState } from "react";
import {
  getCookieConsent,
  subscribeCookieConsent,
  type CookieConsentChoice,
} from "@/lib/cookieConsent";

export const useCookieConsent = () => {
  const [consent, setConsent] = useState<CookieConsentChoice | null>(() => getCookieConsent());

  useEffect(() => subscribeCookieConsent(() => {
    setConsent(getCookieConsent());
  }), []);

  return consent;
};

export default useCookieConsent;