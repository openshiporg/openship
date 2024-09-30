import { checkAuth } from "@keystone/utils/checkAuth";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const { authenticatedItem: isAuth, redirectToInit } = await checkAuth(req);
  const isInitPage = req.nextUrl.pathname.startsWith('/dashboard/init');
  const isSignInPage = req.nextUrl.pathname.startsWith('/dashboard/signin');
  const isSignUpPage = req.nextUrl.pathname.startsWith('/dashboard/signup');

  // Check if sign-ups are allowed
  const allowSignUp = process.env.NEXT_PUBLIC_ALLOW_SIGNUP === 'true';

  if (redirectToInit && !isInitPage) {
    return NextResponse.redirect(new URL('/dashboard/init', req.url));
  }

  if (!redirectToInit && isInitPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (isSignInPage || isSignUpPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    // Redirect to sign-in if sign-ups are not allowed
    if (isSignUpPage && !allowSignUp) {
      return NextResponse.redirect(new URL('/dashboard/signin', req.url));
    }
    return null;
  }

  if (!isAuth && !isInitPage) {
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }

    return NextResponse.redirect(
      new URL(`/dashboard/signin?from=${encodeURIComponent(from)}`, req.url)
    );
  }
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/dashboard/signin",
    "/dashboard/signup",
    "/dashboard/init",
  ],
};
