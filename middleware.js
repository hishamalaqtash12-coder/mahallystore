import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames
  matcher: [
    '/', 
    '/(ar|en)/:path*', 
    // Exclude API routes, next internals, and static files
    '/((?!api|_next|static|.*\\..*).*)'
  ]
};
