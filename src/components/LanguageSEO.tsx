import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

/**
 * LanguageSEO
 *
 * 1. <html lang="…"> — kept in sync with the active i18next language.
 *
 * 2. <link rel="alternate" hreflang="…"> — each language now points to its
 *    own URL (e.g. /en/markets, /pt-BR/markets, /es/markets), which is the
 *    SEO gold standard. Google treats these as separate canonical pages.
 */

const ALTERNATE_LANGS = [
  { code: 'pt-BR', hreflang: 'pt-BR' },
  { code: 'en',    hreflang: 'en' },
  { code: 'es',    hreflang: 'es' },
];

const LANG_TO_HTML: Record<string, string> = {
  'pt-BR': 'pt-BR',
  en:      'en',
  es:      'es',
};

const BASE_URL = 'https://julishub.vercel.app';

const getPagePath = (pathname: string) => {
  const [, firstSegment = ''] = pathname.split('/');

  if (!firstSegment) {
    return '';
  }

  const hasLanguagePrefix = ALTERNATE_LANGS.some(({ code }) => code === firstSegment);

  return hasLanguagePrefix
    ? pathname.replace(new RegExp(`^/${firstSegment}`), '') || ''
    : pathname;
};

export const LanguageSEO = () => {
  const { i18n } = useTranslation();
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. Keep <html lang="…"> in sync
    const htmlLang = LANG_TO_HTML[i18n.language] ?? 'pt-BR';
    document.documentElement.lang = htmlLang;

    // 2. Remove any previously injected hreflang tags
    document.querySelectorAll('link[data-hreflang]').forEach((el) => el.remove());

    // Strip the /:lang segment from the current path to get the page path.
    // e.g. /pt-BR/markets → /markets  |  /en → ''
    const pagePath = getPagePath(pathname);

    // 3. Inject one <link rel="alternate"> per supported language
    ALTERNATE_LANGS.forEach(({ code, hreflang }) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = hreflang;
      link.href = `${BASE_URL}/${code}${pagePath}`;
      link.setAttribute('data-hreflang', hreflang);
      document.head.appendChild(link);
    });

    // 4. x-default → canonical default (Portuguese)
    const xDefault = document.createElement('link');
    xDefault.rel = 'alternate';
    xDefault.hreflang = 'x-default';
    xDefault.href = `${BASE_URL}/pt-BR${pagePath}`;
    xDefault.setAttribute('data-hreflang', 'x-default');
    document.head.appendChild(xDefault);

  }, [i18n.language, pathname]);

  return null;
};

