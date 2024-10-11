import { NextResponse } from 'next/server';
import { checkAuth } from "@keystone/utils/checkAuth";

export async function middleware(request) {
  const { authenticatedItem: isAuth, redirectToInit } = await checkAuth(request);

  // Paths that don't require authentication
  const publicPaths = ['/signin', '/signup', '/reset', '/init'];
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

  // Check if sign-ups are allowed
  const allowSignUp = process.env.ALLOW_EXTERNAL_SIGNUPS === 'true';

  if (redirectToInit && !request.nextUrl.pathname.startsWith('/init')) {
    return NextResponse.redirect(new URL('/init', request.url));
  }

  if (!redirectToInit && request.nextUrl.pathname.startsWith('/init')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isPublicPath) {
    if (isAuth && !request.nextUrl.pathname.startsWith('/reset')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Redirect to sign-in if sign-ups are not allowed and the user is trying to access the signup page
    if (request.nextUrl.pathname.startsWith('/signup') && !allowSignUp) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }
    return NextResponse.next();
  }

  if (!isAuth) {
    const from = request.nextUrl.pathname + request.nextUrl.search;
    return NextResponse.redirect(new URL(`/signin?from=${encodeURIComponent(from)}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/graphql (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/graphql|_next/static|_next/image|favicon.ico).*)',
  ],
};
