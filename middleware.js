import { checkAuth } from "@keystone/utils/checkAuth";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const { authenticatedItem: isAuth, redirectToInit } = await checkAuth(req);
  const isInitPage = req.nextUrl.pathname.startsWith('/dashboard/init');
  const isSignInPage = req.nextUrl.pathname.startsWith('/dashboard/signin');

  if (redirectToInit && !isInitPage) {
    console.log("1")
    return NextResponse.redirect(new URL('/dashboard/init', req.url));
  }

  if (!redirectToInit && isInitPage) {
    console.log("2")
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (isSignInPage) {
    console.log("3")
    if (isAuth) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return null;
  }

  if (!isAuth && !isInitPage) {
    console.log("4")
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }
    console.log("5")

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
    "/dashboard/init",
  ],
};
