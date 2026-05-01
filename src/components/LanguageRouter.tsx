import { useEffect } from 'react';
import { useParams, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGS } from '@/hooks/use-lang';

/**
 * LanguageRouter — Layout route for /:lang
 *
 * Responsibilities:
 * 1. Validates :lang URL param — redirects to /pt-BR if unrecognised
 * 2. Keeps i18next language in sync with the URL param
 * 3. Renders <Outlet /> (the page content) once the lang is valid
 */
const LanguageRouter = () => {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    if (!lang || !SUPPORTED_LANGS.includes(lang as typeof SUPPORTED_LANGS[number])) {
      // Strip whatever was in the first path segment and redirect to /pt-BR
      const rest = location.pathname.replace(/^\/[^/]*/, '');
      navigate(`/pt-BR${rest || ''}`, { replace: true });
      return;
    }

    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Don't render children while redirect is pending for invalid langs
  if (!lang || !SUPPORTED_LANGS.includes(lang as typeof SUPPORTED_LANGS[number])) {
    return null;
  }

  return <Outlet />;
};

export default LanguageRouter;
