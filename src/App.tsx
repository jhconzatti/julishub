import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { useTranslation } from "react-i18next";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CookieConsent from "./components/CookieConsent";
import { LanguageSEO } from "./components/LanguageSEO";
import LanguageRouter from "./components/LanguageRouter";
import { useAnalytics } from "./hooks/useAnalytics";
import { useCookieConsent } from "./hooks/useCookieConsent";
import { SUPPORTED_LANGS } from "./hooks/use-lang";

// Importação das Páginas
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const Markets = lazy(() => import("./views/Markets"));
const Calculators = lazy(() => import("./views/Calculators"));
const Indicators = lazy(() => import("./views/Indicators"));
const News = lazy(() => import("./views/News"));
const BlogList = lazy(() => import("./views/BlogList"));
const BlogPost = lazy(() => import("./views/BlogPost"));
const PrivacyPolicy = lazy(() => import("./views/PrivacyPolicy"));

const queryClient = new QueryClient();

/**
 * Redirects bare / to the user's detected language (from localStorage / browser).
 * Falls back to pt-BR if the detected language is not supported.
 */
const DefaultLangRedirect = () => {
  const { i18n } = useTranslation();
  const lang = SUPPORTED_LANGS.includes(i18n.language as typeof SUPPORTED_LANGS[number])
    ? i18n.language
    : 'pt-BR';
  return <Navigate to={`/${lang}`} replace />;
};

/**
 * Catches legacy URLs without a language prefix (e.g. /markets → /pt-BR/markets).
 * Also used for bookmarks saved before this refactor.
 */
const LegacyRedirect = () => {
  const location = useLocation();
  const { i18n } = useTranslation();
  const lang = SUPPORTED_LANGS.includes(i18n.language as typeof SUPPORTED_LANGS[number])
    ? i18n.language
    : 'pt-BR';
  return <Navigate to={`/${lang}${location.pathname}${location.search}`} replace />;
};

const removeVercelAnalytics = () => {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  document.querySelectorAll('script[data-sdkn^="@vercel/analytics"], script[src*="/_vercel/insights/script.js"], script[src*="va.vercel-scripts.com/v1/script.debug.js"]').forEach((element) => {
    element.remove();
  });

  window.va = undefined;
  window.vaq = [];
  window.vai = undefined;
  window.vam = undefined;
};

const ConsentAwareAnalytics = () => {
  const consent = useCookieConsent();

  useAnalytics(import.meta.env.VITE_GA_MEASUREMENT_ID);

  useEffect(() => {
    if (consent === "all") {
      return;
    }

    removeVercelAnalytics();
  }, [consent]);

  if (consent !== "all") {
    return null;
  }

  return <Analytics />;
};

const RouteLoading = () => {
  const { t } = useTranslation();

  return (
    <div
      className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      {t("dataStates.loading")}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <ConsentAwareAnalytics />
        {/* Keeps <html lang> and hreflang tags in sync with active language */}
        <LanguageSEO />
        <div className="flex min-h-screen flex-col bg-background font-sans antialiased">

          {/* Header */}
          <Header />

          <main className="flex-1 container mx-auto px-4 py-8">
            <Suspense fallback={<RouteLoading />}>
              <Routes>
                {/* Root: redirect to browser-detected or default language */}
                <Route path="/" element={<DefaultLangRedirect />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />

                {/* Language-prefixed routes — the SEO gold standard */}
                <Route path="/:lang" element={<LanguageRouter />}>
                  <Route index element={<Index />} />
                  <Route path="markets" element={<Markets />} />
                  <Route path="calculators" element={<Calculators />} />
                  <Route path="indicators" element={<Indicators />} />
                  <Route path="news" element={<News />} />
                  <Route path="blog" element={<BlogList />} />
                  <Route path="blog/:slug" element={<BlogPost />} />
                  <Route path="privacy" element={<PrivacyPolicy />} />
                </Route>

                {/* Legacy redirects: /markets → /pt-BR/markets, etc. */}
                <Route path="/markets" element={<LegacyRedirect />} />
                <Route path="/calculators" element={<LegacyRedirect />} />
                <Route path="/indicators" element={<LegacyRedirect />} />
                <Route path="/news" element={<LegacyRedirect />} />
                <Route path="/blog/*" element={<LegacyRedirect />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>

          {/* Footer */}
          <Footer />
          <CookieConsent />

        </div>

        <Toaster />
        <Sonner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
