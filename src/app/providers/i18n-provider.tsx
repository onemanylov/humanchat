'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { messages as enMessages } from '~/locales/en/messages';
import { messages as csMessages } from '~/locales/cs/messages';
import {
  detect,
  fromUrl,
  fromStorage,
  fromCookie,
  fromNavigator,
} from '@lingui/detect-locale';

type Props = { children: ReactNode };

export const supportedLocales = ['en', 'cs'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

const LANG_KEY = 'lang';

i18n.load({ en: enMessages, cs: csMessages });
i18n.activate('en');

async function loadCatalog(locale: SupportedLocale) {
  const mod = await import(`~/locales/${locale}/messages`);
  i18n.load({ [locale]: mod.messages });
  i18n.activate(locale);
}

type I18nLocaleContextValue = {
  locale: SupportedLocale;
  setLocale: (next: SupportedLocale) => void;
};

const I18nLocaleContext = createContext<I18nLocaleContextValue | undefined>(
  undefined,
);

export function useI18nLocale() {
  const ctx = useContext(I18nLocaleContext);
  if (!ctx)
    throw new Error('useI18nLocale must be used within AppI18nProvider');
  return ctx;
}

export default function AppI18nProvider({ children }: Props) {
  const [locale, setLocaleState] = useState<SupportedLocale>('en');

  // Detect initial locale with user preference taking precedence
  useEffect(() => {
    const detectors: Array<ReturnType<typeof fromUrl>> = [] as never;
    if (typeof window !== 'undefined') {
      // User preference first (storage, cookie), then URL, then browser
      detectors.push(fromStorage(LANG_KEY));
      detectors.push(fromCookie(LANG_KEY) as never);
      detectors.push(fromUrl(LANG_KEY));
      detectors.push(fromNavigator());
    }
    const detectedLocale = detect(...detectors, () => 'en');
    const normalized = (detectedLocale || 'en').split('-')[0];
    const safe = supportedLocales.includes(normalized as SupportedLocale)
      ? (normalized as SupportedLocale)
      : 'en';
    setLocaleState(safe);
  }, []);

  // Persist and load catalogs when locale changes
  useEffect(() => {
    loadCatalog(locale);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LANG_KEY, locale);
      } catch {}
    }
    if (typeof document !== 'undefined') {
      try {
        document.cookie = `${LANG_KEY}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
      } catch {}
    }
  }, [locale]);

  const setLocale = useCallback((next: SupportedLocale) => {
    setLocaleState(next);
  }, []);

  const ctxValue = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return (
    <I18nLocaleContext.Provider value={ctxValue}>
      <I18nProvider i18n={i18n}>{children}</I18nProvider>
    </I18nLocaleContext.Provider>
  );
}
