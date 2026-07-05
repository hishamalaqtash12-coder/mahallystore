import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';
 
export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  // as-needed means /about instead of /ar/about for default locale
  localePrefix: 'as-needed',
  // Never redirect based on browser language — always serve Arabic at /
  localeDetection: false
});
 
export const {Link, redirect, usePathname, useRouter} = createNavigation(routing);
