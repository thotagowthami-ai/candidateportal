import type { VercelConfig } from '@vercel/config';

const isProduction = process.env.VERCEL_ENV === 'production';
const apiDestination = isProduction
  ? 'https://cportal-production.up.railway.app/api/$1'
  : 'https://staging.cportal.com/api/$1'; // Uses staging or mock API for previews

export default {
  rewrites: [
    {
      source: '/api/(.*)',
      destination: apiDestination,
    },
    {
      source: '/(.*)',
      destination: '/index.html',
    },
  ],
} as VercelConfig;
