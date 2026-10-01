import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = (req.auth?.user as { role?: string } | undefined)?.role;

  const isTeacherRoute = nextUrl.pathname.startsWith('/teacher');
  const isExamRoute = nextUrl.pathname.startsWith('/exam');
  const isJoinRoute = nextUrl.pathname.startsWith('/join');

  // Unified code entry is on the landing page (/)
  if (isJoinRoute) {
    return NextResponse.redirect(new URL('/', nextUrl.origin));
  }

  // Teacher portal requires an authenticated user with TEACHER role
  if (isTeacherRoute) {
    if (!isLoggedIn || userRole !== 'TEACHER') {
      return NextResponse.redirect(new URL('/', nextUrl.origin));
    }
  }

  // Student exam room requires an authenticated Google user
  if (isExamRoute) {
    if (!isLoggedIn) {
      const redirectUrl = new URL('/', nextUrl.origin);
      redirectUrl.searchParams.set('callbackUrl', nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/teacher/:path*', '/exam/:path*', '/join', '/join/:path*']
};
