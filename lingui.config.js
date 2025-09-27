import { defineConfig } from '@lingui/cli';
import { formatter } from '@lingui/format-json';

export default defineConfig({
  locales: ['en', 'cs'],
  sourceLocale: 'en',
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}/messages',
      include: ['<rootDir>/src'],
    },
  ],
  format: formatter({
    style: 'lingui',
    origins: true,
    lineNumbers: true,
    indentation: 2,
  }),
});
