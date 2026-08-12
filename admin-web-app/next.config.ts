import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@resvg/resvg-js', 'satori'],
  outputFileTracingIncludes: {
    '/api/cron/send-hours-reminders': [
      './public/email/fonts/**/*',
      './public/email/logo-mark.png',
      './public/email/nudge-bell.gif',
      './public/email/forgot-password-support.png',
      './public/email/forgot-password-support-mobile.png',
      './public/email/forgot-password-contact-us.png',
      './public/email/forgot-password-privacy.png',
      './public/email/forgot-password-unsubscribe.png',
      './public/email/forgot-password-nonprofit.png',
    ],
  },
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
