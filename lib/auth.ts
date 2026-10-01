import NextAuth, { type DefaultSession } from 'next-auth';
import { authConfig } from '@/auth.config';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id?: string;
      role?: 'TEACHER' | 'STUDENT';
    } & DefaultSession['user'];
  }
}

// Ensure canonical production URL when deployed to Vercel or any production environment
const isProduction =
  process.env.NODE_ENV === 'production' ||
  process.env.VERCEL === '1' ||
  !!process.env.VERCEL_URL ||
  !!process.env.VERCEL_PROJECT_PRODUCTION_URL;

if (isProduction) {
  const currentAuthUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
  if (!currentAuthUrl || currentAuthUrl.includes('localhost') || currentAuthUrl.includes('127.0.0.1')) {
    const canonicalHost =
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : undefined) ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
      'https://patun-ai.vercel.app';

    process.env.AUTH_URL = canonicalHost;
    process.env.NEXTAUTH_URL = canonicalHost;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  secret: process.env.AUTH_SECRET || 'aegis_exam_secret_key_hackathon_2026_demo'
});
