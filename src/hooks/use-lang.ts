import { useTranslation } from 'react-i18next';

export const SUPPORTED_LANGS = ['pt-BR', 'en', 'es'] as const;
export type SupportedLang = typeof SUPPORTED_LANGS[number];

/**
 * useLang — returns the current active language and a path builder.
 *
 * lp('/markets')  → '/pt-BR/markets'
 * lp('/')         → '/pt-BR'
 *
 * Reads from i18next instead of useParams so it works in components
 * outside the /:lang Route subtree (Header, Footer, etc.).
 */
export const useLang = () => {
  const { i18n } = useTranslation();
  const lang: string = SUPPORTED_LANGS.includes(i18n.language as SupportedLang)
    ? i18n.language
    : 'pt-BR';

  const lp = (path: string) => `/${lang}${path === '/' ? '' : path}`;

  return { lang, lp };
};
