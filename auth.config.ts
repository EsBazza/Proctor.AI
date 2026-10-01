import type { NextAuthConfig, DefaultSession } from 'next-auth';
import Google from 'next-auth/providers/google';

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

export const authConfig = {
  trustHost: true,
  basePath: '/api/auth',
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || '',
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.rosters.readonly https://www.googleapis.com/auth/classroom.profile.emails https://www.googleapis.com/auth/classroom.profile.photos https://www.googleapis.com/auth/classroom.coursework.students https://www.googleapis.com/auth/classroom.coursework.me',
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        if (user) {
          token.id = user.id;
        }

        try {
          let isTeacher = false;

          // Purely dynamic check: Ask Google Classroom API if user teaches active courses
          if (account.access_token) {
            const res = await fetch(
              'https://classroom.googleapis.com/v1/courses?teacherId=me&courseStates=ACTIVE',
              {
                headers: {
                  Authorization: `Bearer ${account.access_token}`
                }
              }
            );

            if (res.ok) {
              const data = await res.json();
              if (data.courses && data.courses.length > 0) {
                isTeacher = true;
              }
            }
          }

          // Optional dynamic environment variable override
          if (user?.email && process.env.DEFAULT_TEACHER_EMAIL) {
            if (process.env.DEFAULT_TEACHER_EMAIL.toLowerCase() === user.email.toLowerCase()) {
              isTeacher = true;
            }
          }

          token.role = isTeacher ? 'TEACHER' : 'STUDENT';
        } catch {
          token.role = 'STUDENT';
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as 'TEACHER' | 'STUDENT') || 'STUDENT';
        session.user.id = token.id as string;
      }
      session.accessToken = token.accessToken as string;
      return session;
    }
  },
  pages: {
    signIn: '/',
    error: '/'
  },
  secret: process.env.AUTH_SECRET || 'aegis_exam_secret_key_hackathon_2026_demo'
} satisfies NextAuthConfig;
