/**
 * Auth-route helpers shared by the proxy, middleware, auth screens and actions.
 * Plain module: no 'use server' / 'use client', no @/ imports.
 */

export const DASHBOARD_BASE_PATH = '/dashboard'

type Env = Record<string, string | undefined>

/** Exact match for a single-page auth route, so `/dashboard/resets` is not the reset page. */
export function isDashboardRoute(pathname: string, route: 'init' | 'signin' | 'signup' | 'reset' | 'no-access') {
  const target = `${DASHBOARD_BASE_PATH}/${route}`
  return pathname === target || pathname === `${target}/`
}

/** The dashboard sign-up page is only open when the existing PUBLIC_SIGNUPS_ALLOWED switch is on. */
export function publicSignUpsAllowed(env: Env = process.env) {
  return env.PUBLIC_SIGNUPS_ALLOWED === 'true'
}

/** Reset links need the existing mail transport; without SMTP_HOST nothing can be delivered. */
export function passwordResetEmailAvailable(env: Env = process.env) {
  return Boolean(env.SMTP_HOST)
}

export const RESET_EMAIL_UNAVAILABLE =
  'Password reset emails are not available because email delivery is not set up. Ask an administrator to set a new password for you.'
