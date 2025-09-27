'use client';

import { useCallback } from 'react';
import {
  supportedLocales,
  type SupportedLocale,
  useI18nLocale,
} from '~/app/providers/i18n-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18nLocale();

  const onValueChange = useCallback(
    (value: string) => {
      setLocale(value as SupportedLocale);
    },
    [setLocale],
  );

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="language" className="text-sm opacity-80">
        Language
      </label>
      <Select value={locale} onValueChange={onValueChange}>
        <SelectTrigger id="language" className="h-10 rounded-full px-3 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {supportedLocales.map((l) => (
            <SelectItem key={l} value={l}>
              {l.toUpperCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
