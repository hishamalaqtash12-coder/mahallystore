// next.config.mjs
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  sassOptions: {
    includePaths: ['./src/styles'],
  },
  images: {
    unoptimized: true, // Bypass optimization for faster local development with placeholders
    remotePatterns: [
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'http', hostname: 'mahally-test.local' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'secure.gravatar.com' },
    ],
  },
};

export default withNextIntl(nextConfig);